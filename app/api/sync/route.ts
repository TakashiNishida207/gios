// app/api/sync/route.ts
// Sync API — Notion ↔ GDIOS 双方向同期のエントリポイント
// GET: 接続ステータス確認
// POST: 同期実行（body の direction で方向を指定）

import { NextResponse } from "next/server";
import { SyncEngine }         from "@/sync/sync_engine";
import { NotionAdapter }      from "@/sync/adapters/notion_adapter";
import { GDIOSAdapter }       from "@/sync/adapters/gios_adapter";
import { SchemaValidator }    from "@/sync/validators/schema_validator";
import { SemanticsValidator } from "@/sync/validators/semantics_validator";
import { FieldMapper }        from "@/sync/mappers/field_mapper";
import { IntelligenceMapper } from "@/sync/mappers/intelligence_mapper";
import { getServerStore }     from "@/store/serverStore";

// Force runtime env var resolution — prevents static build-time optimization
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function buildEngine(): SyncEngine {
  const apiKey = process.env.NOTION_API_KEY;
  const dbId   = process.env.NOTION_DATABASE_ID;

  if (!apiKey || !dbId) {
    throw new Error("NOTION_API_KEY または NOTION_DATABASE_ID が未設定です。");
  }

  return new SyncEngine(
    new NotionAdapter(apiKey, dbId),
    new GDIOSAdapter(getServerStore()),
    new SchemaValidator(),
    new SemanticsValidator(),
    new FieldMapper(),
    new IntelligenceMapper(),
  );
}

// GET /api/sync — 接続確認と現在のサーバーストア状態を返す
export async function GET() {
  try {
    const store = getServerStore();
    return NextResponse.json({
      ok: true,
      notion: {
        configured: !!(process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID),
      },
      store: {
        // キー一覧（パネル表示用）
        inputKeys:      Object.keys(store.flow.Input),
        insightKeys:    Object.keys(store.flow.Insight),
        actionKeys:     Object.keys(store.flow.Action),
        learningKeys:   Object.keys(store.flow.Learning),
        pendingDiff:    store.__diff__.length,
        // 実データ（クライアントストアへの反映用）
        flow:           store.flow,
        intelligence:   store.intelligence,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

// POST /api/sync — 同期実行
// body: { direction: "forward" | "backward" | "full", clientDiff?: Record<string, unknown>[] }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const direction: "forward" | "backward" | "full" = body.direction ?? "full";

    // クライアントから送られた __diff__ をサーバーストアに注入する
    // （クライアント Zustand ストアとサーバーストアは別物のため橋渡しが必要）
    const clientDiff = Array.isArray(body.clientDiff) ? body.clientDiff as Record<string, unknown>[] : [];
    if (clientDiff.length > 0) {
      const store = getServerStore();
      // 保存済みの Notion ページ ID を diff レコードに付与する
      const pageIds = store.__notionPageIds__ ?? [];
      const pageIdMap = store.__notionPageIdMap__ ?? {};
      const enrichedDiff = clientDiff.map((record) => {
        const cid      = record["customerId"] as string | undefined;
        const resolved = (cid && pageIdMap[cid]) ? pageIdMap[cid] : pageIds[0];
        return {
          ...record,
          __notionPageId__: record["__notionPageId__"] ?? resolved,
        };
      });
      store.__diff__ = [...(store.__diff__ as Record<string, unknown>[]), ...enrichedDiff];
    }

    const engine = buildEngine();

    if (direction === "forward") {
      const result = await engine.syncNotionToGDIOS();
      const s = getServerStore();
      return NextResponse.json({
        ok: true, direction, synced: result.length,
        store: { flow: s.flow, intelligence: s.intelligence },
      });
    }

    if (direction === "backward") {
      const result = await engine.syncGDIOSToNotion();
      return NextResponse.json({ ok: true, direction, synced: result.length });
    }

    // full
    const { forward, backward } = await engine.runFullSync();
    const s = getServerStore();
    return NextResponse.json({
      ok: true,
      direction: "full",
      forward:  forward.length,
      backward: backward.length,
      store: { flow: s.flow, intelligence: s.intelligence },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
