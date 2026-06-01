/**
 * C-2-1 / C-4: フェーズ遷移ルール定義
 * 各フェーズ → 次フェーズへの遷移条件マトリクス
 *
 * フェーズ順序（C-4更新後）:
 * IDLE → KNOWLEDGE_SYNC → PHASE1 → PHASE2 → PHASE3
 *      → PLANNING → HUMAN_EXEC → AI_EXEC → SYNC_BACK
 */

import type { Phase } from '../types/agenda'
import type { PhaseTransitionRule, PhaseContext } from '../types/phase'

/** フェーズ表示名（日本語） */
export const PHASE_LABELS: Record<Phase, string> = {
  IDLE:           '待機',
  KNOWLEDGE_SYNC: '情報同期',
  PHASE1:         '課題共有',
  PHASE2:         '合意形成',
  PHASE3:         '意思決定',
  PLANNING:       '実行計画',
  HUMAN_EXEC:     '人的実行',
  AI_EXEC:        'AI実行',
  SYNC_BACK:      '外部システム同期',
}

/** フェーズ表示名（英語） */
export const PHASE_LABELS_EN: Record<Phase, string> = {
  IDLE:           'Idle',
  KNOWLEDGE_SYNC: 'Knowledge Sync',
  PHASE1:         'Problem Sharing',
  PHASE2:         'Consensus Building',
  PHASE3:         'Decision Making',
  PLANNING:       'Planning',
  HUMAN_EXEC:     'Human Exec',
  AI_EXEC:        'AI Exec',
  SYNC_BACK:      'External Sync',
}

/** フェーズ順序 */
export const PHASE_ORDER: Phase[] = [
  'IDLE',
  'KNOWLEDGE_SYNC',
  'PHASE1',
  'PHASE2',
  'PHASE3',
  'PLANNING',
  'HUMAN_EXEC',
  'AI_EXEC',
  'SYNC_BACK',
]

/** 次のフェーズを返す。最終フェーズの場合は null */
export function getNextPhase(current: Phase): Phase | null {
  const idx = PHASE_ORDER.indexOf(current)
  return idx >= 0 && idx < PHASE_ORDER.length - 1 ? PHASE_ORDER[idx + 1] : null
}

/** 前のフェーズを返す。最初のフェーズの場合は null */
export function getPrevPhase(current: Phase): Phase | null {
  const idx = PHASE_ORDER.indexOf(current)
  return idx > 0 ? PHASE_ORDER[idx - 1] : null
}

/**
 * C-2-1 / C-4 遷移条件マトリクス
 * キー = 現在のフェーズ、値 = 遷移ルール
 * SYNC_BACK は最終フェーズのためエントリなし
 */
