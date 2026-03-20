// src/store/updateIntelligence.ts
// Intelligence 更新関数 — store.intelligence の特定バケットを不変更新する
// 因果ループ: IntelligenceMapper / IntelligenceEngine → GIOSAdapter → ここ → Zustand set()

import type { IntelligenceState, GIOSStore } from "./store";
import type { IntelligenceType } from "../dictionary/types";

/**
 * 指定 Intelligence バケットのデータをマージした新しい IntelligenceState を返す。
 * 担当外のバケットには触れない。
 */
export function updateIntelligence(
  state: GIOSStore,
  intel: keyof IntelligenceState,
  data: Record<string, unknown>
): Pick<GIOSStore, "intelligence"> {
  return {
    intelligence: {
      ...state.intelligence,
      [intel]: {
        ...state.intelligence[intel],
        ...data,
      },
    },
  };
}

/**
 * 複数 Intelligence バケットを一括更新する。
 * IntelligenceMapper の IntelligenceBundle を直接受け取る際に使用する。
 */
export function updateIntelligenceAll(
  state: GIOSStore,
  updates: Partial<Record<IntelligenceType, Record<string, unknown>>>
): Pick<GIOSStore, "intelligence"> {
  const next = { ...state.intelligence };

  for (const key of Object.keys(updates) as IntelligenceType[]) {
    // IntelligenceState に存在するバケットのみ更新（AIAgent 等の未実装 Intelligence をスキップ）
    if (!(key in next)) continue;
    const bucket = key as keyof IntelligenceState;
    next[bucket] = { ...next[bucket], ...updates[key] };
  }

  return { intelligence: next };
}
