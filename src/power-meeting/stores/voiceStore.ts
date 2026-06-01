import { create } from 'zustand'
import type { VoiceItem, VoiceSource } from '../types/voice'

/** D-3: ソート順 */
export type VoiceSort = 'newest' | 'importance'

/** D-2: センチメント重要度スコア（高い = 重要） */
const SENTIMENT_WEIGHT: Record<string, number> = {
  critical: 6, negative: 5, concerned: 4,
  neutral: 3, positive: 2, advocacy: 1,
}

type VoiceFilter = {
  sources: VoiceSource[]
  mode: 'OR' | 'AND'
  otherSubSource?: string
}

type VoiceState = {
  items: VoiceItem[]
  filter: VoiceFilter
  isLoading: boolean
  /** D-3 */
  sort: VoiceSort
  /** D-2 */
  groupByIncident: boolean

  setItems: (items: VoiceItem[]) => void
  addItem: (item: VoiceItem) => void
  setFilter: (filter: Partial<VoiceFilter>) => void
  toggleSource: (source: VoiceSource) => void
  setFilterMode: (mode: 'OR' | 'AND') => void
  setLoading: (loading: boolean) => void
  /** D-3 */
  setSort: (sort: VoiceSort) => void
  /** D-2 */
  toggleGroupByIncident: () => void
  updateItemIncidentId: (itemId: string, incidentId: string | undefined) => void
  getFilteredItems: () => VoiceItem[]
  getCountBySource: (source: VoiceSource) => number
  /** D-2: フィルタ済みアイテムをインシデントIDでグループ化 */
  getGroupedItems: () => {
    byIncident: { incidentId: string; items: VoiceItem[] }[]
    standalone: VoiceItem[]
  }
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  items: [],
  filter: { sources: [], mode: 'OR' },
  isLoading: false,
  sort: 'newest',
  groupByIncident: false,

  setItems: (items) => set({ items }),
  addItem: (item) => set(state => ({ items: [...state.items, item] })),
  setLoading: (isLoading) => set({ isLoading }),

  setFilter: (partial) =>
    set(state => ({ filter: { ...state.filter, ...partial } })),

  toggleSource: (source) =>
    set(state => {
      const sources = state.filter.sources.includes(source)
        ? state.filter.sources.filter(s => s !== source)
        : [...state.filter.sources, source]
      return { filter: { ...state.filter, sources } }
    }),

  setFilterMode: (mode) =>
    set(state => ({ filter: { ...state.filter, mode } })),

  setSort: (sort) => set({ sort }),

  toggleGroupByIncident: () =>
    set(state => ({ groupByIncident: !state.groupByIncident })),

  updateItemIncidentId: (itemId, incidentId) =>
    set(state => ({
      items: state.items.map(it =>
        it.id === itemId ? { ...it, incidentId } : it,
      ),
    })),

  getFilteredItems: () => {
    const { items, filter, sort } = get()
    let result = items
    if (filter.sources.length > 0) {
      if (filter.mode === 'OR') {
        result = result.filter(item => filter.sources.includes(item.source))
      } else {
        result = result.filter(item => filter.sources.every(s => s === item.source))
      }
    }
    // D-3: ソート
    if (sort === 'newest') {
      result = [...result].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    } else {
      result = [...result].sort((a, b) => {
        const wa = SENTIMENT_WEIGHT[a.sentiment ?? ''] ?? 0
        const wb = SENTIMENT_WEIGHT[b.sentiment ?? ''] ?? 0
        return wb - wa
      })
    }
    return result
  },

  getCountBySource: (source) => {
    return get().items.filter(item => item.source === source).length
  },

  getGroupedItems: () => {
    const filtered = get().getFilteredItems()
    const groups: Record<string, VoiceItem[]> = {}
    const standalone: VoiceItem[] = []
    for (const item of filtered) {
      if (item.incidentId) {
        if (!groups[item.incidentId]) groups[item.incidentId] = []
        groups[item.incidentId].push(item)
      } else {
        standalone.push(item)
      }
    }
    const byIncident = Object.entries(groups).map(([incidentId, items]) => ({ incidentId, items }))
    return { byIncident, standalone }
  },
}))
