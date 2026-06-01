import { create } from 'zustand'
import type { Attendee, AttendeeStatus } from '../types/attendee'
import type { Role } from '../types/agenda'

/** 出席者に対して effectiveWeight を再計算して返す（純粋関数） */
export function recalcEffectiveWeights(attendees: Attendee[]): Attendee[] {
  const presentTotal = attendees
    .filter(a => a.status !== 'absent')
    .reduce((s, a) => s + a.baseWeight, 0)

  return attendees.map(a => ({
    ...a,
    effectiveWeight:
      a.status === 'absent'
        ? 0
        : presentTotal > 0
          ? a.baseWeight / presentTotal
          : 0,
  }))
}

interface AttendeeState {
  attendees: Attendee[]

  /** ロール一覧から初期化（全員 present） */
  initFromRoles: (roles: Role[]) => void
  setStatus: (roleId: string, status: AttendeeStatus) => void
  setNote: (roleId: string, note: string) => void

  /** roleId → effectiveWeight (見つからなければ 0) */
  getEffectiveWeight: (roleId: string) => number
  /**
   * 実効ウェイトを反映した Role 配列。
   * agendaStore の computeWeightedScore に渡すことで欠席補正を行う。
   */
  getEffectiveRoles: () => Role[]
  /** 出席者数 (present + remote) */
  getPresentCount: () => number
}

export const useAttendeeStore = create<AttendeeState>((set, get) => ({
  attendees: [],

  initFromRoles: (roles) => {
    const total = roles.reduce((s, r) => s + r.weight, 0)
    const base: Attendee[] = roles.map(r => ({
      roleId:          r.id,
      name:            r.name,
      status:          'present',
      baseWeight:      r.weight,
      effectiveWeight: total > 0 ? r.weight / total : 0,
    }))
    set({ attendees: recalcEffectiveWeights(base) })
  },

  setStatus: (roleId, status) =>
    set(state => ({
      attendees: recalcEffectiveWeights(
        state.attendees.map(a =>
          a.roleId === roleId ? { ...a, status } : a
        )
      ),
    })),

  setNote: (roleId, note) =>
    set(state => ({
      attendees: state.attendees.map(a =>
        a.roleId === roleId ? { ...a, note } : a
      ),
    })),

  getEffectiveWeight: (roleId) =>
    get().attendees.find(a => a.roleId === roleId)?.effectiveWeight ?? 0,

  getEffectiveRoles: () =>
    get().attendees.map(a => ({
      id:     a.roleId,
      name:   a.name,
      weight: a.effectiveWeight,
    })),

  getPresentCount: () =>
    get().attendees.filter(a => a.status !== 'absent').length,
}))
