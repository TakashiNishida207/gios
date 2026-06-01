import { create } from 'zustand'
import type { GHSItem, GrowthCategory } from '@pm/types/growth'

interface GrowthState {
  items: GHSItem[]
  setItems: (items: GHSItem[]) => void
  addItem: (item: GHSItem) => void
  updateItem: (id: string, patch: Partial<GHSItem>) => void
  getByCategory: (category: GrowthCategory) => GHSItem[]
}

export const useGrowthStore = create<GrowthState>((set, get) => ({
  items: [],

  setItems: (items) => set({ items }),

  addItem: (item) => set((s) => ({ items: [...s.items, item] })),

  updateItem: (id, patch) =>
    set((s) => ({
      items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    })),

  getByCategory: (category) =>
    get().items.filter((it) => it.category === category),
}))
