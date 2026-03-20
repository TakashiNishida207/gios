// src/intelligence/story_intelligence.ts
// Story Intelligence — 顧客の物語・文脈・ナラティブを構造化する
// 因果ループ担当変数: narrative, context, customerFeedback, updatedNarrative,
//                     customerName, contactPerson, valueMomentName

import type { IntelligenceModule } from "./types";

export class StoryIntelligence implements IntelligenceModule {
  readonly name = "Story";

  /**
   * Story 変数群を受け取り、顧客ナラティブの因果構造を強化して返す。
   * - context + customerName があれば narrative のスケルトンを生成する
   * - customerFeedback が存在すれば updatedNarrative を導出する
   */
  process(input: Record<string, unknown>): Record<string, unknown> {
    const output: Record<string, unknown> = { ...input };

    // context + customerName → narrative（未設定の場合）
    if (
      typeof input["context"] === "string" &&
      !input["narrative"]
    ) {
      const who = typeof input["customerName"] === "string"
        ? input["customerName"]
        : "顧客";
      const moment = typeof input["valueMomentName"] === "string"
        ? ` (${input["valueMomentName"]})`
        : "";
      output["narrative"] = `[ストーリー] ${who}${moment} は、${input["context"]} という状況にある。`;
    }

    // customerFeedback → updatedNarrative（未設定の場合）
    if (typeof input["customerFeedback"] === "string" && !input["updatedNarrative"]) {
      const base = typeof output["narrative"] === "string" ? output["narrative"] : "";
      output["updatedNarrative"] = `${base} フィードバック: ${input["customerFeedback"]}`;
    }

    return output;
  }
}
