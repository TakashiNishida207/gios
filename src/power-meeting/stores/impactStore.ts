import { create } from 'zustand'
import type { VoiceImpactIntelligence } from '@pm/types/impact'

interface ImpactState {
  items: VoiceImpactIntelligence[]
  setItems: (items: VoiceImpactIntelligence[]) => void
  addItem: (item: VoiceImpactIntelligence) => void
  updateItem: (id: string, patch: Partial<VoiceImpactIntelligence>) => void
  /** 特定Voice IDに紐づく全Intelligence取得 */
  getByVoiceId: (voiceId: string) => VoiceImpactIntelligence[]
  /** 特定ターゲット（domain + itemId）に紐づく全Intelligence取得 */
  getByTarget: (domain: VoiceImpactIntelligence['targetDomain'], targetItemId: string) => VoiceImpactIntelligence[]
}

export const useImpactStore = create<ImpactState>((set, get) => ({
  items: [],

  setItems: (items) => set({ items }),

  addItem: (item) => set((s) => ({ items: [...s.items, item] })),

  updateItem: (id, patch) =>
    set((s) => ({
      items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    })),

  getByVoiceId: (voiceId) => get().items.filter((it) => it.voiceId === voiceId),

  getByTarget: (domain, targetItemId) =>
    get().items.filter(
      (it) => it.targetDomain === domain && it.targetItemId === targetItemId,
    ),
}))
