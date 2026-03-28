// src/score/GIOS_SCORE_ENGINE.ts
// GIOS Score Engine — PMF / Chasm / Scale スコアを計算する純粋関数モジュール
// 副作用なし、外部依存なし
// 因果ループ: Evidence → Score → Phase → Intelligence

// ─── 閾値定数 ─────────────────────────────────────────────────────────────────

const PMF_THRESHOLD   = 65;
const CHASM_THRESHOLD = 60;
const SCALE_THRESHOLD = 70;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// ─── 型定義 ───────────────────────────────────────────────────────────────────

export type PMFEvidence = {
  day30Retention:              number;  // 0-1   (例: 0.30 = 30%)
  coreActionPerWeek:           number;  // 回数  (例: 2 = 週2回)
  behaviorChangeScore:         number;  // 0-10
  seanEllisVeryDisappointed:   number;  // 0-1   (例: 0.40 = 40%)
  nps:                         number;  // 0-100 (NPS換算値)
  qualitativeHeat:             number;  // 0-5
  activationRate:              number;  // 0-1
  timeToValueScore:            number;  // 0-10
};

export type ChasmEvidence = {
  segmentShare:                number;  // 0-1   (例: 0.30 = 30%)
  segmentPainIntensity:        number;  // 0-10
  referenceability:            number;  // 0-10
  winRate:                     number;  // 0-1   (例: 0.40 = 40%)
  repeatablePatternCount:      number;  // 件数  (例: 3)
  salesCycleConsistency:       number;  // 0-10
  messageClarity:              number;  // 0-10
  useCaseStandardization:      number;  // 0-10
};

export type ScaleEvidence = {
  ltvToCac:                    number;  // 倍率  (例: 3 = LTV:CAC = 3:1)
  paybackMonths:               number;  // 月数  (例: 12)
  grossMargin:                 number;  // 0-1   (例: 0.70 = 70%)
  monthlyGrowthRate:           number;  // 0-1   (例: 0.10 = 10%/月)
  expansionRevenueRatio:       number;  // 0-1   (例: 0.20 = 20%)
  operationalLoadScore:        number;  // 0-10
  processAutomationScore:      number;  // 0-10
};

export type PMFScoreResult = {
  total:           number;  // 0-100
  behaviorScore:   number;  // 0-45
  emotionScore:    number;  // 0-35
  activationScore: number;  // 0-20
  status: 'PMF Achieved' | 'Not Achieved';
};

export type ChasmScoreResult = {
  total:                   number;  // 0-100
  segmentDominanceScore:   number;  // 0-40
  salesRepeatabilityScore: number;  // 0-40
  wholeProductScore:       number;  // 0-20
  status: 'Chasm Crossed' | 'Not Crossed';
};

export type ScaleScoreResult = {
  total:                       number;  // 0-100
  economicsScore:              number;  // 0-50
  growthEngineScore:           number;  // 0-30
  operationalScalabilityScore: number;  // 0-20
  status: 'Scale Achieved' | 'Not Achieved';
};

export type PhaseResult = {
  phase: 'Scaling Company' | 'In Progress';
  pmf:   PMFScoreResult;
  chasm: ChasmScoreResult;
  scale: ScaleScoreResult;
};

// ─── PMF Score ────────────────────────────────────────────────────────────────

/**
 * PMFスコアを計算する
 * - Behavior Score: 45点満点
 * - Emotion Score:  35点満点
 * - Activation Score: 20点満点
 * - 合計65点以上で 'PMF Achieved'
 */
export function calculatePMFScore(e: PMFEvidence): PMFScoreResult {
  // Behavior Score (45点)
  const b1 = clamp01(e.day30Retention            / 0.30) * 20;
  const b2 = clamp01(e.coreActionPerWeek         / 2   ) * 15;
  const b3 = clamp01(e.behaviorChangeScore       / 10  ) * 10;
  const behaviorScore = b1 + b2 + b3;

  // Emotion Score (35点)
  const e1 = clamp01(e.seanEllisVeryDisappointed / 0.40) * 20;
  const e2 = clamp01(e.nps                       / 30  ) * 10;
  const e3 = clamp01(e.qualitativeHeat           / 5   ) * 5;
  const emotionScore = e1 + e2 + e3;

  // Activation Score (20点)
  const a1 = clamp01(e.activationRate            / 0.60) * 10;
  const a2 = clamp01(e.timeToValueScore          / 10  ) * 10;
  const activationScore = a1 + a2;

  const total = behaviorScore + emotionScore + activationScore;

  return {
    total,
    behaviorScore,
    emotionScore,
    activationScore,
    status: total >= PMF_THRESHOLD ? 'PMF Achieved' : 'Not Achieved',
  };
}

