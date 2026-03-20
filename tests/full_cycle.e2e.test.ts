// tests/full_cycle.e2e.test.ts
// E2E: Input → Processing → Insight → Action → Feedback → Learning の完全因果ループを検証する

import { IntelligenceEngine }  from "../src/intelligence/intelligence_engine";
import { FlowEngine }          from "../src/intelligence/flow_engine";
import { IntelligenceRouter }  from "../src/intelligence/intelligence_router";
import { FieldMapper }         from "../src/sync/mappers/field_mapper";
import { IntelligenceMapper }  from "../src/sync/mappers/intelligence_mapper";
import { SchemaValidator }     from "../src/sync/validators/schema_validator";
import { SemanticsValidator }  from "../src/sync/validators/semantics_validator";
import { dictionary }          from "../src/dictionary";
import { createInitialStore }  from "../src/store/store";
import { updateFlow, updateFlowAll } from "../src/store/updateFlow";
import { updateIntelligenceAll }     from "../src/store/updateIntelligence";
import { appendDiff, clearDiff, peekDiff } from "../src/store/updateDiff";
import type { FlowBuckets }    from "../src/intelligence/flow_engine";

// 完全なビジネスシナリオ
const INPUT_DATA = {
  customerName:   "SaaS株式会社",
  industry:       "SaaS",
  companySize:    "200名",
  painPoint:      "営業プロセスが非効率でリードが失われている",
  context:        "急成長フェーズで人手が足りない",
  hypothesis:     "CRM 自動化でリード損失が50%減る",
  experimentMethod: "A/Bテスト",
  agenda:         "CRM 導入の意思決定",
  participants:   ["CEO", "営業部長", "エンジニアリーダー"],
};

