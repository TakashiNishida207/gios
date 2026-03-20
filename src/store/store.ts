// src/store/store.ts
// GIOS Internal Store — Intelligence Flow の状態を保持する中枢
// Zustand store として export し、UI 層が useGIOSStore() で参照する唯一の入口

import { create } from "zustand";
import type { FlowPhase, IntelligenceType } from "../dictionary/types";

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

export type GIOSStore = {
  flow:        FlowState;
  intelligence: IntelligenceState;
  __diff__:    unknown[];
};

export type GIOSActions = {
  setFlow:          (phase: FlowPhase, data: Record<string, unknown>) => void;
  setIntelligence:  (intel: keyof IntelligenceState, data: Record<string, unknown>) => void;
  appendDiff:       (record: Record<string, unknown>) => void;
  consumeDiff:      () => Record<string, unknown>[];
  reset:            () => void;
};

export const createInitialStore = (): GIOSStore => ({
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
});

// UI 層が参照する唯一の Zustand フック
export const useGIOSStore = create<GIOSStore & GIOSActions>((set, get) => ({
  ...createInitialStore(),

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

  // GIOS → Notion 逆同期キューへの追加
  appendDiff: (record) =>
    set((s) => ({ __diff__: [...s.__diff__, record] })),

  // 逆同期完了後: キューを返してクリアする（冪等性）
  consumeDiff: () => {
    const diff = get().__diff__ as Record<string, unknown>[];
    set({ __diff__: [] });
    return diff;
  },

  // ストアを初期状態に戻す
  reset: () => set(createInitialStore()),
}));
