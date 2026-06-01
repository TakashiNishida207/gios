// src/store/store.ts
// GDIOS Internal Store — Intelligence Flow の状態を保持する中枢
// Zustand store として export し、UI 層が useGDIOSStore() で参照する唯一の入口

import { create } from "zustand";
import type { FlowPhase, IntelligenceType } from "../dictionary/types";
import { DEFAULT_DEMO, DEMO_SCENARIOS, type DemoScenario } from "./demoData";

export type FlowState = {
  Input:      Record<string, unknown>;
  Processing: Record<string, unknown>;
  Insight:    Record<string, unknown>;
  Action:     Record<string, unknown>;
  Feedback:   Record<string, unknown>;
  Learning:   Record<string, unknown>;
};

export type IntelligenceState = {
  Growth:       Record<string, unknown>;
  Evidence:     Record<string, unknown>;
  Story:        Record<string, unknown>;
  Decision:     Record<string, unknown>;
  Voice:        Record<string, unknown>;
  PowerMeeting: Record<string, unknown>;
};

export type GDIOSStore = {
  flow:        FlowState;
  intelligence: IntelligenceState;
  __diff__:    unknown[];
  /** Notion → GDIOS 順方向同期時に取得した Notion ページ ID の配列（逆同期に使用） */
  __notionPageIds__: string[];
  /** customerId → Notion ページ ID のマップ（逆同期時の書き戻し先特定に使用） */
  __notionPageIdMap__: Record<string, string>;
};

export type GDIOSActions = {
  setFlow:          (phase: FlowPhase, data: Record<string, unknown>) => void;
  setIntelligence:  (intel: keyof IntelligenceState, data: Record<string, unknown>) => void;
  appendDiff:       (record: Record<string, unknown>) => void;
  consumeDiff:      () => Record<string, unknown>[];
  reset:            () => void;
  /** デモシナリオをIDで切り替える (例: "uc1" 〜 "uc6") */
  loadScenario:     (id: string) => void;
  /** 現在のシナリオID */
  activeScenarioId: string;
};

export const createInitialStore = (): GDIOSStore => ({
  flow: {
    Input:      {},
    Processing: {},
    Insight:    {},
    Action:     {},
    Feedback:   {},
    Learning:   {},
  },
  intelligence: {
    Growth:       {},
    Evidence:     {},
    Story:        {},
    Decision:     {},
    Voice:        {},
    PowerMeeting: {},
  },
  __diff__: [],
  __notionPageIds__: [],
  __notionPageIdMap__: {},
});

/** デモシナリオの flow/intelligence をストア形式に変換 */
function scenarioToStore(s: DemoScenario): Pick<GDIOSStore, "flow" | "intelligence"> {
  return { flow: s.flow, intelligence: s.intelligence };
}

// UI 層が参照する唯一の Zustand フック
// 初期値はデモデータ UC1（チャーンリスク緊急対応）をロード済み
export const useGDIOSStore = create<GDIOSStore & GDIOSActions>((set, get) => ({
  ...createInitialStore(),
  ...scenarioToStore(DEFAULT_DEMO),   // ← デモデータで初期化
  activeScenarioId: DEFAULT_DEMO.id,

  // flowPhase バケットへの shallow merge 更新
  setFlow: (phase, data) =>
    set((s) => ({
      flow: { ...s.flow, [phase]: { ...s.flow[phase], ...data } },
    })),

  // Intelligence バケットへの shallow merge 更新（未実装 Intelligence はスキップ）
  setIntelligence: (intel, data) =>
    set((s) => ({
      intelligence: {
        ...s.intelligence,
        [intel]: { ...s.intelligence[intel], ...data },
      },
    })),

  // GDIOS → Notion 逆同期キューへの追加
  appendDiff: (record) =>
    set((s) => ({ __diff__: [...s.__diff__, record] })),

  // 逆同期完了後: キューを返してクリアする（冪等性）
  consumeDiff: () => {
    const diff = get().__diff__ as Record<string, unknown>[];
    set({ __diff__: [] });
    return diff;
  },

  // ストアを空の初期状態に戻す（Notion同期前クリア用）
  reset: () => set({ ...createInitialStore(), activeScenarioId: "" }),

  // デモシナリオをIDで一括切り替え（B: シナリオセレクター用）
  loadScenario: (id: string) => {
    const scenario = DEMO_SCENARIOS.find((s) => s.id === id);
    if (!scenario) return;
    set({ ...scenarioToStore(scenario), activeScenarioId: id, __diff__: [] });
  },
}));
