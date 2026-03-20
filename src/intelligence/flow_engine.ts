// src/intelligence/flow_engine.ts
// Flow Engine — 変数を因果ループのフェーズに分類し、順序を保証する
// 因果ループ: Intelligence Flow の骨格。Input → Processing → ... → Learning の順序を強制する。

import { getEntry } from "../dictionary";
import type { DataDictionary, FlowPhase } from "../dictionary/types";

export type FlowBuckets = Record<FlowPhase, Record<string, unknown>>;

const CAUSAL_ORDER: FlowPhase[] = [
  "Input",
  "Processing",
  "Insight",
  "Action",
  "Feedback",
  "Learning",
];

export class FlowEngine {
  constructor(private dictionary: DataDictionary) {}

  /**
   * フラットな canonical → value のレコードを、Data Dictionary の flowPhase に従い
   * フェーズ別バケットに分類する。
   * 未知の canonical はスキップし、因果ループの汚染を防ぐ。
   */
  classifyByFlow(data: Record<string, unknown>): FlowBuckets {
    const buckets = this.emptyBuckets();

    for (const [canonical, value] of Object.entries(data)) {
      const entry = getEntry(canonical);
      if (!entry) continue; // Data Dictionary にない変数は無視

      buckets[entry.flowPhase][canonical] = value;
    }

    return buckets;
  }

  /**
   * フェーズ別バケットに因果順序を付与して返す。
   * 現時点では分類済みバケットをそのまま返す（順序の明示化が目的）。
   * 将来的にフェーズ間の因果伝播ロジックをここに追加できる。
   */
  applyCausalFlow(buckets: FlowBuckets): FlowBuckets {
    // CAUSAL_ORDER に従い、各フェーズが前フェーズの結果を参照できる構造を維持する
    const ordered: FlowBuckets = this.emptyBuckets();

    for (const phase of CAUSAL_ORDER) {
      ordered[phase] = { ...buckets[phase] };
    }

    return ordered;
  }

  private emptyBuckets(): FlowBuckets {
    return {
      Input:      {},
      Processing: {},
      Insight:    {},
      Action:     {},
      Feedback:   {},
      Learning:   {},
    };
  }
}
