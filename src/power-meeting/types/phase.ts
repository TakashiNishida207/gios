/**
 * C-2: フェーズ遷移トリガー
 * フェーズ遷移に関する型定義
 */

import type { AgendaItem, Phase } from './agenda'

export type TransitionMode = 'auto' | 'manual' | 'force' | 'rollback'

/** 条件チェックに使うコンテキスト */
export interface PhaseContext {
  voiceCount: number
  agendaItems: AgendaItem[]
  decisionCount: number
  /** H-1: 承認済みStory数（PLANNING→HUMAN_EXECの条件に使用） */
  storyApprovedCount?: number
}

/** 遷移条件の定義 */
export interface ConditionSpec {
  id: string
  label: string
  required: boolean
  check: (ctx: PhaseContext) => { met: boolean; info?: string }
}

/** フェーズ遷移ルール */
export interface PhaseTransitionRule {
  from: Phase
  to: Phase
  toLabel: string
  conditions: ConditionSpec[]
  /** true のとき全必須条件達成で自動遷移カウントダウンを開始 */
  autoAdvance: boolean
  autoDelaySeconds: number
}

/** 条件評価結果（UI 表示用） */
export interface ConditionResult {
  id: string
  label: string
  met: boolean
  info?: string
  required: boolean
}

/** フェーズ遷移チェック結果 */
export interface TransitionCheckResult {
  /** 必須条件が全て満たされている */
  canAdvance: boolean
  /** 必須・任意を含む全条件が満たされている */
  allMet: boolean
  conditions: ConditionResult[]
  /** autoAdvance が true かつ canAdvance */
  readyForAuto: boolean
}

/** フェーズ遷移イベント（履歴記録用） */
export interface PhaseTransitionEvent {
  from: Phase
  to: Phase
  mode: TransitionMode
  triggeredBy: string
  reason?: string
  ts: string
}
