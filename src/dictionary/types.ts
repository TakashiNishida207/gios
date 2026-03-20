// src/dictionary/types.ts
// GIOS Data Dictionary — 変数意味論の型定義
// OS の憲法。変更は承認フローを経ること。

export type FlowPhase =
  | "Input"
  | "Processing"
  | "Insight"
  | "Action"
  | "Feedback"
  | "Learning";

export type IntelligenceType =
  | "Growth"
  | "Evidence"
  | "Story"
  | "Decision"
  | "Voice"
  | "PowerMeeting"
  | "AIAgent";

export type FieldType = "string" | "number" | "string[]" | "boolean" | "date";

export interface DictionaryEntry {
  canonical: string;
  meaning: string;          // 日本語での意味定義
  flowPhase: FlowPhase;     // Intelligence Flow のどのフェーズに属するか
  intelligence: IntelligenceType[]; // どの Intelligence が使うか
  notionField: string;      // Notion 側のフィールド名（JP）
  type: FieldType;
}

export type DataDictionary = Record<string, DictionaryEntry>;
