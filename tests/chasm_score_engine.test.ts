// tests/chasm_score_engine.test.ts
// Chasm Breakthrough Phase Score Engine — 5つのテストケース
// 因果ループ: エビデンス入力 → スコア計算 → フェーズ判定の正確性を保証する
// スコアはすべて 0-1 正規化済み（UI 表示時は × 100 して 0-100 に変換）

import {
  calculateDominanceScore,
  calculateReferenceScore,
  calculateExpansionScore,
  calculateChasmScore,
  judgeChasmPhase,
  computeChasm,
} from "../src/chasm/chasm_engine";
import type { ChasmEvidence } from "../src/chasm/chasm_engine";

// ─── ヘルパー ─────────────────────────────────────────────────────────────────

function makeEvidence(overrides: Partial<ChasmEvidence>): ChasmEvidence {
  return {
    segment:                    "test",
    win_rate:                   0,
    deal_velocity:              30,   // 30日 (デフォルト)
    renewal_rate:               0,
    multi_threading_score:      0,
    reference_count:            0,
    reference_strength:         0,
    before_after_clarity:       0,
    industry_reference_density: 0,
    adjacent_segment_fit:       0,
    adoption_barrier:           5,    // 中程度 (デフォルト)
    price_sensitivity:          5,    // 中程度 (デフォルト)
    expansion_success_rate:     0,
    ...overrides,
  };
}

// ─── TEST 1: Strong dominance, weak reference → "Pre-Chasm" ──────────────────
// dominance ≈ 0.72, reference ≈ 0.10 → chasm_score ≈ 0.40 < 0.55

describe("Test 1: Strong dominance, weak reference → Pre-Chasm", () => {
  const evidence = makeEvidence({
    segment:                    "Enterprise",
    win_rate:                   0.80,
    deal_velocity:              2,     // 速い (1/2=0.5)
    renewal_rate:               0.80,
    multi_threading_score:      0.75,
    reference_count:            0.10,
    reference_strength:         0.10,
    before_after_clarity:       0.12,
    industry_reference_density: 0.08,
    adjacent_segment_fit:       0.30,
    adoption_barrier:           3.0,   // 中程度 (1/3≈0.333)
    price_sensitivity:          3.0,
    expansion_success_rate:     0.25,
  });

  it("dominance_score should be high (> 0.50)", () => {
    const d = calculateDominanceScore(evidence);
    expect(d).toBeGreaterThan(0.50);
  });

  it("reference_score should be low (< 0.20)", () => {
    const r = calculateReferenceScore(evidence);
    expect(r).toBeLessThan(0.20);
  });

  it("chasm_score should be < threshold_chasm (0.55)", () => {
    const result = computeChasm(evidence);
    expect(result.scores.chasm_score).toBeLessThan(0.55);
  });

  it("phase should be Pre-Chasm", () => {
    const result = computeChasm(evidence);
    expect(result.phase).toBe("Pre-Chasm");
  });
});

// ─── TEST 2: Strong reference, weak expansion → "Chasm" ──────────────────────
// dominance ≈ 0.62, reference ≈ 0.76, expansion ≈ 0.21 → chasm_score ≈ 0.57 >= 0.55

describe("Test 2: Strong reference, weak expansion → Chasm", () => {
  const evidence = makeEvidence({
    segment:                    "SMB",
    win_rate:                   0.70,
    deal_velocity:              3,     // 3日 (1/3≈0.333)
    renewal_rate:               0.75,
    multi_threading_score:      0.70,
    reference_count:            0.80,
    reference_strength:         0.75,
    before_after_clarity:       0.80,
    industry_reference_density: 0.65,
    adjacent_segment_fit:       0.25,
    adoption_barrier:           5.0,   // 高い障壁 (1/5=0.20)
    price_sensitivity:          6.0,   // 高い価格感度 (1/6≈0.167)
    expansion_success_rate:     0.20,
  });

  it("reference_score should be high (> 0.55)", () => {
    const r = calculateReferenceScore(evidence);
    expect(r).toBeGreaterThan(0.55);
  });

  it("expansion_score should be low (< 0.35)", () => {
    const x = calculateExpansionScore(evidence);
    expect(x).toBeLessThan(0.35);
  });

  it("chasm_score should be >= threshold_chasm (0.55)", () => {
    const result = computeChasm(evidence);
    expect(result.scores.chasm_score).toBeGreaterThanOrEqual(0.55);
  });

  it("phase should be Chasm", () => {
    const result = computeChasm(evidence);
    expect(result.phase).toBe("Chasm");
  });

  it("dominance_score should satisfy dominance_threshold (>= 0.55)", () => {
    const d = calculateDominanceScore(evidence);
    expect(d).toBeGreaterThanOrEqual(0.55);
  });
});

// ─── TEST 3: All three dimensions strong → "Breakthrough" ────────────────────
// dominance ≈ 0.83, reference ≈ 0.87, expansion ≈ 0.82 → chasm_score ≈ 0.84 >= 0.70

