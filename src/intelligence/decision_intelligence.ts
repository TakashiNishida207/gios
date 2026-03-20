// src/intelligence/decision_intelligence.ts
// Decision Intelligence — 意思決定の選択肢・根拠・結論を構造化する
// 因果ループ担当変数: decisionOptions, chosenOption, decisionRationale,
//                     gapLevel, nextAction, dueDate, meetingDecisions

import type { IntelligenceModule } from "./types";

export class DecisionIntelligence implements IntelligenceModule {
  readonly name = "Decision";

  /**
   * Decision 変数群を受け取り、意思決定の因果構造を強化して返す。
   * - decisionOptions が存在し chosenOption がない場合、選択待ち状態を明示する
   * - chosenOption が存在し decisionRationale がない場合、根拠のスケルトンを生成する
   * - chosenOption → nextAction（未設定の場合）
   */
  process(input: Record<string, unknown>): Record<string, unknown> {
    const output: Record<string, unknown> = { ...input };

    // decisionOptions 存在 + chosenOption 未設定 → 選択待ちシグナル
    if (
      Array.isArray(input["decisionOptions"]) &&
      input["decisionOptions"].length > 0 &&
      !input["chosenOption"]
    ) {
      output["chosenOption"] = null; // 明示的に「未決定」とする
    }

    // chosenOption → decisionRationale（未設定の場合）
    if (typeof input["chosenOption"] === "string" && !input["decisionRationale"]) {
      output["decisionRationale"] = `[選択理由] 「${input["chosenOption"]}」を選択。`;
    }

    // chosenOption → nextAction（未設定の場合）
    if (typeof input["chosenOption"] === "string" && !input["nextAction"]) {
      output["nextAction"] = `「${input["chosenOption"]}」の実行開始`;
    }

    return output;
  }
}
