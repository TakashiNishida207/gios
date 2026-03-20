// src/intelligence/growth_intelligence.ts
// Growth Intelligence — 顧客の課題・機会・成長仮説を構造化する
// 因果ループ担当変数: painPoint, gapLevel, priorityScore, painSeverity, opportunitySize,
//                     valueHypothesis, playbookUpdate, bestPractice, antiPattern

import type { IntelligenceModule } from "./types";

export class GrowthIntelligence implements IntelligenceModule {
  readonly name = "Growth";

  /**
   * Growth 変数群を受け取り、ビジネス成長の因果構造を強化して返す。
   * - gapLevel が存在する場合、priorityScore を導出する
   * - painSeverity と opportunitySize からシグナル強度を算出する
   * - valueHypothesis がなければ painPoint から仮説を生成する（プレースホルダー）
   */
  process(input: Record<string, unknown>): Record<string, unknown> {
    const output: Record<string, unknown> = { ...input };

    // gapLevel × painSeverity → priorityScore（未スコアリングの場合のみ導出）
    if (
      typeof input["gapLevel"] === "number" &&
      typeof input["painSeverity"] === "number" &&
      input["priorityScore"] === undefined
    ) {
      output["priorityScore"] = input["gapLevel"] * input["painSeverity"];
    }

    // opportunitySize が未設定で gapLevel が存在する場合、gapLevel を暫定値とする
    if (
      typeof input["gapLevel"] === "number" &&
      input["opportunitySize"] === undefined
    ) {
      output["opportunitySize"] = input["gapLevel"];
    }

    // valueHypothesis が未設定で painPoint が存在する場合、仮説のスケルトンを生成する
    if (typeof input["painPoint"] === "string" && !input["valueHypothesis"]) {
      output["valueHypothesis"] = `[仮説] ${input["painPoint"]} を解決することで価値を生む。`;
    }

    return output;
  }
}