describe("Test 3: All three strong → Breakthrough", () => {
  const evidence = makeEvidence({
    segment:                    "Enterprise",
    win_rate:                   0.90,
    deal_velocity:              1.5,   // 非常に速い (1/1.5≈0.667)
    renewal_rate:               0.90,
    multi_threading_score:      0.85,
    reference_count:            0.90,
    reference_strength:         0.85,
    before_after_clarity:       0.88,
    industry_reference_density: 0.80,
    adjacent_segment_fit:       0.85,
    adoption_barrier:           1.2,   // 低障壁 (1/1.2≈0.833)
    price_sensitivity:          1.2,
    expansion_success_rate:     0.75,
  });

  it("dominance_score should be high (> 0.70)", () => {
    const d = calculateDominanceScore(evidence);
    expect(d).toBeGreaterThan(0.70);
  });

  it("reference_score should be high (> 0.70)", () => {
    const r = calculateReferenceScore(evidence);
    expect(r).toBeGreaterThan(0.70);
  });

  it("expansion_score should be high (> 0.55)", () => {
    const x = calculateExpansionScore(evidence);
    expect(x).toBeGreaterThan(0.55);
  });

  it("chasm_score should be >= threshold_breakthrough (0.70)", () => {
    const result = computeChasm(evidence);
    expect(result.scores.chasm_score).toBeGreaterThanOrEqual(0.70);
  });

  it("phase should be Breakthrough", () => {
    const result = computeChasm(evidence);
    expect(result.phase).toBe("Breakthrough");
  });
});

// ─── TEST 4: Extreme deal_velocity — inverse normalization ───────────────────
// deal_velocity=1日 vs 90日 で dominance_score に大きな差が生じること

describe("Test 4: Extreme deal_velocity — inverse normalization", () => {
  const baseFields = {
    segment:                    "Consumer",
    win_rate:                   0.60,
    renewal_rate:               0.60,
    multi_threading_score:      0.60,
    reference_count:            0,
    reference_strength:         0,
    before_after_clarity:       0,
    industry_reference_density: 0,
    adjacent_segment_fit:       0,
    adoption_barrier:           5,
    price_sensitivity:          5,
    expansion_success_rate:     0,
  };

  const fastDeal = makeEvidence({ ...baseFields, deal_velocity: 1   });  // 1日  → 1/1 = 1.0
  const slowDeal = makeEvidence({ ...baseFields, deal_velocity: 90  });  // 90日 → 1/90 ≈ 0.011

  it("fast deal (1 day) should yield higher dominance_score than slow deal (90 days)", () => {
    const dFast = calculateDominanceScore(fastDeal);
    const dSlow = calculateDominanceScore(slowDeal);
    expect(dFast).toBeGreaterThan(dSlow);
  });

  it("dominance score difference should be > 0.20 (material impact)", () => {
    const dFast = calculateDominanceScore(fastDeal);
    const dSlow = calculateDominanceScore(slowDeal);
    expect(dFast - dSlow).toBeGreaterThan(0.20);
  });

  it("deal_velocity=1 should produce dominance_score > 0.60", () => {
    const d = calculateDominanceScore(fastDeal);
    expect(d).toBeGreaterThan(0.60);
  });

  it("deal_velocity=90 should produce dominance_score < 0.55", () => {
    const d = calculateDominanceScore(slowDeal);
    expect(d).toBeLessThan(0.55);
  });
});

// ─── TEST 5: Extreme adoption_barrier + price_sensitivity ────────────────────
// 高い障壁/感度は拡張スコアを大幅に低下させること

describe("Test 5: Extreme adoption_barrier + price_sensitivity — inverse normalization", () => {
  const baseFields = {
    segment:                    "Hybrid",
    win_rate:                   0,
    deal_velocity:              30,
    renewal_rate:               0,
    multi_threading_score:      0,
    reference_count:            0,
    reference_strength:         0,
    before_after_clarity:       0,
    industry_reference_density: 0,
    adjacent_segment_fit:       0.80,
    expansion_success_rate:     0.80,
  };

  const lowBarrier  = makeEvidence({ ...baseFields, adoption_barrier: 1.0, price_sensitivity: 1.0  });
  const highBarrier = makeEvidence({ ...baseFields, adoption_barrier: 10.0, price_sensitivity: 10.0 });

  it("low barrier (1.0) should yield higher expansion_score than high barrier (10.0)", () => {
    const xLow  = calculateExpansionScore(lowBarrier);
    const xHigh = calculateExpansionScore(highBarrier);
    expect(xLow).toBeGreaterThan(xHigh);
  });

  it("expansion score difference should be > 0.30 (material impact)", () => {
    const xLow  = calculateExpansionScore(lowBarrier);
    const xHigh = calculateExpansionScore(highBarrier);
    expect(xLow - xHigh).toBeGreaterThan(0.30);
  });

  it("adoption_barrier=10 + price_sensitivity=10 should produce expansion_score < 0.55", () => {
    const x = calculateExpansionScore(highBarrier);
    expect(x).toBeLessThan(0.55);
  });

  it("judgeChasmPhase correctly classifies high-barrier evidence", () => {
    const d = calculateDominanceScore(highBarrier);
    const r = calculateReferenceScore(highBarrier);
    const x = calculateExpansionScore(highBarrier);
    const chasm_score = calculateChasmScore({ dominance_score: d, reference_score: r, expansion_score: x });
    const scores = { segment: "Hybrid", dominance_score: d, reference_score: r, expansion_score: x, chasm_score };
    const phase  = judgeChasmPhase(scores, highBarrier);
    // 高障壁では Breakthrough に到達しない
    expect(phase).not.toBe("Breakthrough");
    expect(["Pre-Chasm", "Chasm", "Breakthrough"]).toContain(phase);
  });
});
