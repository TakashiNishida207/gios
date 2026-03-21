// app/api/chasm/score/route.ts
// Chasm Score API — エビデンスからスコアを計算し Supabase に保存する
// POST: エビデンスを受け取りスコア計算 → chasm_score テーブルに保存
// GET:  segment 指定で最新スコアを取得
// 注意: chasm_score は GIOS 内部指標。Notion に同期しない。

import { NextResponse } from "next/server";
import { computeChasm }          from "@/chasm/chasm_engine";
import type { ChasmEvidence }    from "@/chasm/chasm_engine";
import { getSupabaseClient }     from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/chasm/score
export async function POST(req: Request) {
  try {
    const body = await req.json() as Partial<ChasmEvidence>;

    if (!body.segment) {
      return NextResponse.json({ ok: false, error: "segment は必須です。" }, { status: 400 });
    }

    const evidence = body as ChasmEvidence;
    const result   = computeChasm(evidence);
    const supabase = getSupabaseClient();

    // structured_chasm_evidence を upsert（segment 単位）
    await supabase.from("structured_chasm_evidence").upsert(
      { ...evidence, updated_at: new Date().toISOString() },
      { onConflict: "segment" }
    );

    // chasm_score を INSERT（履歴として保持）
    await supabase.from("chasm_score").insert({
      segment:         result.scores.segment,
      dominance_score: result.scores.dominance_score,
      reference_score: result.scores.reference_score,
      expansion_score: result.scores.expansion_score,
      chasm_score:     result.scores.chasm_score,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

// GET /api/chasm/score?segment=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const segment  = searchParams.get("segment");
    const supabase = getSupabaseClient();

    let query = supabase
      .from("chasm_score")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (segment) query = query.eq("segment", segment);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true, scores: data ?? [] });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
