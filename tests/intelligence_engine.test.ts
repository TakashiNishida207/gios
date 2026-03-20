// tests/intelligence_engine.test.ts
import { IntelligenceEngine } from "../src/intelligence/intelligence_engine";
import { dictionary } from "../src/dictionary";

const engine = new IntelligenceEngine(dictionary);

describe("IntelligenceEngine", () => {
  it("run() が flow と intelligence を返す", () => {
    const result = engine.run({ customerName: "ACME", painPoint: "高コスト" });
    expect(result).toHaveProperty("flow");
    expect(result).toHaveProperty("intelligence");
  });

  it("Input 変数が flow.Input に分類される", () => {
    const result = engine.run({ customerName: "ACME" });
    expect(result.flow.Input["customerName"]).toBe("ACME");
  });

  it("Processing 変数が flow.Processing に分類される", () => {
    const result = engine.run({ gapLevel: 4, painSeverity: 3 });
    expect(result.flow.Processing["gapLevel"]).toBe(4);
  });

  it("Growth Intelligence が painPoint を処理して valueHypothesis を生成する", () => {
    const result = engine.run({ painPoint: "コスト超過" });
    expect(typeof result.intelligence["Growth"]?.["valueHypothesis"]).toBe("string");
  });

  it("Evidence Intelligence が hypothesis + experimentResult から learning を生成する", () => {
    const result = engine.run({
      hypothesis: "X が効果的",
      experimentResult: "CVR 10% 向上",
    });
    expect(typeof result.intelligence["Evidence"]?.["learning"]).toBe("string");
  });

  it("Story Intelligence が context から narrative を生成する", () => {
    const result = engine.run({ context: "予算制約がある" });
    expect(typeof result.intelligence["Story"]?.["narrative"]).toBe("string");
  });

  it("複数変数を同時に処理できる", () => {
    const result = engine.run({
      customerName: "ACME",
      painPoint: "効率が悪い",
      hypothesis: "自動化が有効",
      agenda: "戦略会議",
    });
    expect(result.intelligence["Growth"]).toBeDefined();
    expect(result.intelligence["PowerMeeting"]).toBeDefined();
  });
});