describe("Full Cycle E2E", () => {
  let store: ReturnType<typeof createInitialStore>;
  let flowEngine:    FlowEngine;
  let intelRouter:   IntelligenceRouter;
  let intelEngine:   IntelligenceEngine;
  let fieldMapper:   FieldMapper;
  let intelMapper:   IntelligenceMapper;

  beforeEach(() => {
    store       = createInitialStore();
    flowEngine  = new FlowEngine(dictionary);
    intelRouter = new IntelligenceRouter(dictionary);
    intelEngine = new IntelligenceEngine(dictionary);
    fieldMapper = new FieldMapper();
    intelMapper = new IntelligenceMapper();
  });

  it("Step 1: Input データが正しくフェーズ分類される", () => {
    const buckets = flowEngine.classifyByFlow(INPUT_DATA);
    expect(buckets.Input["customerName"]).toBe("SaaS株式会社");
    expect(buckets.Input["painPoint"]).toContain("非効率");
    expect(buckets.Input["hypothesis"]).toContain("自動化");
  });

  it("Step 2: IntelligenceEngine がフルパイプラインを実行する", () => {
    const result = intelEngine.run(INPUT_DATA);

    // Input が正しく分類される
    expect(result.flow.Input["customerName"]).toBe("SaaS株式会社");

    // Growth が painPoint を処理して valueHypothesis を生成する
    expect(typeof result.intelligence["Growth"]?.["valueHypothesis"]).toBe("string");

    // Story が context から narrative を生成する
    expect(typeof result.intelligence["Story"]?.["narrative"]).toBe("string");

    // PowerMeeting が agenda を処理する
    expect(result.intelligence["PowerMeeting"]?.["agenda"]).toBe("CRM 導入の意思決定");
  });

  it("Step 3: Store の Flow と Intelligence が更新される", () => {
    const result = intelEngine.run(INPUT_DATA);

    // updateFlowAll で flow を更新する
    const flowUpdate = updateFlowAll(store, result.flow as Partial<typeof store.flow>);
    Object.assign(store, flowUpdate);

    expect(store.flow.Input["customerName"]).toBe("SaaS株式会社");

    // updateIntelligenceAll で intelligence を更新する
    const intelUpdate = updateIntelligenceAll(store, result.intelligence as any);
    Object.assign(store, intelUpdate);

    expect(store.intelligence.Growth["painPoint"]).toContain("非効率");
  });

  it("Step 4: Feedback データが store に書き込まれる", () => {
    const feedbackData = {
      experimentResult: "リード損失 45% 削減を確認",
      customerFeedback: "チームの作業量が大幅に減った",
      resultSignal:     "positive",
    };

    const flowUpdate = updateFlow(store, "Feedback", feedbackData);
    Object.assign(store, flowUpdate);

    expect(store.flow.Feedback["experimentResult"]).toContain("45%");
    expect(store.flow.Feedback["customerFeedback"]).toContain("大幅");
  });

  it("Step 5: Learning フェーズのデータが __diff__ に積まれる", () => {
    const learningData = {
      learning:          "CRM 自動化は急成長期に特に有効",
      updatedHypothesis: "自動化で損失50%削減 → 実際は45%で概ね正しい",
      bestPractice:      "A/Bテストで仮説を事前検証する",
      __notionPageId__:  "page-001",
    };

    const updated = appendDiff(store, learningData);
    Object.assign(store, updated);

    const diff = peekDiff(store);
    expect(diff).toHaveLength(1);
    expect(diff[0]["learning"]).toContain("急成長期");
  });

  it("Step 6: 逆同期後に __diff__ がクリアされる（因果ループの完結）", () => {
    Object.assign(store, appendDiff(store, { learning: "テスト学び" }));
    expect(peekDiff(store)).toHaveLength(1);

    // Notion への逆同期後にクリア
    Object.assign(store, clearDiff(store));
    expect(peekDiff(store)).toHaveLength(0);
  });

  it("完全因果ループ: Input から Learning まで通して矛盾なく動作する", () => {
    // Input → Intelligence Engine
    const engineResult = intelEngine.run(INPUT_DATA);

    // Store 更新
    Object.assign(store, updateFlowAll(store, engineResult.flow as any));
    Object.assign(store, updateIntelligenceAll(store, engineResult.intelligence as any));

    // Feedback 追加
    Object.assign(store, updateFlow(store, "Feedback", {
      experimentResult: "成功",
      customerFeedback: "効果あり",
    }));

    // Learning を diff に積む
    const learning = {
      learning: "自動化は有効",
      bestPractice: "仮説検証を先に行う",
      __notionPageId__: "page-001",
    };
    Object.assign(store, appendDiff(store, learning));

    // 検証: 因果ループ全体が整合している
    expect(store.flow.Input["customerName"]).toBe("SaaS株式会社");
    expect(store.flow.Feedback["experimentResult"]).toBe("成功");
    expect(peekDiff(store)).toHaveLength(1);
    expect(peekDiff(store)[0]["bestPractice"]).toBe("仮説検証を先に行う");

    // クリア（逆同期完了）
    Object.assign(store, clearDiff(store));
    expect(peekDiff(store)).toHaveLength(0);
  });

  it("Notion フィールド → canonical → Intelligence の変換パイプライン", () => {
    // Notion から取得した形式（実際のフィールド名）
    const notionRecords = [{
      "Company（会社名）": "ACME",
      "Pain Points（ペインポイント）": "コスト過多",
    }];

    // Field Mapper: Notion フィールド名 → canonical
    const mapped = fieldMapper.mapToGIOS(notionRecords);
    expect(mapped[0]["customerName"]).toBe("ACME");
    expect(mapped[0]["painPoint"]).toBe("コスト過多");

    // Intelligence Mapper: canonical → Intelligence バンドル
    const bundles = intelMapper.assign(mapped);
    expect(bundles[0].Growth?.["customerName"]).toBe("ACME");
    expect(bundles[0].Growth?.["painPoint"]).toBe("コスト過多");
    expect(bundles[0].Evidence?.["painPoint"]).toBe("コスト過多");
  });
});
