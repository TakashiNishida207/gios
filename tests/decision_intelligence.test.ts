// tests/decision_intelligence.test.ts
import { DecisionIntelligence } from "../src/intelligence/decision_intelligence";

const intel = new DecisionIntelligence();

describe("DecisionIntelligence", () => {
  it("name が 'Decision'", () => {
    expect(intel.name).toBe("Decision");
  });

  it("decisionOptions があり chosenOption がない場合 null を設定する", () => {
    const result = intel.process({ decisionOptions: ["A案", "B案"] });
    expect(result["chosenOption"]).toBeNull();
  });

  it("chosenOption がすでにある場合は上書きしない", () => {
    const result = intel.process({ decisionOptions: ["A案"], chosenOption: "A案" });
    expect(result["chosenOption"]).toBe("A案");
  });

  it("chosenOption から decisionRationale スケルトンを生成する", () => {
    const result = intel.process({ chosenOption: "A案" });
    expect(result["decisionRationale"] as string).toContain("A案");
  });

  it("既存の decisionRationale は上書きしない", () => {
    const result = intel.process({ chosenOption: "A案", decisionRationale: "既存理由" });
    expect(result["decisionRationale"]).toBe("既存理由");
  });

  it("chosenOption から nextAction を導出する", () => {
    const result = intel.process({ chosenOption: "B案を実行" });
    expect(result["nextAction"] as string).toContain("B案を実行");
  });

  it("既存の nextAction は上書きしない", () => {
    const result = intel.process({ chosenOption: "B案", nextAction: "既存アクション" });
    expect(result["nextAction"]).toBe("既存アクション");
  });

  it("空の decisionOptions は chosenOption を null にしない", () => {
    const result = intel.process({ decisionOptions: [] });
    expect(result["chosenOption"]).toBeUndefined();
  });
});
