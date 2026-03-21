// app/api/pmf/phase/route.ts
// PMF Phase API — フェーズ判定を実行し phase_judgment テーブルに保存する
// POST: エビデンスを受け取りフェーズ判定 → phase_judgment テーブルに保存
// GET:  segment 指定で最新フェーズ判定を取得

import { NextResponse } from "next/server";
import { computePMF }             from "@/pmf/score_engine";
import type { StructuredEvidence } from "@/pmf/score_engine";
import { getSupabaseClient }      from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/pmf/phase
export async function POST(req: Request) {
  try {
    const body = await req.json() as Partial<StructuredEvidence>;

    if (!body.segment) {
      return NextResponse.json({ ok: false, error: "segment は必須です。" }, { status: 400 });
    }

    const evidence = body as StructuredEvidence;
    const result   = computePMF(evidence);
    const supabase = getSupabaseClient();

    // phase_judgment を INSERT（判定履歴として保持）
    await supabase.from("phase_judgment").insert({
      segment:           result.segment,
      phase:             result.phase,
      evidence_snapshot: result.evidence,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

// GET /api/pmf/phase?segment=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const segment  = searchParams.get("segment");
    const supabase = getSupabaseClient();

    let query = supabase
      .from("phase_judgment")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (segment) query = query.eq("segment", segment);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true, judgments: data ?? [] });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