// ─── Chasm Score ──────────────────────────────────────────────────────────────

/**
 * Chasmスコアを計算する
 * - Segment Dominance:    40点満点
 * - Sales Repeatability:  40点満点
 * - Whole Product:        20点満点
 * - 合計60点以上で 'Chasm Crossed'
 */
export function calculateChasmScore(e: ChasmEvidence): ChasmScoreResult {
  // Segment Dominance (40点)
  const s1 = clamp01(e.segmentShare         / 0.30) * 20;
  const s2 = clamp01(e.segmentPainIntensity / 10  ) * 10;
  const s3 = clamp01(e.referenceability     / 10  ) * 10;
  const segmentDominanceScore = s1 + s2 + s3;

  // Sales Repeatability (40点)
  const r1 = clamp01(e.winRate                 / 0.40) * 15;
  const r2 = clamp01(e.repeatablePatternCount  / 3   ) * 15;
  const r3 = clamp01(e.salesCycleConsistency   / 10  ) * 10;
  const salesRepeatabilityScore = r1 + r2 + r3;

  // Whole Product (20点)
  const w1 = clamp01(e.messageClarity          / 10  ) * 10;
  const w2 = clamp01(e.useCaseStandardization  / 10  ) * 10;
  const wholeProductScore = w1 + w2;

  const total = segmentDominanceScore + salesRepeatabilityScore + wholeProductScore;

  return {
    total,
    segmentDominanceScore,
    salesRepeatabilityScore,
    wholeProductScore,
    status: total >= CHASM_THRESHOLD ? 'Chasm Crossed' : 'Not Crossed',
  };
}

// ─── Scale Score ──────────────────────────────────────────────────────────────

/**
 * Scaleスコアを計算する
 * - Economics:               50点満点
 * - Growth Engine:           30点満点
 * - Operational Scalability: 20点満点
 * - 合計70点以上で 'Scale Achieved'
 */
export function calculateScaleScore(e: ScaleEvidence): ScaleScoreResult {
  // Economics (50点)
  const eco1 = clamp01(e.ltvToCac    / 3   ) * 20;
  // paybackMonths: 12ヶ月以下→15点、36ヶ月以上→0点、間は線形減衰
  const paybackRatio = e.paybackMonths <= 12 ? 1
                     : e.paybackMonths >= 36 ? 0
                     : (36 - e.paybackMonths) / (36 - 12);
  const eco2 = paybackRatio * 15;
  const eco3 = clamp01(e.grossMargin / 0.70) * 15;
  const economicsScore = eco1 + eco2 + eco3;

  // Growth Engine (30点)
  const g1 = clamp01(e.monthlyGrowthRate      / 0.10) * 15;
  const g2 = clamp01(e.expansionRevenueRatio  / 0.20) * 15;
  const growthEngineScore = g1 + g2;

  // Operational Scalability (20点)
  const o1 = clamp01(e.operationalLoadScore   / 10  ) * 10;
  const o2 = clamp01(e.processAutomationScore / 10  ) * 10;
  const operationalScalabilityScore = o1 + o2;

  const total = economicsScore + growthEngineScore + operationalScalabilityScore;

  return {
    total,
    economicsScore,
    growthEngineScore,
    operationalScalabilityScore,
    status: total >= SCALE_THRESHOLD ? 'Scale Achieved' : 'Not Achieved',
  };
}

// ─── Phase ────────────────────────────────────────────────────────────────────

/**
 * 3スコアすべての結果からフェーズを判定する
 * PMF + Chasm + Scale がすべて達成された場合のみ 'Scaling Company'
 */
export function calculatePhase(
  pmfEvidence:   PMFEvidence,
  chasmEvidence: ChasmEvidence,
  scaleEvidence: ScaleEvidence,
): PhaseResult {
  const pmf   = calculatePMFScore(pmfEvidence);
  const chasm = calculateChasmScore(chasmEvidence);
  const scale = calculateScaleScore(scaleEvidence);

  const allAchieved =
    pmf.status   === 'PMF Achieved'   &&
    chasm.status === 'Chasm Crossed'  &&
    scale.status === 'Scale Achieved';

  return {
    phase: allAchieved ? 'Scaling Company' : 'In Progress',
    pmf,
    chasm,
    scale,
  };
}
