export type AttendeeStatus = 'present' | 'remote' | 'absent'

export interface Attendee {
  roleId: string
  name: string
  /** 出席ステータス */
  status: AttendeeStatus
  /** 元のロール重みそのまま */
  baseWeight: number
  /**
   * 実効ウェイト: 欠席者を除外して出席者間で再按分した値。
   * computeWeightedScore はこの値を使う。
   * absent → 0, present/remote → baseWeight / Σ(present+remote baseWeights)
   */
  effectiveWeight: number
  /** 入室時刻 (任意) */
  joinedAt?: string
  /** ファシリテータメモ */
  note?: string
}
