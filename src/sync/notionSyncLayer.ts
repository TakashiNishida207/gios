// src/sync/notionSyncLayer.ts
// GIOS Notion Sync Layer — Notion 14DB → Evidence型 → Score Engine
// 副作用: Sync Alerts DB への記録のみ
// 因果ループ: Notion DB → fetchField → Evidence → calculatePhase → Intelligence

import type {
  PMFEvidence,
  ChasmEvidence,
  ScaleEvidence,
} from "@/score/GIOS_SCORE_ENGINE";
import { calculatePhase } from "@/score/GIOS_SCORE_ENGINE";
import { fetchField, aggregateWeekly, normalizeNPS } from "./notionFieldFetcher";
import { withFallback, validateRange } from "./syncErrorHandler";

// ─── デフォルト値（エラー時フォールバック） ───────────────────────────────────

const PMF_DEFAULTS: PMFEvidence = {
  day30Retention:            0,
  coreActionPerWeek:         0,
  behaviorChangeScore:       0,
  seanEllisVeryDisappointed: 0,
  nps:                       0,
  qualitativeHeat:           0,
  activationRate:            0,
  timeToValueScore:          0,
};

const CHASM_DEFAULTS: ChasmEvidence = {
  segmentShare:             0,
  segmentPainIntensity:     0,
  referenceability:         0,
  winRate:                  0,
  repeatablePatternCount:   0,
  salesCycleConsistency:    0,
  messageClarity:           0,
  useCaseStandardization:   0,
};

const SCALE_DEFAULTS: ScaleEvidence = {
  ltvToCac:                 1,
  paybackMonths:            36,
  grossMargin:              0,
  monthlyGrowthRate:        0,
  expansionRevenueRatio:    0,
  operationalLoadScore:     0,
  processAutomationScore:   0,
};

// ─── フィールド取得ヘルパー ───────────────────────────────────────────────────
// withFallback で API エラーを吸収しつつ、validateRange で範囲を保証する。

async function getField(
  db:       string,
  field:    string,
  min:      number,
  max:      number,
  fallback: number,
): Promise<number> {
  const raw = await withFallback(
    () => fetchField(db, field),
    null,
    db,
    field,
  );
  return validateRange(raw, db, field, min, max, fallback);
}

async function getWeekly(
  db:       string,
  field:    string,
  fallback: number,
): Promise<number> {
  const raw = await withFallback(
    () => aggregateWeekly(db, field),
    null,
    db,
    field,
  );
  if (raw === null) return fallback;
  return raw;
}

// ─── PMF Evidence 構築 ────────────────────────────────────────────────────────

async function buildPMFEvidence(): Promise<PMFEvidence> {
  const [
    day30Retention,
    coreActionPerWeek,
    behaviorChangeScore,
    seanEllisVeryDisappointed,
    npsRaw,
    qualitativeHeat,
    activationRate,
    timeToValueScore,
  ] = await Promise.all([
    // Customer DB
    getField("Customer", "Retention_D30",           0,    1,   PMF_DEFAULTS.day30Retention),
    // PowerMeeting DB — 週次集計
    getWeekly("PowerMeeting", "CoreActionCount",             PMF_DEFAULTS.coreActionPerWeek),
    // Voice DB
    getField("Voice", "BehaviorChangeScore",        1,   10,   PMF_DEFAULTS.behaviorChangeScore),
    getField("Voice", "SET_VeryDisappointed",       0,    1,   PMF_DEFAULTS.seanEllisVeryDisappointed),
    getField("Voice", "NPS",                     -100,  100,   -100),  // 変換前は -100〜100
    // Story DB
    getField("Story", "HeatScore",                  1,    5,   PMF_DEFAULTS.qualitativeHeat),
    // Customer DB
    getField("Customer", "ActivationRate",          0,    1,   PMF_DEFAULTS.activationRate),
    getField("Customer", "TimeToValueScore",        1,   10,   PMF_DEFAULTS.timeToValueScore),
  ]);

  return {
    day30Retention,
    coreActionPerWeek,
    behaviorChangeScore,
    seanEllisVeryDisappointed,
    nps:             normalizeNPS(npsRaw),  // -100〜100 → 0〜100
    qualitativeHeat,
    activationRate,
    timeToValueScore,
  };
}

// ─── Chasm Evidence 構築 ──────────────────────────────────────────────────────

