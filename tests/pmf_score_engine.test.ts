// tests/pmf_score_engine.test.ts
// PMF Score Engine — 4つのテストケース
// 因果ループ: エビデンス入力 → スコア計算 → フェーズ判定の正確性を保証する

import {
  calculateBehavioralScore,
  calculateEmotionalScore,
  calculateEconomicScore,
  calculatePMFScore,
  judgePhase,
  computePMF,
} from "../src/pmf/score_engine";
import type { StructuredEvidence } from "../src/pmf/score_engine";

// ─── ヘルパー ─────────────────────────────────────────────────────────────────

function makeEvidence(overrides: Partial<StructuredEvidence>): StructuredEvidence {
  return {
    segment:                    "test",
    retention_rate:             0,
    behavior_change_score:      0,
    time_to_value:              1,
    segment_dominance:          0,
    sean_ellis_vd_ratio:        0,
    value_moment_frequency:     0,
    emotional_dependency_score: 0,
    willingness_to_pay:         0,
    ltv:                        0,
    cac:                        0,
    churn_sensitivity:          0,
    growth_channels:            0,
    ...overrides,
  };
}

// ─── TEST 1: Near PMF — pmf_score >= 60 → phase = "PMF" ──────────────────────

describe("Test 1: Near PMF — strong retention and Sean Ellis signal", () => {
  // Calibrated to produce pmf_score ≈ 60.77 (>= 60)
  const evidence = makeEvidence({
    segment:                    "Enterprise",
    retention_rate:             0.75,
    behavior_change_score:      0.70,
    time_to_value:              1.5,
    segment_dominance:          0.60,
    sean_ellis_vd_ratio:        0.55,
    value_moment_frequency:     0.60,
    emotional_dependency_score: 0.55,
    willingness_to_pay:         0.85,
    ltv:                        0.75,
    cac:                        0.15,
    churn_sensitivity:          0.10,
  });

  it("behavioral_score should be high (> 0.50)", () => {
    const b = calculateBehavioralScore(evidence);
    expect(b).toBeGreaterThan(0.50);
  });

  it("emotional_score should be above 0.45", () => {
    const e = calculateEmotionalScore(evidence);
    expect(e).toBeGreaterThan(0.45);
  });

  it("economic_score should be positive", () => {
    const c = calculateEconomicScore(evidence);
    expect(c).toBeGreaterThan(0);
  });

  it("pmf_score should be >= 60 → phase PMF", () => {
    const result = computePMF(evidence);
    expect(result.scores.pmf_score).toBeGreaterThanOrEqual(60);
    expect(result.phase).toBe("PMF");
  });
});

// ─── TEST 2: Far from PMF — phase = "Pre-PMF" ────────────────────────────────

describe("Test 2: Far from PMF — weak across all dimensions", () => {
  const evidence = makeEvidence({
    segment:                    "SMB",
    retention_rate:             0.20,
    behavior_change_score:      0.15,
    time_to_value:              10,
    segment_dominance:          0.10,
    sean_ellis_vd_ratio:        0.10,
    value_moment_frequency:     0.10,
    emotional_dependency_score: 0.10,
    willingness_to_pay:         0.20,
    ltv:                        0.15,
    cac:                        0.50,
    churn_sensitivity:          0.60,
  });

  it("pmf_score should be < 40", () => {
    const result = computePMF(evidence);
    expect(result.scores.pmf_score).toBeLessThan(40);
  });

  it("phase should be Pre-PMF", () => {
    const result = computePMF(evidence);
    expect(result.phase).toBe("Pre-PMF");
  });

  it("economic_score should be penalized by high cac and churn", () => {
    const c = calculateEconomicScore(evidence);
    // cac=0.5, churn=0.6 → net economic drag
    expect(c).toBeLessThan(0.3);
  });
});

// ─── TEST 3: Segment divergence — SegA strong, SegB weak ─────────────────────

