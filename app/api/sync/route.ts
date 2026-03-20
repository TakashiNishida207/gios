// app/api/sync/route.ts
// Sync API — Notion ↔ GIOS 双方向同期のエントリポイント
// GET: 接続ステータス確認
// POST: 同期実行（body の direction で方向を指定）

import { NextResponse } from "next/server";
import { SyncEngine }         from "@/sync/sync_engine";
import { NotionAdapter }      from "@/sync/adapters/notion_adapter";
import { GIOSAdapter }        from "@/sync/adapters/gios_adapter";
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
    new GIOSAdapter(getServerStore()),
    new SchemaValidator(),
    new SemanticsValidator(),
    new FieldMapper(),
    new IntelligenceMapper(),
  );
}

// GET /api/sync — 接続確認と現在のストア状態を返す
export async function GET() {
  try {
    const store = getServerStore();
    return NextResponse.json({
      ok: true,
      notion: {
        configured: !!(process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID),
      },
      store: {
        inputKeys:      Object.keys(store.flow.Input),
        insightKeys:    Object.keys(store.flow.Insight),
        actionKeys:     Object.keys(store.flow.Action),
        learningKeys:   Object.keys(store.flow.Learning),
        pendingDiff:    store.__diff__.length,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

// POST /api/sync — 同期実行
// body: { direction: "forward" | "backward" | "full" }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const direction: "forward" | "backward" | "full" = body.direction ?? "full";

    const engine = buildEngine();

    if (direction === "forward") {
      const result = await engine.syncNotionToGIOS();
      return NextResponse.json({ ok: true, direction, synced: result.length });
    }

    if (direction === "backward") {
      const result = await engine.syncGIOSToNotion();
      return NextResponse.json({ ok: true, direction, synced: result.length });
    }

    // full
    const { forward, backward } = await engine.runFullSync();
    return NextResponse.json({
      ok: true,
      direction: "full",
      forward:  forward.length,
      backward: backward.length,
      store: {
        inputKeys:    Object.keys(getServerStore().flow.Input),
        insightKeys:  Object.keys(getServerStore().flow.Insight),
        pendingDiff:  getServerStore().__diff__.length,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
