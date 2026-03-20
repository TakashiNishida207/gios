// src/store/updateFlow.ts
// Flow 更新関数 — store.flow の特定フェーズを不変更新する
// 因果ループ: FlowEngine → GIOSAdapter → ここ → Zustand set()

import type { FlowState, GIOSStore } from "./store";
import type { FlowPhase } from "../dictionary/types";

/**
 * 指定フェーズのデータをマージした新しい FlowState を返す。
 * 既存データは保持し、新しいデータで上書き（shallow merge）する。
 * 因果ループの順序を壊さないよう、他フェーズには触れない。
 */
export function updateFlow(
  state: GIOSStore,
  phase: FlowPhase,
  data: Record<string, unknown>
): Pick<GIOSStore, "flow"> {
  return {
    flow: {
      ...state.flow,
      [phase]: {
        ...state.flow[phase],
        ...data,
      },
    },
  };
}

/**
 * 複数フェーズを一括更新する。
 * FlowEngine.applyCausalFlow() の出力を直接受け取る際に使用する。
 */
export function updateFlowAll(
  state: GIOSStore,
  updates: Partial<FlowState>
): Pick<GIOSStore, "flow"> {
  const next = { ...state.flow };

  for (const phase of Object.keys(updates) as FlowPhase[]) {
    if (updates[phase]) {
      next[phase] = { ...next[phase], ...updates[phase] };
    }
  }

  return { flow: next };
}
