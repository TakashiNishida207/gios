// src/pmf/score_engine.ts
// PMF Score Engine — 行動・感情・経済の3次元統合スコア計算
// 因果ループ: structured_evidence → scores → phase_judgment
// 重要: スコアは 0-1 正規化済み。UI 表示時は × 100 して 0-100 に変換すること。
// 重要: PMF Score は GIOS 内部指標。Notion に同期しない。

import { PMF_WEIGHTS }    from "./config/pmfWeights";
import { PMF_THRESHOLDS } from "./config/pmfThresholds";

// ─── 入力型 ───────────────────────────────────────────────────────────────────

export type StructuredEvidence = {
  segment:                    string;
  retention_rate:             number;  // 0-1
  behavior_change_score:      number;  // 0-1
  time_to_value:              number;  // 日数（> 0）
  segment_dominance:          number;  // 0-1
  sean_ellis_vd_ratio:        number;  // 0-1
  value_moment_frequency:     number;  // 0-1
  emotional_dependency_score: number;  // 0-1
  willingness_to_pay:         number;  // 0-1
  ltv:                        number;  // 0-1 正規化済み
  cac:                        number;  // 0-1 正規化済み
  churn_sensitivity:          number;  // 0-1
  growth_channels?:           number;  // Scale 判定用（オプション）
};

export type PMFScores = {
  segment:          string;
  behavioral_score: number;  // 0-1
  emotional_score:  number;  // 0-1
  economic_score:   number;  // 0-1
  pmf_score:        number;  // 0-1 正規化済み（UI 表示時は × 100）
};

export type PhaseLabel = "Pre-PMF" | "PMF" | "Chasm" | "Scale";

export type PhaseJudgment = {
  segment:   string;
  phase:     PhaseLabel;
  scores:    PMFScores;
  evidence:  StructuredEvidence;
};

// ─── ヘルパー ─────────────────────────────────────────────────────────────────

/** 値を [min, max] にクランプする */
function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, v));
}

// ─── スコア計算関数 ───────────────────────────────────────────────────────────

/**
 * 行動スコア (Behavioral Score) — 0-1
 * 継続率・行動変容・価値実感速度・セグメント支配率を統合
 */
export function calculateBehavioralScore(evidence: StructuredEvidence): number {
  const { w_r, w_bc, w_ttv, w_sd } = PMF_WEIGHTS;
  const ttv = evidence.time_to_value > 0 ? evidence.time_to_value : 1;
  const score =
    w_r   * clamp(evidence.retention_rate)          +
    w_bc  * clamp(evidence.behavior_change_score)   +
    w_ttv * clamp(1 / ttv)                          +
    w_sd  * clamp(evidence.segment_dominance);
  return clamp(score);
}

/**
 * 感情スコア (Emotional Score) — 0-1
 * Sean Ellis 非常に残念スコア・Value Moment 頻度・感情的依存を統合
 */
export function calculateEmotionalScore(evidence: StructuredEvidence): number {
  const { w_se, w_vm, w_ed } = PMF_WEIGHTS;
  const score =
    w_se * clamp(evidence.sean_ellis_vd_ratio)        +
    w_vm * clamp(evidence.value_moment_frequency)     +
    w_ed * clamp(evidence.emotional_dependency_score);
  return clamp(score);
}

/**
 * 経済スコア (Economic Score) — 0-1
 * 支払意欲・LTV を正の寄与、CAC・解約感度を負の寄与として統合
 * 最大値は w_wtp + w_ltv = 0.70（CAC=0, churn=0 のとき）
 */
export function calculateEconomicScore(evidence: StructuredEvidence): number {
  const { w_wtp, w_ltv, w_cac, w_churn } = PMF_WEIGHTS;
  const score =
    w_wtp   * clamp(evidence.willingness_to_pay)  +
    w_ltv   * clamp(evidence.ltv)                 -
    w_cac   * clamp(evidence.cac)                 -
    w_churn * clamp(evidence.churn_sensitivity);
  return clamp(score);  // 負になりうるため [0,1] にクランプ
}

/**
 * PMF 統合スコア — 0-1 正規化済み
 * 3次元スコアを重みで統合。UI 表示時は × 100 して 0-100 に変換すること。
 */
export function calculatePMFScore(scores: Omit<PMFScores, "segment" | "pmf_score">): number {
  const { wB, wE, wC } = PMF_WEIGHTS;
  const raw =
    wB * scores.behavioral_score +
    wE * scores.emotional_score  +
    wC * scores.economic_score;
  return Math.round(clamp(raw) * 10000) / 10000;  // 小数第4位まで (0-1)
}

/**
 * フェーズ判定
 * Pre-PMF → PMF → Chasm → Scale の順で判定（上から最も高いフェーズを返す）
 * Scale が最も厳しい条件。しきい値は pmfThresholds.ts で一元管理する。
 */
export function judgePhase(
  scores:   PMFScores,
  evidence: StructuredEvidence,
): PhaseLabel {
  const { pmf_score } = scores;
  const growthChannels = evidence.growth_channels ?? 0;
  const t = PMF_THRESHOLDS;

  // Scale: pmf_score が最高域かつ複数の成長チャネルを持つ
  if (pmf_score >= t.threshold_scale && growthChannels >= t.growth_channels_min) return "Scale";
  // Chasm: 高スコアかつセグメント支配率が閾値を超えている
  if (pmf_score >= t.threshold_chasm && evidence.segment_dominance >= t.dominance_threshold) return "Chasm";
  // PMF: 基本的なプロダクト・マーケット適合に到達
  if (pmf_score >= t.threshold_pmf) return "PMF";
  return "Pre-PMF";
}

// ─── メイン関数 ───────────────────────────────────────────────────────────────

/**
 * エビデンスから全スコアとフェーズ判定を一括計算する
 */
export function computePMF(evidence: StructuredEvidence): PhaseJudgment {
  const behavioral_score = calculateBehavioralScore(evidence);
  const emotional_score  = calculateEmotionalScore(evidence);
  const economic_score   = calculateEconomicScore(evidence);

  const scores: PMFScores = {
    segment: evidence.segment,
    behavioral_score,
    emotional_score,
    economic_score,
    pmf_score: calculatePMFScore({ behavioral_score, emotional_score, economic_score }),
  };

  return {
    segment:  evidence.segment,
    phase:    judgePhase(scores, evidence),
    scores,
    evidence,
  };
}
