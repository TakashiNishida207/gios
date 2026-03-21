// app/api/pmf/phase/judge/route.ts
// PMF Phase Judge API — フェーズ判定を実行し phase_judgment テーブルに保存する
// POST: エビデンスを受け取りフェーズ判定 → phase_judgment テーブルに保存
// Response: { segment, phase, pmf_score }
// 注意: pmf_score は 0-1 正規化済み。UI 表示時は × 100 して 0-100 に変換すること。

import { NextResponse } from "next/server";
import { computePMF }             from "@/pmf/score_engine";
import type { StructuredEvidence } from "@/pmf/score_engine";
import { getSupabaseClient }      from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/pmf/phase/judge
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

    // 仕様準拠レスポンス: { segment, phase, pmf_score }
    return NextResponse.json({
      ok:        true,
      segment:   result.segment,
      phase:     result.phase,
      pmf_score: result.scores.pmf_score,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
