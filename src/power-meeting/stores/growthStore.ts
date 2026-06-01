import { create } from 'zustand'
import type { GHSItem, GrowthCategory, Comment } from '../types/growth'

interface GrowthState {
  items: GHSItem[]
  setItems: (items: GHSItem[]) => void
  addItem: (item: GHSItem) => void
  updateItem: (id: string, patch: Partial<GHSItem>) => void
  getByCategory: (category: GrowthCategory) => GHSItem[]
  /** 改善提案コメントを GHS アイテムに追加 */
  addComment: (itemId: string, comment: Comment) => void
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

  addComment: (itemId, comment) =>
    set((s) => ({
      items: s.items.map((it) =>
        it.id === itemId ? { ...it, comments: [...it.comments, comment] } : it
      ),
    })),
}))
