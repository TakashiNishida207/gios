// src/sync/syncErrorHandler.ts
// Sync Error Handler — エラー分類・記録・フォールバック
// 副作用: Sync Alerts DB への記録のみ
// 因果ループ: SyncError → Alerts DB → Observable → Resolution

import { Client } from "@notionhq/client";

// ─── 型 ───────────────────────────────────────────────────────────────────────

export type SyncErrorType =
  | "MissingField"   // Notion フィールドが空
  | "InvalidType"    // 型が不一致
  | "OutOfRange"     // 値が期待範囲外
  | "SyncFailure";   // API エラー

export type SyncError = {
  type:      SyncErrorType;
  db:        string;
  field:     string;
  message:   string;
  timestamp: string;  // ISO 8601
};

// ─── 内部: Sync Alerts DB への記録 ───────────────────────────────────────────

async function writeToAlertsDb(error: SyncError): Promise<void> {
  const apiKey  = process.env.NOTION_API_KEY;
  const alertDb = process.env.NOTION_DATABASE_ID_SYNC_ALERTS;
  if (!apiKey || !alertDb) return;  // 環境変数未設定時はサイレントに無視

  try {
    const client = new Client({ auth: apiKey });
    await client.pages.create({
      parent: { database_id: alertDb },
      properties: {
        Name:      { title:     [{ text: { content: `[${error.type}] ${error.db}.${error.field}` } }] },
        ErrorType: { select:    { name: error.type } },
        DB:        { rich_text: [{ text: { content: error.db } }] },
        Field:     { rich_text: [{ text: { content: error.field } }] },
        Message:   { rich_text: [{ text: { content: error.message } }] },
        Timestamp: { date:      { start: error.timestamp } },
      },
    });
  } catch {
    // Alerts DB への書き込み失敗はサイレントに無視（無限再帰防止）
  }
}

// ─── 公開 API ─────────────────────────────────────────────────────────────────

/**
 * エラーを Sync Alerts DB に記録する（非同期・fire-and-forget）
 */
export function recordSyncError(
  type:    SyncErrorType,
  db:      string,
  field:   string,
  message: string,
): void {
  const error: SyncError = { type, db, field, message, timestamp: new Date().toISOString() };
  // await しない — エラー記録がスコア計算をブロックしない
  void writeToAlertsDb(error);
}

/**
 * fn を実行し、失敗時は fallback 値を返す。
 * エラーは非同期で Sync Alerts DB に記録される。
 */
export async function withFallback<T>(
  fn:       () => Promise<T>,
  fallback: T,
  db:       string,
  field:    string,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    recordSyncError("SyncFailure", db, field, message);
    return fallback;
  }
}

/**
 * 値のバリデーション + 範囲チェック。
 * 不正値の場合は fallback を返し、エラーを記録する。
 */
export function validateRange(
  value:    unknown,
  db:       string,
  field:    string,
  min:      number,
  max:      number,
  fallback: number,
): number {
  if (value === null || value === undefined) {
    recordSyncError("MissingField", db, field, `${field} is null or undefined`);
    return fallback;
  }
  if (typeof value !== "number" || isNaN(value)) {
    recordSyncError("InvalidType", db, field, `Expected number, got ${typeof value}: ${value}`);
    return fallback;
  }
  if (value < min || value > max) {
    recordSyncError("OutOfRange", db, field, `${value} is outside [${min}, ${max}]`);
    return Math.max(min, Math.min(max, value));  // クランプして使用
  }
  return value;
}
