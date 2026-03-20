// tests/growth_intelligence.test.ts
import { GrowthIntelligence } from "../src/intelligence/growth_intelligence";

const intel = new GrowthIntelligence();

describe("GrowthIntelligence", () => {
  it("name が 'Growth'", () => {
    expect(intel.name).toBe("Growth");
  });

  it("gapLevel × painSeverity で priorityScore を導出する", () => {
    const result = intel.process({ gapLevel: 4, painSeverity: 3 });
    expect(result["priorityScore"]).toBe(12);
  });

  it("既存の priorityScore は上書きしない", () => {
    const result = intel.process({ gapLevel: 4, painSeverity: 3, priorityScore: 99 });
    expect(result["priorityScore"]).toBe(99);
  });

  it("gapLevel がある場合 opportunitySize を設定する（未設定時のみ）", () => {
    const result = intel.process({ gapLevel: 5 });
    expect(result["opportunitySize"]).toBe(5);
  });

  it("既存の opportunitySize は上書きしない", () => {
    const result = intel.process({ gapLevel: 5, opportunitySize: 100 });
    expect(result["opportunitySize"]).toBe(100);
  });

  it("painPoint から valueHypothesis のスケルトンを生成する", () => {
    const result = intel.process({ painPoint: "高コスト" });
    expect(typeof result["valueHypothesis"]).toBe("string");
    expect(result["valueHypothesis"] as string).toContain("高コスト");
  });

  it("既存の valueHypothesis は上書きしない", () => {
    const result = intel.process({ painPoint: "高コスト", valueHypothesis: "既存仮説" });
    expect(result["valueHypothesis"]).toBe("既存仮説");
  });

  it("入力をそのまま保持する", () => {
    const result = intel.process({ customerName: "ACME", bestPractice: "反復改善" });
    expect(result["customerName"]).toBe("ACME");
    expect(result["bestPractice"]).toBe("反復改善");
  });
});