export const PHASE_TRANSITION_RULES: Partial<Record<Phase, PhaseTransitionRule>> = {
  IDLE: {
    from: 'IDLE',
    to: 'KNOWLEDGE_SYNC',
    toLabel: PHASE_LABELS.KNOWLEDGE_SYNC,
    autoAdvance: false,
    autoDelaySeconds: 10,
    conditions: [],  // 条件なし — 会議開始ボタンのみ
  },

  KNOWLEDGE_SYNC: {
    from: 'KNOWLEDGE_SYNC',
    to: 'PHASE1',
    toLabel: PHASE_LABELS.PHASE1,
    autoAdvance: false,
    autoDelaySeconds: 10,
    conditions: [
      {
        id: 'voice_min_1',
        label: 'Voice が 1 件以上登録されている',
        required: true,
        check: (ctx) => ({
          met: ctx.voiceCount >= 1,
          info: `現在 ${ctx.voiceCount} 件`,
        }),
      },
      {
        id: 'voice_recommended_3',
        label: 'Voice が 3 件以上（推奨）',
        required: false,
        check: (ctx) => ({
          met: ctx.voiceCount >= 3,
          info: `現在 ${ctx.voiceCount} 件`,
        }),
      },
    ],
  },

  PHASE1: {
    from: 'PHASE1',
    to: 'PHASE2',
    toLabel: PHASE_LABELS.PHASE2,
    autoAdvance: false,
    autoDelaySeconds: 10,
    conditions: [
      {
        id: 'agenda_min_1',
        label: 'アジェンダが 1 件以上存在する',
        required: true,
        check: (ctx) => ({
          met: ctx.agendaItems.length >= 1,
          info: `現在 ${ctx.agendaItems.length} 件`,
        }),
      },
      {
        id: 'discussion_started',
        label: 'いずれかのアジェンダで議論が開始されている',
        required: true,
        check: (ctx) => {
          const active = ctx.agendaItems.filter(a => !a.parked)
          const started = active.filter(
            a => a.discussionLog.length > 0 || a.status !== 'pending',
          )
          return {
            met: started.length > 0,
            info: `${started.length} / ${active.length} 件で議論中`,
          }
        },
      },
    ],
  },

  PHASE2: {
    from: 'PHASE2',
    to: 'PHASE3',
    toLabel: PHASE_LABELS.PHASE3,
    autoAdvance: false,
    autoDelaySeconds: 10,
    conditions: [
      {
        id: 'positions_expressed',
        label: 'アクティブなアジェンダに立場表明が 1 件以上ある',
        required: true,
        check: (ctx) => {
          const active = ctx.agendaItems.filter(a => !a.parked)
          const withPos = active.filter(a => a.positions.length > 0)
          return {
            met: withPos.length > 0,
            info: `${withPos.length} / ${active.length} 件に立場表明済`,
          }
        },
      },
      {
        id: 'all_converging',
        label: '全アジェンダが収束中以上のステータス（推奨）',
        required: false,
        check: (ctx) => {
          const active = ctx.agendaItems.filter(a => !a.parked)
          const converging = active.filter(a =>
            ['converging', 'aligned', 'awaiting_exec', 'decided'].includes(a.status),
          )
          return {
            met: active.length === 0 || converging.length === active.length,
            info: `${converging.length} / ${active.length} 件が収束中以上`,
          }
        },
      },
    ],
  },

  PHASE3: {
    from: 'PHASE3',
    to: 'PLANNING',
    toLabel: PHASE_LABELS.PLANNING,
    autoAdvance: false,
    autoDelaySeconds: 10,
    conditions: [
      {
        id: 'all_resolved',
        label: 'アクティブな全アジェンダが合意・完了済',
        required: true,
        check: (ctx) => {
          const active = ctx.agendaItems.filter(a => !a.parked)
          const resolved = active.filter(a =>
            ['aligned', 'awaiting_exec', 'decided'].includes(a.status),
          )
          return {
            met: active.length === 0 || resolved.length === active.length,
            info: `${resolved.length} / ${active.length} 件が合意・完了`,
          }
        },
      },
      {
        id: 'decision_recorded',
        label: 'Decision が 1 件以上記録されている（推奨）',
        required: false,
        check: (ctx) => ({
          met: ctx.decisionCount >= 1,
          info: `現在 ${ctx.decisionCount} 件`,
        }),
      },
    ],
  },

  /** C-4 / H-1: PLANNING → HUMAN_EXEC */
  PLANNING: {
    from: 'PLANNING',
    to: 'HUMAN_EXEC',
    toLabel: PHASE_LABELS.HUMAN_EXEC,
    autoAdvance: false,
    autoDelaySeconds: 10,
    conditions: [
      {
        id: 'story_approved',
        label: 'Story が 1 件以上承認済み',
        required: true,
        check: (ctx: PhaseContext) => {
          // H-1: storyApprovedCount が提供されれば優先。未提供時は decisionCount で代替
          const count = ctx.storyApprovedCount ?? ctx.decisionCount
          return { met: count >= 1, info: `承認済 Story ${count} 件` }
        },
      },
    ],
  },

  /** C-4: HUMAN_EXEC → AI_EXEC */
  HUMAN_EXEC: {
    from: 'HUMAN_EXEC',
    to: 'AI_EXEC',
    toLabel: PHASE_LABELS.AI_EXEC,
    autoAdvance: false,
    autoDelaySeconds: 10,
    conditions: [
      {
        id: 'human_tasks_progress',
        label: '人的実行タスクが着手済み（推奨）',
        required: false,
        check: (_ctx) => ({
          // H-1 実装後に humanTasksInProgress カウントで置き換え
          met: false,
          info: 'タスク進捗は HumanExec タブで確認',
        }),
      },
    ],
  },

  /** C-4: AI_EXEC → SYNC_BACK */
  AI_EXEC: {
    from: 'AI_EXEC',
    to: 'SYNC_BACK',
    toLabel: PHASE_LABELS.SYNC_BACK,
    autoAdvance: false,
    autoDelaySeconds: 10,
    conditions: [
      {
        id: 'ai_tasks_progress',
        label: 'AI実行タスクが着手済み（推奨）',
        required: false,
        check: (_ctx) => ({
          met: false,
          info: 'タスク進捗は AIExec タブで確認',
        }),
      },
    ],
  },
}
