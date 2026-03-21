// app/api/pmf/score/route.ts
// PMF Score API — エビデンスからスコアを計算し Supabase に保存する
// POST: エビデンスを受け取りスコア計算 → pmf_score テーブルに保存
// GET:  segment 指定で最新スコアを取得

import { NextResponse } from "next/server";
import { computePMF }         from "@/pmf/score_engine";
import type { StructuredEvidence } from "@/pmf/score_engine";
import { getSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/pmf/score
export async function POST(req: Request) {
  try {
    const body = await req.json() as Partial<StructuredEvidence>;

    if (!body.segment) {
      return NextResponse.json({ ok: false, error: "segment は必須です。" }, { status: 400 });
    }

    const evidence = body as StructuredEvidence;
    const result   = computePMF(evidence);
    const supabase = getSupabaseClient();

    // structured_evidence を upsert（segment 単位）
    await supabase.from("structured_evidence").upsert(
      { ...evidence, updated_at: new Date().toISOString() },
      { onConflict: "segment" }
    );

    // pmf_score を INSERT（履歴として保持）
    await supabase.from("pmf_score").insert({
      segment:          result.scores.segment,
      behavioral_score: result.scores.behavioral_score,
      emotional_score:  result.scores.emotional_score,
      economic_score:   result.scores.economic_score,
      pmf_score:        result.scores.pmf_score,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

// GET /api/pmf/score?segment=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const segment = searchParams.get("segment");
    const supabase = getSupabaseClient();

    let query = supabase
      .from("pmf_score")
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
