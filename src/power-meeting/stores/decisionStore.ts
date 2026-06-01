import { create } from 'zustand'
import type { DecisionItem, DecisionType, Alternative } from '../types/decision'

interface DecisionState {
  items: DecisionItem[]
  setItems: (items: DecisionItem[]) => void
  addItem: (item: DecisionItem) => void
  updateItem: (id: string, patch: Partial<DecisionItem>) => void
  addAlternative: (decisionId: string, alt: Alternative) => void
  getByType: (type: DecisionType) => DecisionItem[]
}

export const useDecisionStore = create<DecisionState>((set, get) => ({
  items: [],

  setItems: (items) => set({ items }),

  addItem: (item) => set((s) => ({ items: [...s.items, item] })),

  updateItem: (id, patch) =>
    set((s) => ({
      items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    })),

  addAlternative: (decisionId, alt) =>
    set((s) => ({
      items: s.items.map((it) =>
        it.id === decisionId
          ? { ...it, alternatives: [...it.alternatives, alt] }
          : it,
      ),
    })),

  getByType: (type) => get().items.filter((it) => it.type === type),
}))
