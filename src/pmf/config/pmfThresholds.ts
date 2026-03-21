// src/pmf/config/pmfThresholds.ts
// PMF フェーズ判定しきい値 — ここを変更するだけで全判定ロジックに反映される
// Takashi feedback (2026-03-21): 旧しきい値が厳しすぎたため緩和

export const PMF_THRESHOLDS = {
  /** PMF 到達と判定するスコア下限 */
  threshold_pmf:   55,

  /** Chasm 突破と判定するスコア下限 */
  threshold_chasm: 65,

  /** Scale 到達と判定するスコア下限 */
  threshold_scale: 70,

  /** Chasm 判定に必要なセグメント支配率下限 */
  dominance_threshold: 0.55,

  /** Scale 判定に必要な成長チャネル数下限 */
  growth_channels_min: 2,
} as const;
