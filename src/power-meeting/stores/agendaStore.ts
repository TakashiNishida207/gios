import { create } from 'zustand'
import type { AgendaItem, DiscussionEntry, Reaction, Position, Phase, Role } from '@pm/types/agenda'
import type { PhaseTransitionEvent, TransitionMode } from '@pm/types/phase'
import { useAttendeeStore } from '@pm/stores/attendeeStore'

const CONSENSUS_THRESHOLD = 0.7
const POSITIONS_TIEBREAK_FEATURE_FLAG = true

type AgendaState = {
  items: AgendaItem[]
  roles: Role[]
  currentPhase: Phase
  selectedIds: string[]
  transitionHistory: PhaseTransitionEvent[]

  setItems: (items: AgendaItem[]) => void
  setRoles: (roles: Role[]) => void
  setPhase: (phase: Phase) => void
  setSelectedIds: (ids: string[]) => void
  toggleSelected: (id: string) => void
  /** C-2: フェーズ遷移（モード・操作者・理由を記録） */
  advancePhase: (to: Phase, mode: TransitionMode, triggeredBy: string, reason?: string) => void

  addDiscussionEntry: (agendaId: string, entry: DiscussionEntry) => void
  addReaction: (agendaId: string, reaction: Reaction) => void
  removeReaction: (agendaId: string, reactionId: string) => void
  setPosition: (agendaId: string, position: Position) => void
  parkAgenda: (agendaId: string, details?: { reason?: string; carryOverDate?: string; comment?: string }) => void
  updateStatus: (agendaId: string, status: AgendaItem['status']) => void

  getConsensusScore: (agendaId: string) => number
  getWeightedLinearScore: (agendaId: string) => number
  getOverconsensusItems: () => AgendaItem[]
  /** E-1: 他アジェンダから agendaId にリンクしている発言を返す */
  getCrossLinkedEntries: (agendaId: string) => { entry: DiscussionEntry; sourceAgenda: AgendaItem }[]
}

/**
 * 案A「沈黙＝中立」方式
 * - 全ロールを分母に含める
 * - 立場未表明のロールは neutral (0.5) として自動カウント
 * - スコア = Σ(stanceVal × role.weight) / Σ(role.weight)
 */
function computeWeightedScore(positions: Position[], roles: Role[]): number {
  if (roles.length === 0) return 0
  const posMap = new Map(positions.map(p => [p.roleId, p.stance]))
  const totalWeight = roles.reduce((s, r) => s + r.weight, 0)
  if (totalWeight === 0) return 0
  const total = roles.reduce((sum, role) => {
    const stance = posMap.get(role.id) ?? 'neutral'   // 未表明 → 中立
    const val    = stance === 'agree' ? 1 : stance === 'neutral' ? 0.5 : 0
    return sum + val * role.weight
  }, 0)
  return total / totalWeight
}

/** 立場ごとの内訳を返すユーティリティ（UI表示用） */
export type ConsensusBreakdown = {
  score: number
  roleBreakdown: { roleId: string; roleName: string; stance: 'agree' | 'neutral' | 'disagree'; expressed: boolean }[]
}
export function buildConsensusBreakdown(
  positions: Position[],
  roles: Role[],
): ConsensusBreakdown {
  const posMap = new Map(positions.map(p => [p.roleId, p.stance]))
  const roleBreakdown = roles.map(role => ({
    roleId:   role.id,
    roleName: role.name,
    stance:   (posMap.get(role.id) ?? 'neutral') as 'agree' | 'neutral' | 'disagree',
    expressed: posMap.has(role.id),
  }))
  const score = computeWeightedScore(positions, roles)
  return { score, roleBreakdown }
}

