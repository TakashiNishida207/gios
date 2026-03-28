// src/sync/notionFieldFetcher.ts
// Notion Field Fetcher — Notion API アクセスの単一ゲートウェイ
// 副作用: Notion API への読み取りのみ（書き込みは syncErrorHandler 経由のみ）
// 因果ループ: Notion DB → raw value → 正規化値

import { Client, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { recordSyncError } from "./syncErrorHandler";

// ─── DB キー → 環境変数名マッピング ──────────────────────────────────────────

const DB_ENV_MAP: Record<string, string> = {
  "Customer":              "NOTION_DATABASE_ID_CUSTOMER",
  "PowerMeeting":          "NOTION_DATABASE_ID_POWERMEETING",
  "Voice":                 "NOTION_DATABASE_ID_VOICE",
  "Story":                 "NOTION_DATABASE_ID_STORY",
  "Pain":                  "NOTION_DATABASE_ID_PAIN",
  "GrowthCausalMap":       "NOTION_DATABASE_ID_GROWTH",
  "NextAction":            "NOTION_DATABASE_ID_NEXTACTION",
  "AIAgent":               "NOTION_DATABASE_ID_AIAGENT",
};

// ─── 差分同期キャッシュ ───────────────────────────────────────────────────────
// DB ごとに最後に取得したページの last_edited_time を保持する。
// 変更なければキャッシュから返し、Notion API 呼び出しをスキップする。

type DBCache = {
  lastEditedTime: string;
  pages:          PageObjectResponse[];
};

const dbCache = new Map<string, DBCache>();

// ─── Notion クライアント（シングルトン） ──────────────────────────────────────

let _client: Client | null = null;

function getClient(): Client {
  if (!_client) {
    const key = process.env.NOTION_API_KEY;
    if (!key) throw new Error("NOTION_API_KEY が設定されていません");
    _client = new Client({ auth: key });
  }
  return _client;
}

// ─── DB ページ取得（差分チェック付き） ───────────────────────────────────────

async function fetchPages(db: string): Promise<PageObjectResponse[]> {
  const envKey = DB_ENV_MAP[db];
  if (!envKey) {
    recordSyncError("SyncFailure", db, "*", `DB キー '${db}' は DB_ENV_MAP に未登録`);
    return [];
  }
  const databaseId = process.env[envKey];
  if (!databaseId) {
    recordSyncError("SyncFailure", db, "*", `環境変数 ${envKey} が未設定`);
    return [];
  }

  const client = getClient();

  // 最新の last_edited_time を取得して差分チェック
  const probe = await client.databases.query({
    database_id: databaseId,
    sorts:        [{ timestamp: "last_edited_time", direction: "descending" }],
    page_size:    1,
  });

  const latestPage = probe.results.find(isFullPage);
  const latestTime = latestPage?.last_edited_time ?? "";
  const cached     = dbCache.get(db);

  // 差分なし → キャッシュを返す
  if (cached && cached.lastEditedTime === latestTime && cached.pages.length > 0) {
    return cached.pages;
  }

  // 差分あり → 全ページ取得
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const res = await client.databases.query({
      database_id: databaseId,
      sorts:        [{ timestamp: "last_edited_time", direction: "descending" }],
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    pages.push(...res.results.filter(isFullPage));
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  dbCache.set(db, { lastEditedTime: latestTime, pages });
  return pages;
}

// ─── フィールド値の抽出 ───────────────────────────────────────────────────────

function extractNumber(page: PageObjectResponse, field: string): number | null {
  const prop = page.properties[field];
  if (!prop) return null;

  switch (prop.type) {
    case "number":
      return prop.number;
    case "formula":
      return prop.formula.type === "number" ? prop.formula.number : null;
    case "rollup":
      return prop.rollup.type === "number" ? prop.rollup.number : null;
    default:
      return null;
  }
}

// ─── 公開 API ─────────────────────────────────────────────────────────────────

/**
 * 指定 DB の最新ページから数値フィールドを取得する。
 * フィールドが存在しない / 型不一致の場合は null を返す。
 */
export async function fetchField(db: string, field: string): Promise<number | null> {
  try {
    const pages = await fetchPages(db);
    if (pages.length === 0) {
      recordSyncError("MissingField", db, field, `DB '${db}' にページが存在しない`);
      return null;
    }
    // 最新ページのフィールド値を取得
    const value = extractNumber(pages[0], field);
    if (value === null) {
      recordSyncError("MissingField", db, field, `フィールド '${field}' が null または未存在`);
    }
    return value;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    recordSyncError("SyncFailure", db, field, message);
    return null;
  }
}

/**
 * 過去7日間のページを集計し、フィールド値の合計を返す（週次集計用）。
 * last_edited_time が7日以内のページを対象にする。
 */
export async function aggregateWeekly(db: string, field: string): Promise<number | null> {
  try {
    const pages = await fetchPages(db);
    if (pages.length === 0) {
      recordSyncError("MissingField", db, field, `DB '${db}' にページが存在しない`);
      return null;
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentPages  = pages.filter((p) => p.last_edited_time >= sevenDaysAgo);

    if (recentPages.length === 0) {
      recordSyncError("MissingField", db, field, `過去7日間の更新ページなし`);
      return null;
    }

    let total = 0;
    let count = 0;
    for (const page of recentPages) {
      const v = extractNumber(page, field);
      if (v !== null) {
        total += v;
        count++;
      }
    }

    return count > 0 ? total / count : null;  // 平均を返す
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    recordSyncError("SyncFailure", db, field, message);
    return null;
  }
}

/**
 * NPS (-100〜100) を 0〜100 に正規化する。
 * normalizeNPS(0) = 50, normalizeNPS(100) = 100, normalizeNPS(-100) = 0
 */
export function normalizeNPS(nps: number): number {
  return (nps + 100) / 2;
}
