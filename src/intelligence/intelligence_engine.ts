// src/intelligence/intelligence_engine.ts
// Intelligence Engine — FlowEngine × IntelligenceRouter × 各 Intelligence Module の統合

import { FlowEngine }               from "./flow_engine";
import { IntelligenceRouter }       from "./intelligence_router";
import { DataDictionary }           from "../dictionary/types";
import { GrowthIntelligence }       from "./growth_intelligence";
import { EvidenceIntelligence }     from "./evidence_intelligence";
import { StoryIntelligence }        from "./story_intelligence";
import { DecisionIntelligence }     from "./decision_intelligence";
import { PowerMeetingIntelligence } from "./power_meeting_intelligence";
import { IntelligenceModule }       from "./types";

export class IntelligenceEngine {
  private flowEngine: FlowEngine;
  private router:     IntelligenceRouter;

  private modules: Record<string, IntelligenceModule> = {
    Growth:       new GrowthIntelligence(),
    Evidence:     new EvidenceIntelligence(),
    Story:        new StoryIntelligence(),
    Decision:     new DecisionIntelligence(),
    PowerMeeting: new PowerMeetingIntelligence(),
  };

  constructor(private dictionary: DataDictionary) {
    this.flowEngine = new FlowEngine(dictionary);
    this.router     = new IntelligenceRouter(dictionary);
  }

  // Intelligence Flow の完全パイプラインを実行
  // Input → Processing → Insight → Action → Feedback → Learning
  run(data: Record<string, unknown>) {
    // 1. 変数を Flow フェーズに分類
    const flowBuckets = this.flowEngine.classifyByFlow(data);

    // 2. 因果ルールを適用（Input → Processing → Insight → ...）
    const causalFlow = this.flowEngine.applyCausalFlow(flowBuckets);

    // 3. Intelligence に配布
    const intelInput = this.router.routeToIntelligence(causalFlow);

    // 4. 各 Intelligence Module が処理
    const intelOutput: Record<string, Record<string, unknown>> = {};
    for (const key of Object.keys(intelInput) as (keyof typeof intelInput)[]) {
      const data = intelInput[key];
      if (!data) continue;
      const mod = this.modules[key];
      intelOutput[key] = mod ? mod.process(data) : data;
    }

    return {
      flow:        causalFlow,
      intelligence: intelOutput,
    };
  }
}
