// src/pmf/score_engine.ts
// PMF Score Engine — 行動・感情・経済の3次元統合スコア計算
// 因果ループ: structured_evidence → scores → phase_judgment
// 重要: PMF Score は GIOS 内部指標。Notion に同期しない。

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
  pmf_score:        number;  // 0-100
};

export type PhaseLabel = "Pre-PMF" | "PMF" | "Chasm" | "Scale";

export type PhaseJudgment = {
  segment:   string;
  phase:     PhaseLabel;
  scores:    PMFScores;
  evidence:  StructuredEvidence;
};

// ─── 重みの定義 ────────────────────────────────────────────────────────────────

// Dimension weights
const wB = 0.40;
const wE = 0.35;
const wC = 0.25;

// Behavioral sub-weights
const w_r   = 0.40;
const w_bc  = 0.25;
const w_ttv = 0.20;
const w_sd  = 0.15;

// Emotional sub-weights
const w_se = 0.50;
const w_vm = 0.30;
const w_ed = 0.20;

// Economic sub-weights
const w_wtp   = 0.35;
const w_ltv   = 0.35;
const w_cac   = 0.15;
const w_churn = 0.15;

// ─── ヘルパー ─────────────────────────────────────────────────────────────────

/** 値を [min, max] にクランプする */
function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, v));
}

// ─── スコア計算関数 ───────────────────────────────────────────────────────────

/**
 * 行動スコア (Behavioral Score)
 * 継続率・行動変容・価値実感速度・セグメント支配率を統合
 */
export function calculateBehavioralScore(evidence: StructuredEvidence): number {
  const ttv = evidence.time_to_value > 0 ? evidence.time_to_value : 1;
  const score =
    w_r   * clamp(evidence.retention_rate)          +
    w_bc  * clamp(evidence.behavior_change_score)   +
    w_ttv * clamp(1 / ttv)                          +
    w_sd  * clamp(evidence.segment_dominance);
  return clamp(score);
}

/**
 * 感情スコア (Emotional Score)
 * Sean Ellis 非常に残念スコア・Value Moment 頻度・感情的依存を統合
 */
export function calculateEmotionalScore(evidence: StructuredEvidence): number {
  const score =
    w_se * clamp(evidence.sean_ellis_vd_ratio)        +
    w_vm * clamp(evidence.value_moment_frequency)     +
    w_ed * clamp(evidence.emotional_dependency_score);
  return clamp(score);
}

/**
 * 経済スコア (Economic Score)
 * 支払意欲・LTV を正の寄与、CAC・解約感度を負の寄与として統合
 */
export function calculateEconomicScore(evidence: StructuredEvidence): number {
  const score =
    w_wtp   * clamp(evidence.willingness_to_pay)  +
    w_ltv   * clamp(evidence.ltv)                 -
    w_cac   * clamp(evidence.cac)                 -
    w_churn * clamp(evidence.churn_sensitivity);
  return clamp(score);  // 負になりうるため [0,1] にクランプ
}

/**
 * PMF 統合スコア (0-100)
 * 3次元スコアを重みで統合し 100点スケールに変換
 */
export function calculatePMFScore(scores: Omit<PMFScores, "segment" | "pmf_score">): number {
  const raw =
    wB * scores.behavioral_score +
    wE * scores.emotional_score  +
    wC * scores.economic_score;
  return Math.round(clamp(raw) * 100 * 100) / 100;  // 小数第2位まで
}

/**
 * フェーズ判定
 * Pre-PMF → PMF → Chasm → Scale の順で判定
 * Scale が最も厳しい条件。上から判定し該当した段階を返す。
 */
export function judgePhase(
  scores:   PMFScores,
  evidence: StructuredEvidence,
): PhaseLabel {
  const { pmf_score } = scores;
  const growthChannels = evidence.growth_channels ?? 0;

  if (pmf_score >= 75 && growthChannels >= 2) return "Scale";
  if (pmf_score >= 70 && evidence.segment_dominance >= 0.6) return "Chasm";
  if (pmf_score >= 60) return "PMF";
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
