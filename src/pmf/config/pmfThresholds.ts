// src/pmf/config/pmfThresholds.ts
// PMF フェーズ判定しきい値 — ここを変更するだけで全判定ロジックに反映される
// スコアは 0-1 正規化済み。UI 表示時は × 100 して 0-100 に変換すること。
// Takashi feedback (2026-03-21): 0-1 スケールに統一、旧しきい値(55/65/70)を廃止

export const PMF_THRESHOLDS = {
  /** PMF 到達と判定する pmf_score 下限 (0-1) */
  threshold_pmf:   0.60,

  /** Chasm 突破と判定する pmf_score 下限 (0-1) */
  threshold_chasm: 0.70,

  /** Scale 到達と判定する pmf_score 下限 (0-1) */
  threshold_scale: 0.75,

  /** Chasm 判定に必要なセグメント支配率下限 (0-1) */
  dominance_threshold: 0.60,

  /** Scale 判定に必要な成長チャネル数下限 */
  growth_channels_min: 2,
} as const;
