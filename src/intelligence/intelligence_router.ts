// src/intelligence/intelligence_router.ts
// Intelligence Router — FlowBuckets を各 Intelligence Module に配布する
// 因果ループ: FlowEngine の後、各 Intelligence Module の前に位置する

import { getEntry } from "../dictionary";
import type { DataDictionary, IntelligenceType } from "../dictionary/types";
import type { FlowBuckets } from "./flow_engine";

export type IntelligenceInput = Partial<Record<IntelligenceType, Record<string, unknown>>>;

export class IntelligenceRouter {
  constructor(private dictionary: DataDictionary) {}

  /**
   * FlowBuckets の全変数を Data Dictionary の intelligence 定義に従い
   * 各 Intelligence Module のインプットバケットへ配布する。
   * 1 変数が複数 Intelligence に属す場合は、それぞれのバケットに複製する。
   */
  routeToIntelligence(buckets: FlowBuckets): IntelligenceInput {
    const result: IntelligenceInput = {};

    for (const phaseData of Object.values(buckets)) {
      for (const [canonical, value] of Object.entries(phaseData)) {
        const entry = getEntry(canonical);
        if (!entry) continue;

        for (const intel of entry.intelligence) {
          if (!result[intel]) result[intel] = {};
          result[intel]![canonical] = value;
        }
      }
    }

    return result;
  }
}
