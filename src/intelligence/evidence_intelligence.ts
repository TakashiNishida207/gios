// src/intelligence/evidence_intelligence.ts
// Evidence Intelligence — 実験・仮説・結果の因果関係を管理する
// 因果ループ担当変数: hypothesis, experimentMethod, experimentResult,
//                     successMetric, resultSignal, learning, updatedHypothesis

import type { IntelligenceModule } from "./types";

export class EvidenceIntelligence implements IntelligenceModule {
  readonly name = "Evidence";

  /**
   * Evidence 変数群を受け取り、実験サイクルの因果構造を強化して返す。
   * - experimentResult が存在し hypothesis がある場合、学習シグナルを導出する
   * - resultSignal が未設定の場合、experimentResult から暫定シグナルを生成する
   * - learning が未設定で experimentResult がある場合、学びのスケルトンを生成する
   */
  process(input: Record<string, unknown>): Record<string, unknown> {
    const output: Record<string, unknown> = { ...input };

    // experimentResult → resultSignal（未設定の場合）
    if (typeof input["experimentResult"] === "string" && !input["resultSignal"]) {
      output["resultSignal"] = input["experimentResult"].length > 0 ? "observed" : "no-signal";
    }

    // experimentResult + hypothesis → learning（未設定の場合）
    if (
      typeof input["experimentResult"] === "string" &&
      typeof input["hypothesis"] === "string" &&
      !input["learning"]
    ) {
      output["learning"] = `[学び] 仮説「${input["hypothesis"]}」に対し、結果「${input["experimentResult"]}」を確認した。`;
    }

    // learning → updatedHypothesis（未設定の場合）
    if (typeof input["learning"] === "string" && !input["updatedHypothesis"]) {
      output["updatedHypothesis"] = `[更新仮説] ${input["learning"]}`;
    }

    return output;
  }
}