describe("Test 3: Segment divergence", () => {
  // Calibrated to produce pmf_score ≈ 79.23 (>= 75) with growth_channels=2 → Scale
  const segA = makeEvidence({
    segment:                    "Enterprise",
    retention_rate:             0.90,
    behavior_change_score:      0.90,
    time_to_value:              1.0,
    segment_dominance:          0.80,
    sean_ellis_vd_ratio:        0.80,
    value_moment_frequency:     0.80,
    emotional_dependency_score: 0.75,
    willingness_to_pay:         0.90,
    ltv:                        0.90,
    cac:                        0.05,
    churn_sensitivity:          0.05,
    growth_channels:            2,
  });

  const segB = makeEvidence({
    segment:                    "Consumer",
    retention_rate:             0.25,
    behavior_change_score:      0.20,
    time_to_value:              8,
    segment_dominance:          0.15,
    sean_ellis_vd_ratio:        0.12,
    value_moment_frequency:     0.15,
    emotional_dependency_score: 0.10,
    willingness_to_pay:         0.15,
    ltv:                        0.10,
    cac:                        0.40,
    churn_sensitivity:          0.55,
  });

  it("Enterprise segment should reach Scale phase", () => {
    const result = computePMF(segA);
    expect(result.scores.pmf_score).toBeGreaterThanOrEqual(75);
    expect(result.phase).toBe("Scale");
  });

  it("Consumer segment should be Pre-PMF", () => {
    const result = computePMF(segB);
    expect(result.phase).toBe("Pre-PMF");
  });

  it("Enterprise pmf_score >> Consumer pmf_score", () => {
    const rA = computePMF(segA);
    const rB = computePMF(segB);
    expect(rA.scores.pmf_score).toBeGreaterThan(rB.scores.pmf_score + 30);
  });
});

// ─── TEST 4: Contradictory signal — retention high, Sean Ellis low ─────────

describe("Test 4: Contradictory signals — retention=0.7 but sean_ellis=0.1", () => {
  const evidence = makeEvidence({
    segment:                    "Hybrid",
    retention_rate:             0.70,  // strong
    behavior_change_score:      0.60,
    time_to_value:              2,
    segment_dominance:          0.45,
    sean_ellis_vd_ratio:        0.10,  // very weak
    value_moment_frequency:     0.15,
    emotional_dependency_score: 0.20,
    willingness_to_pay:         0.50,
    ltv:                        0.45,
    cac:                        0.20,
    churn_sensitivity:          0.25,
  });

  it("behavioral_score should be high (retention dominates)", () => {
    const b = calculateBehavioralScore(evidence);
    expect(b).toBeGreaterThan(0.45);
  });

  it("emotional_score should be low (sean_ellis drag)", () => {
    const e = calculateEmotionalScore(evidence);
    expect(e).toBeLessThan(0.25);
  });

  it("phase should not be Scale (emotional deficit prevents it)", () => {
    const result = computePMF(evidence);
    expect(result.phase).not.toBe("Scale");
  });

  it("pmf_score reflects tension — neither clearly PMF nor clearly Pre-PMF", () => {
    const result = computePMF(evidence);
    // Expect a middling score (not very high, not very low)
    expect(result.scores.pmf_score).toBeGreaterThan(35);
    expect(result.scores.pmf_score).toBeLessThan(75);
  });

  it("judgePhase correctly handles ambiguous input", () => {
    const b = calculateBehavioralScore(evidence);
    const e = calculateEmotionalScore(evidence);
    const c = calculateEconomicScore(evidence);
    const pmf_score = calculatePMFScore({ behavioral_score: b, emotional_score: e, economic_score: c });
    const scores = { segment: "Hybrid", behavioral_score: b, emotional_score: e, economic_score: c, pmf_score };
    const phase  = judgePhase(scores, evidence);
    // Should land somewhere — must be a valid phase
    expect(["Pre-PMF", "PMF", "Chasm", "Scale"]).toContain(phase);
  });
});
