// tests/intelligence_router.test.ts
import { IntelligenceRouter } from "../src/intelligence/intelligence_router";
import { FlowEngine } from "../src/intelligence/flow_engine";
import { dictionary } from "../src/dictionary";

const router = new IntelligenceRouter(dictionary);
const engine = new FlowEngine(dictionary);

function classify(data: Record<string, unknown>) {
  return engine.applyCausalFlow(engine.classifyByFlow(data));
}

describe("IntelligenceRouter", () => {
  it("painPoint を Growth と Evidence に配布する", () => {
    const buckets = classify({ painPoint: "遅い処理" });
    const result  = router.routeToIntelligence(buckets);
    expect(result.Growth?.["painPoint"]).toBe("遅い処理");
    expect(result.Evidence?.["painPoint"]).toBe("遅い処理");
  });

  it("narrative は Story のみ", () => {
    const buckets = classify({ narrative: "顧客ストーリー" });
    const result  = router.routeToIntelligence(buckets);
    expect(result.Story?.["narrative"]).toBe("顧客ストーリー");
    expect(result.Growth?.["narrative"]).toBeUndefined();
    expect(result.Decision?.["narrative"]).toBeUndefined();
  });

  it("agenda は PowerMeeting のみ", () => {
    const buckets = classify({ agenda: "Q3 レビュー" });
    const result  = router.routeToIntelligence(buckets);
    expect(result.PowerMeeting?.["agenda"]).toBe("Q3 レビュー");
    expect(result.Growth?.["agenda"]).toBeUndefined();
  });

  it("chosenOption は Decision と PowerMeeting に配布する", () => {
    const buckets = classify({ chosenOption: "オプションA" });
    const result  = router.routeToIntelligence(buckets);
    expect(result.Decision?.["chosenOption"]).toBe("オプションA");
    expect(result.PowerMeeting?.["chosenOption"]).toBe("オプションA");
  });

  it("空のバケットは空の結果を返す", () => {
    const buckets = classify({});
    const result  = router.routeToIntelligence(buckets);
    const totalVars = Object.values(result).reduce(
      (n, b) => n + (b ? Object.keys(b).length : 0), 0
    );
    expect(totalVars).toBe(0);
  });
});
