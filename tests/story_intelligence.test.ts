// tests/story_intelligence.test.ts
import { StoryIntelligence } from "../src/intelligence/story_intelligence";

const intel = new StoryIntelligence();

describe("StoryIntelligence", () => {
  it("name が 'Story'", () => {
    expect(intel.name).toBe("Story");
  });

  it("context + customerName から narrative スケルトンを生成する", () => {
    const result = intel.process({ context: "予算が限られている", customerName: "ACME" });
    expect(typeof result["narrative"]).toBe("string");
    expect(result["narrative"] as string).toContain("ACME");
    expect(result["narrative"] as string).toContain("予算が限られている");
  });

  it("context のみでも narrative を生成する（顧客名は汎称）", () => {
    const result = intel.process({ context: "スケール課題" });
    expect(result["narrative"] as string).toContain("スケール課題");
  });

  it("valueMomentName が narrative に含まれる", () => {
    const result = intel.process({ context: "課題", valueMomentName: "初回契約" });
    expect(result["narrative"] as string).toContain("初回契約");
  });

  it("既存の narrative は上書きしない", () => {
    const result = intel.process({ context: "課題", narrative: "既存ストーリー" });
    expect(result["narrative"]).toBe("既存ストーリー");
  });

  it("customerFeedback から updatedNarrative を生成する", () => {
    const result = intel.process({ context: "課題", customerFeedback: "とても良かった" });
    expect(result["updatedNarrative"] as string).toContain("とても良かった");
  });

  it("既存の updatedNarrative は上書きしない", () => {
    const result = intel.process({ customerFeedback: "良い", updatedNarrative: "既存更新" });
    expect(result["updatedNarrative"]).toBe("既存更新");
  });
});
