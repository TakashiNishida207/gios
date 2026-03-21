// src/chasm/config/chasmThresholds.ts
// Chasm フェーズ判定しきい値 — ここを変更するだけで全判定ロジックに反映される
// スコアは 0-1 正規化済み。UI 表示時は × 100 して 0-100 に変換すること。

export const CHASM_THRESHOLDS = {
  /** Chasm 到達と判定する chasm_score 下限 (0-1) */
  threshold_chasm: 0.55,

  /** Breakthrough 到達と判定する chasm_score 下限 (0-1) */
  threshold_breakthrough: 0.70,

  /** Chasm 判定に必要な dominance_score 下限 (0-1) */
  dominance_threshold: 0.55,

  /** Chasm 判定に必要な reference_score 下限 (0-1) */
  reference_threshold: 0.50,

  /** Breakthrough 判定に必要な expansion_score 下限 (0-1) */
  expansion_threshold: 0.55,

  /** Breakthrough 判定に必要な expansion_success_rate 下限 (0-1) */
  expansion_success_threshold: 0.50,
} as const;