async function buildChasmEvidence(): Promise<ChasmEvidence> {
  const [
    segmentShare,
    segmentPainIntensity,
    referenceability,
    winRate,
    repeatablePatternCount,
    salesCycleConsistency,
    messageClarity,
    useCaseStandardization,
  ] = await Promise.all([
    // Customer DB
    getField("Customer", "SegmentShare",              0,    1,   CHASM_DEFAULTS.segmentShare),
    // Pain DB
    getField("Pain", "PainIntensity",                 1,   10,   CHASM_DEFAULTS.segmentPainIntensity),
    // Story DB
    getField("Story", "Referenceability",             1,   10,   CHASM_DEFAULTS.referenceability),
    // PowerMeeting DB
    getField("PowerMeeting", "WinRate",               0,    1,   CHASM_DEFAULTS.winRate),
    getField("PowerMeeting", "RepeatablePatternCount",0, 9999,   CHASM_DEFAULTS.repeatablePatternCount),
    getField("PowerMeeting", "SalesCycleConsistency", 1,   10,   CHASM_DEFAULTS.salesCycleConsistency),
    // Voice DB
    getField("Voice", "MessageClarity",               1,   10,   CHASM_DEFAULTS.messageClarity),
    // Story DB
    getField("Story", "UseCaseStandardization",       1,   10,   CHASM_DEFAULTS.useCaseStandardization),
  ]);

  return {
    segmentShare,
    segmentPainIntensity,
    referenceability,
    winRate,
    repeatablePatternCount,
    salesCycleConsistency,
    messageClarity,
    useCaseStandardization,
  };
}

// ─── Scale Evidence 構築 ──────────────────────────────────────────────────────

async function buildScaleEvidence(): Promise<ScaleEvidence> {
  const [
    ltvToCac,
    paybackMonths,
    grossMargin,
    monthlyGrowthRate,
    expansionRevenueRatio,
    operationalLoadScore,
    processAutomationScore,
  ] = await Promise.all([
    // Customer DB
    getField("Customer", "LTVtoCAC",              0,  999,  SCALE_DEFAULTS.ltvToCac),
    getField("Customer", "PaybackMonths",         0,  999,  SCALE_DEFAULTS.paybackMonths),
    getField("Customer", "GrossMargin",           0,    1,  SCALE_DEFAULTS.grossMargin),
    // Growth Causal Map DB
    getField("GrowthCausalMap", "MonthlyGrowthRate", 0, 1, SCALE_DEFAULTS.monthlyGrowthRate),
    // Customer DB
    getField("Customer", "ExpansionRevenueRatio", 0,    1,  SCALE_DEFAULTS.expansionRevenueRatio),
    // NextAction DB
    getField("NextAction", "OperationalLoadScore",1,   10,  SCALE_DEFAULTS.operationalLoadScore),
    // AI Agent DB
    getField("AIAgent", "AutomationScore",        1,   10,  SCALE_DEFAULTS.processAutomationScore),
  ]);

  return {
    ltvToCac,
    paybackMonths,
    grossMargin,
    monthlyGrowthRate,
    expansionRevenueRatio,
    operationalLoadScore,
    processAutomationScore,
  };
}

// ─── 公開 API ─────────────────────────────────────────────────────────────────

/**
 * Notion 14DB から Evidence を構築して返す。
 * PMF / Chasm / Scale を並列取得し、エラー時は各フィールドのデフォルト値で続行する。
 */
export async function syncNotionToEvidence(): Promise<{
  pmfEvidence:   PMFEvidence;
  chasmEvidence: ChasmEvidence;
  scaleEvidence: ScaleEvidence;
}> {
  const [pmfEvidence, chasmEvidence, scaleEvidence] = await Promise.all([
    buildPMFEvidence(),
    buildChasmEvidence(),
    buildScaleEvidence(),
  ]);

  return { pmfEvidence, chasmEvidence, scaleEvidence };
}

/**
 * Notion DB から Evidence を構築し、Score Engine でフェーズ判定まで行う。
 * 接続エントリポイント。
 *
 * @example
 * const result = await syncAndScore();
 * console.log(result.phase); // 'Scaling Company' | 'In Progress'
 */
export async function syncAndScore() {
  const { pmfEvidence, chasmEvidence, scaleEvidence } =
    await syncNotionToEvidence();

  const result = calculatePhase(pmfEvidence, chasmEvidence, scaleEvidence);
  return result;
}
