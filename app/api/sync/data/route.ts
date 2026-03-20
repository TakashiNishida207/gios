// app/api/sync/data/route.ts
// GET /api/sync/data — サーバーストアの全フロー・Intelligence データを返す
// UI 側が同期後にポーリングして Zustand ストアを更新する

import { NextResponse } from "next/server";
import { getServerStore } from "@/store/serverStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const store = getServerStore();
  return NextResponse.json({
    ok:          true,
    flow:        store.flow,
    intelligence: store.intelligence,
    pendingDiff: store.__diff__.length,
  });
}
