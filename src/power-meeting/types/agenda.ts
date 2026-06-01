export type Phase =
  | 'IDLE'
  | 'KNOWLEDGE_SYNC'
  | 'PHASE1'
  | 'PHASE2'
  | 'PHASE3'
  | 'PLANNING'      // C-4: 旧 EXECUTION → リネーム
  | 'HUMAN_EXEC'    // C-4: 人的実行フェーズ
  | 'AI_EXEC'       // C-4: AI実行フェーズ
  | 'SYNC_BACK'

export type DiscussionEntry = {
  id: string
  speaker: string
  roleId: string
  ts: string
  text: string
  phase: Phase
  replyTo?: string
  /** E-1: この発言をクロス共有する他アジェンダの ID 一覧 */
  linkedAgendaIds?: string[]
}

export type Reaction = {
  id: string
  emoji: '👍' | '⭐' | '❓' | '⚠️'
  roleId: string
  ts: string
}

export type Stance = 'agree' | 'neutral' | 'disagree'

export type Position = {
  roleId: string
  stance: Stance
  weightContribution: number
  note?: string
  ts: string
}

export type AgendaItemStatus =
  | 'pending'        // 未開始 — アジェンダ登録済・議論未着手
  | 'in_discussion'  // 議論中 — 情報共有・意見交換フェーズ
  | 'converging'     // 収束中 — 立場表明済み・合意形成フェーズ
  | 'aligned'        // 合意   — 方向性一致・次ステップ確認待ち
  | 'awaiting_exec'  // EXEC待ち — 決定済み・実行フェーズ移行待ち
  | 'decided'        // 完了   — アクション・担当者確定・クローズ
  | 'parked'         // 保留中 — 次回以降に持ち越し

export type AgendaItem = {
  id: string
  title: string
  ownerRoleId: string
  timeBudgetMin: number
  status: AgendaItemStatus
  discussionLog: DiscussionEntry[]
  reactions: Reaction[]
  positions: Position[]
  parked: boolean
  parkedFrom?: string
  /** 保留理由 */
  parkedReason?: string
  /** 次回持ち越し予定日 (ISO date string: YYYY-MM-DD) */
  parkedCarryOverDate?: string
  /** 保留時の担当者コメント */
  parkedComment?: string
  linkedVoiceIds?: string[]
  linkedDecisionIds?: string[]
  linkedInformationBlockIds?: string[]
  /** V2.1新規 */
  linkedGrowthIds?: string[]
  /** V2.1新規 */
  linkedStoryIds?: string[]
}

export type Role = {
  id: string
  name: string
  weight: number
}

export type MeetingBundle = {
  id: string
  name: string
  phase: Phase
  roles: Role[]
  agendaItems: AgendaItem[]
  voices: import('./voice').VoiceItem[]
}
