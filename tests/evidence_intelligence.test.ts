// tests/evidence_intelligence.test.ts
import { EvidenceIntelligence } from "../src/intelligence/evidence_intelligence";

const intel = new EvidenceIntelligence();

describe("EvidenceIntelligence", () => {
  it("name が 'Evidence'", () => {
    expect(intel.name).toBe("Evidence");
  });

  it("experimentResult が空でなければ resultSignal を 'observed' にする", () => {
    const result = intel.process({ experimentResult: "CVR 12% 向上" });
    expect(result["resultSignal"]).toBe("observed");
  });

  it("experimentResult が空文字の場合 resultSignal を 'no-signal' にする", () => {
    const result = intel.process({ experimentResult: "" });
    expect(result["resultSignal"]).toBe("no-signal");
  });

  it("既存の resultSignal は上書きしない", () => {
    const result = intel.process({ experimentResult: "有り", resultSignal: "custom" });
    expect(result["resultSignal"]).toBe("custom");
  });

  it("experimentResult + hypothesis から learning スケルトンを生成する", () => {
    const result = intel.process({ experimentResult: "成功", hypothesis: "X が効く" });
    expect(typeof result["learning"]).toBe("string");
    expect(result["learning"] as string).toContain("X が効く");
    expect(result["learning"] as string).toContain("成功");
  });

  it("既存の learning は上書きしない", () => {
    const result = intel.process({ experimentResult: "成功", hypothesis: "X", learning: "既存学び" });
    expect(result["learning"]).toBe("既存学び");
  });

  it("learning から updatedHypothesis スケルトンを生成する", () => {
    const result = intel.process({ learning: "重要な発見" });
    expect(result["updatedHypothesis"] as string).toContain("重要な発見");
  });
});
