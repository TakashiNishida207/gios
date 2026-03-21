// src/chasm/chasm_engine.ts
// Chasm Breakthrough Phase Score Engine — 支配・リファレンス・拡張の3次元統合スコア計算
// 因果ループ: structured_chasm_evidence → scores → chasm_phase_judgment
// 重要: chasm_score は GIOS 内部指標。Notion に同期しない。
// 重要: deal_velocity・adoption_barrier・price_sensitivity は逆数使用。ゼロ除算を防ぐこと。

import { CHASM_WEIGHTS }     from "./config/chasmWeights";
import { CHASM_THRESHOLDS }  from "./config/chasmThresholds";

// ─── 入力型 ───────────────────────────────────────────────────────────────────

export type ChasmEvidence = {
  segment:                    string;
  win_rate:                   number;  // 0-1
  deal_velocity:              number;  // 日数 (> 0); 逆数使用: 速いほど高スコア
  renewal_rate:               number;  // 0-1
  multi_threading_score:      number;  // 0-1
  reference_count:            number;  // 0-1 正規化済み
  reference_strength:         number;  // 0-1
  before_after_clarity:       number;  // 0-1
  industry_reference_density: number;  // 0-1
  adjacent_segment_fit:       number;  // 0-1
  adoption_barrier:           number;  // > 0; 逆数使用: 低いほど高スコア
  price_sensitivity:          number;  // > 0; 逆数使用: 低いほど高スコア
  expansion_success_rate:     number;  // 0-1
};

export type ChasmScores = {
  segment:         string;
  dominance_score: number;  // 0-1
  reference_score: number;  // 0-1
  expansion_score: number;  // 0-1
  chasm_score:     number;  // 0-1 正規化済み（UI 表示時は × 100）
};

export type ChasmPhaseLabel = "Pre-Chasm" | "Chasm" | "Breakthrough";

export type ChasmPhaseJudgment = {
  segment:  string;
  phase:    ChasmPhaseLabel;
  scores:   ChasmScores;
  evidence: ChasmEvidence;
};

// ─── ヘルパー ─────────────────────────────────────────────────────────────────

/** 値を [min, max] にクランプする */
function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, v));
}

/** ゼロ除算を防いだ逆数を返す（引数が 0 以下の場合は 1 を使用） */
function safeInverse(v: number): number {
  return clamp(1 / (v > 0 ? v : 1));
}

// ─── スコア計算関数 ───────────────────────────────────────────────────────────

/**
 * 支配スコア (Dominance Score) — 0-1
 * 商談勝率・成約速度・更新率・マルチスレッディングを統合
 * deal_velocity は逆数使用（速いほど高スコア）
 */
export function calculateDominanceScore(evidence: ChasmEvidence): number {
  const { w_wr, w_dv, w_rr, w_mt } = CHASM_WEIGHTS;
  const score =
    w_wr * clamp(evidence.win_rate)                +
    w_dv * safeInverse(evidence.deal_velocity)     +
    w_rr * clamp(evidence.renewal_rate)            +
    w_mt * clamp(evidence.multi_threading_score);
  return clamp(score);
}

/**
 * リファレンススコア (Reference Score) — 0-1
 * リファレンス数・強度・Before/After 明確度・業界導入密度を統合
 */
export function calculateReferenceScore(evidence: ChasmEvidence): number {
  const { w_rc, w_rs, w_ba, w_rd } = CHASM_WEIGHTS;
  const score =
    w_rc * clamp(evidence.reference_count)            +
    w_rs * clamp(evidence.reference_strength)         +
    w_ba * clamp(evidence.before_after_clarity)       +
    w_rd * clamp(evidence.industry_reference_density);
  return clamp(score);
}

/**
 * 拡張スコア (Expansion Score) — 0-1
 * 隣接適合度・拡張成功率を正の寄与、導入障壁・価格感度を逆数で統合
 * adoption_barrier・price_sensitivity は逆数使用（低いほど高スコア）
 */
export function calculateExpansionScore(evidence: ChasmEvidence): number {
  const { w_asf, w_ab, w_ps, w_esr } = CHASM_WEIGHTS;
  const score =
    w_asf * clamp(evidence.adjacent_segment_fit)    +
    w_ab  * safeInverse(evidence.adoption_barrier)  +
    w_ps  * safeInverse(evidence.price_sensitivity) +
    w_esr * clamp(evidence.expansion_success_rate);
  return clamp(score);
}

/**
 * Chasm 統合スコア — 0-1 正規化済み
 * 3次元スコアを重みで統合。UI 表示時は × 100 して 0-100 に変換すること。
 */
export function calculateChasmScore(scores: Omit<ChasmScores, "segment" | "chasm_score">): number {
  const { wD, wR, wX } = CHASM_WEIGHTS;
  const raw =
    wD * scores.dominance_score +
    wR * scores.reference_score +
    wX * scores.expansion_score;
  return Math.round(clamp(raw) * 10000) / 10000;  // 小数第4位まで (0-1)
}

/**
 * Chasm フェーズ判定
 * Pre-Chasm → Chasm → Breakthrough の順で判定（上から最も高いフェーズを返す）
 * Breakthrough が最も厳しい条件。しきい値は chasmThresholds.ts で一元管理する。
 */
export function judgeChasmPhase(
  scores:   ChasmScores,
  evidence: ChasmEvidence,
): ChasmPhaseLabel {
  const { chasm_score, dominance_score, reference_score, expansion_score } = scores;
  const t = CHASM_THRESHOLDS;

  // Breakthrough: 高スコア + 強い拡張力
  if (
    chasm_score     >= t.threshold_breakthrough        &&
    expansion_score >= t.expansion_threshold           &&
    evidence.expansion_success_rate >= t.expansion_success_threshold
  ) return "Breakthrough";

  // Chasm: 閾値超えかつ支配・リファレンス両方が基準を満たす
  if (
    chasm_score     >= t.threshold_chasm      &&
    dominance_score >= t.dominance_threshold  &&
    reference_score >= t.reference_threshold
  ) return "Chasm";

  return "Pre-Chasm";
}

// ─── メイン関数 ───────────────────────────────────────────────────────────────

/**
 * エビデンスから全スコアとフェーズ判定を一括計算する
 */
export function computeChasm(evidence: ChasmEvidence): ChasmPhaseJudgment {
  const dominance_score = calculateDominanceScore(evidence);
  const reference_score = calculateReferenceScore(evidence);
  const expansion_score = calculateExpansionScore(evidence);

  const scores: ChasmScores = {
    segment: evidence.segment,
    dominance_score,
    reference_score,
    expansion_score,
    chasm_score: calculateChasmScore({ dominance_score, reference_score, expansion_score }),
  };

  return {
    segment:  evidence.segment,
    phase:    judgeChasmPhase(scores, evidence),
    scores,
    evidence,
  };
}
