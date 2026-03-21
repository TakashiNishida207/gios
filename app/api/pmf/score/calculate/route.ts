// app/api/pmf/score/calculate/route.ts
// PMF Score Calculate API — エビデンスからスコアを計算し Supabase に保存する
// POST: エビデンスを受け取りスコア計算 → pmf_score テーブルに保存
// Response: { segment, behavioral_score, emotional_score, economic_score, pmf_score }
// 注意: スコアは 0-1 正規化済み。UI 表示時は × 100 して 0-100 に変換すること。

import { NextResponse } from "next/server";
import { computePMF }         from "@/pmf/score_engine";
import type { StructuredEvidence } from "@/pmf/score_engine";
import { getSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/pmf/score/calculate
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

    // 仕様準拠レスポンス: { segment, behavioral_score, emotional_score, economic_score, pmf_score }
    return NextResponse.json({
      ok:               true,
      segment:          result.scores.segment,
      behavioral_score: result.scores.behavioral_score,
      emotional_score:  result.scores.emotional_score,
      economic_score:   result.scores.economic_score,
      pmf_score:        result.scores.pmf_score,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
