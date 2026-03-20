// src/dictionary/index.ts
// GIOS Data Dictionary — OS の憲法へのランタイムアクセス層
// 因果ループ: すべての変数はここから参照される

import type { DataDictionary, DictionaryEntry, FlowPhase, IntelligenceType } from "./types";
import raw from "./data_dictionary.json";

// Data Dictionary は不変。外部から変更させない。
export const dictionary: Readonly<DataDictionary> = raw as DataDictionary;

// --- 単体参照 ---

/** canonical 名でエントリを取得。未定義変数はここで検出される。 */
export function getEntry(canonical: string): DictionaryEntry | undefined {
  return dictionary[canonical];
}

/** canonical 名でエントリを取得。存在しない場合は例外を投げる。
 *  Sync Layer 内部など、変数の存在が保証された文脈で使用する。 */
export function requireEntry(canonical: string): DictionaryEntry {
  const entry = dictionary[canonical];
  if (!entry) {
    throw new Error(`[GIOS Dictionary] Unknown canonical: "${canonical}". Define it in data_dictionary.json first.`);
  }
  return entry;
}

// --- 因果ループによるフィルタリング ---

/** 指定フェーズに属するすべてのエントリを返す。
 *  Sync Layer の AutoMapper がフェーズごとの同期対象を決定するために使用する。 */
export function getByFlowPhase(phase: FlowPhase): DictionaryEntry[] {
  return Object.values(dictionary).filter((e) => e.flowPhase === phase);
}

/** Notion → GIOS 同期対象（Input フェーズのみ）。
 *  AutoMapper の正同期で参照する唯一の入口。 */
export function getInputEntries(): DictionaryEntry[] {
  return getByFlowPhase("Input");
}

/** GIOS → Notion 同期対象（Insight / Action / Learning フェーズ）。
 *  AutoMapper の逆同期で参照する唯一の出口。 */
export function getOutputEntries(): DictionaryEntry[] {
  return Object.values(dictionary).filter((e) =>
    (["Insight", "Action", "Learning"] as FlowPhase[]).includes(e.flowPhase)
  );
}

// --- Intelligence による参照 ---

/** 指定 Intelligence が担当するエントリをすべて返す。
 *  各 Intelligence Module が自身の処理対象変数を決定するために使用する。 */
export function getByIntelligence(intelligence: IntelligenceType): DictionaryEntry[] {
  return Object.values(dictionary).filter((e) => e.intelligence.includes(intelligence));
}

// --- Notion フィールド名との双方向マッピング ---

/** Notion フィールド名（JP）→ canonical 名の逆引き。
 *  Notion から受け取ったレスポンスを GIOS 変数に変換する起点。 */
export function getCanonicalByNotionField(notionField: string): string | undefined {
  const entry = Object.values(dictionary).find((e) => e.notionField === notionField);
  return entry?.canonical;
}

/** canonical 名 → Notion フィールド名の正引き。
 *  GIOS の変数を Notion に書き戻す際に使用する。 */
export function getNotionField(canonical: string): string | undefined {
  return dictionary[canonical]?.notionField;
}