export const useAgendaStore = create<AgendaState>((set, get) => ({
  items: [],
  roles: [],
  currentPhase: 'PHASE1',
  selectedIds: [],
  transitionHistory: [],

  setItems: (items) => set({ items }),
  setRoles: (roles) => set({ roles }),
  setPhase: (currentPhase) => set({ currentPhase }),
  setSelectedIds: (selectedIds) => set({ selectedIds }),

  advancePhase: (to, mode, triggeredBy, reason) => {
    const from = get().currentPhase
    const event: PhaseTransitionEvent = {
      from,
      to,
      mode,
      triggeredBy,
      reason,
      ts: new Date().toISOString(),
    }
    set(state => ({
      currentPhase: to,
      transitionHistory: [...state.transitionHistory, event],
    }))
  },

  toggleSelected: (id) =>
    set(state => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter(i => i !== id)
        : [...state.selectedIds, id],
    })),

  addDiscussionEntry: (agendaId, entry) =>
    set(state => ({
      items: state.items.map(item =>
        item.id === agendaId
          ? { ...item, discussionLog: [...item.discussionLog, entry] }
          : item
      ),
    })),

  addReaction: (agendaId, reaction) =>
    set(state => ({
      items: state.items.map(item =>
        item.id === agendaId
          ? { ...item, reactions: [...item.reactions, reaction] }
          : item
      ),
    })),

  removeReaction: (agendaId, reactionId) =>
    set(state => ({
      items: state.items.map(item =>
        item.id === agendaId
          ? { ...item, reactions: item.reactions.filter(r => r.id !== reactionId) }
          : item
      ),
    })),

  setPosition: (agendaId, position) =>
    set(state => ({
      items: state.items.map(item => {
        if (item.id !== agendaId) return item
        const existing = item.positions.findIndex(p => p.roleId === position.roleId)
        const positions = existing >= 0
          ? item.positions.map((p, i) => (i === existing ? position : p))
          : [...item.positions, position]
        return { ...item, positions }
      }),
    })),

  parkAgenda: (agendaId, details) =>
    set(state => ({
      items: state.items.map(item =>
        item.id === agendaId
          ? {
              ...item,
              parked: true,
              status: 'parked',
              parkedFrom: new Date().toISOString(),
              parkedReason:         details?.reason,
              parkedCarryOverDate:  details?.carryOverDate,
              parkedComment:        details?.comment,
            }
          : item
      ),
    })),

  updateStatus: (agendaId, status) =>
    set(state => ({
      items: state.items.map(item =>
        item.id === agendaId ? { ...item, status } : item
      ),
    })),

  getConsensusScore: (agendaId) => {
    const { items, roles } = get()
    const item = items.find(i => i.id === agendaId)
    if (!item) return 0
    // 出席者ストアが初期化済みであれば実効ウェイトを使用
    const effectiveRoles = useAttendeeStore.getState().getEffectiveRoles()
    const activeRoles = effectiveRoles.length > 0 ? effectiveRoles : roles
    return computeWeightedScore(item.positions, activeRoles)
  },

  getWeightedLinearScore: (agendaId) => {
    const { items, roles } = get()
    const item = items.find(i => i.id === agendaId)
    if (!item) return 0
    const effectiveRoles = useAttendeeStore.getState().getEffectiveRoles()
    const activeRoles = effectiveRoles.length > 0 ? effectiveRoles : roles
    const baseScore = computeWeightedScore(item.positions, activeRoles)
    if (!POSITIONS_TIEBREAK_FEATURE_FLAG) return baseScore
    // positions 差分を tiebreak 候補として反映（feature flag）
    // 全ロール数を分母にして agree-disagree 差分を微小加算
    const agreeCount    = item.positions.filter(p => p.stance === 'agree').length
    const disagreeCount = item.positions.filter(p => p.stance === 'disagree').length
    const diff = (agreeCount - disagreeCount) / Math.max(activeRoles.length, 1)
    return baseScore + diff * 0.01
  },

  getOverconsensusItems: () => {
    const { items, roles, currentPhase } = get()
    if (currentPhase !== 'PHASE3') return []
    return items.filter(item => {
      const score = computeWeightedScore(item.positions, roles)
      return score < CONSENSUS_THRESHOLD && !item.parked
    })
  },

  getCrossLinkedEntries: (agendaId) => {
    const { items } = get()
    const results: { entry: DiscussionEntry; sourceAgenda: AgendaItem }[] = []
    for (const agenda of items) {
      if (agenda.id === agendaId) continue
      for (const entry of agenda.discussionLog) {
        if (entry.linkedAgendaIds?.includes(agendaId)) {
          results.push({ entry, sourceAgenda: agenda })
        }
      }
    }
    return results
  },
}))
