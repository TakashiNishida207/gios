import { create } from 'zustand'
import type { StoryItem, StoryAudience } from '@pm/types/story'

interface StoryState {
  items: StoryItem[]
  setItems: (items: StoryItem[]) => void
  addItem: (item: StoryItem) => void
  updateItem: (id: string, patch: Partial<StoryItem>) => void
  getByAudience: (audience: StoryAudience) => StoryItem[]
}

export const useStoryStore = create<StoryState>((set, get) => ({
  items: [],

  setItems: (items) => set({ items }),

  addItem: (item) => set((s) => ({ items: [...s.items, item] })),

  updateItem: (id, patch) =>
    set((s) => ({
      items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    })),

  getByAudience: (audience) =>
    get().items.filter((it) => it.audience === audience),
}))
