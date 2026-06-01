"use client"

import type { AgendaItem, Phase } from '@pm/types/agenda'
import type { VoiceItem } from '@pm/types/voice'
import { useAgendaStore } from '@pm/stores/agendaStore'
import { useGrowthStore } from '@pm/stores/growthStore'
import { AgendaInput } from './AgendaInput'
import { VoiceCard } from '@pm/components/VoiceTab/VoiceCard'
import { scoreAgendaItem } from '@pm/utils/scoreMissionAlignment'
import { usePreferences } from '@/ui/preferences'

const COL_LABELS = {
  ja: {
    agenda:     'アジェンダ',
    voice:      'ボイス',
    growth:     'グロース',
    decision:   'デシジョン',
    story:      'ストーリー',
    discussion: 'ディスカッション',
    consensus:  'コンセンサス',
  },
  en: {
    agenda:     'Agenda',
    voice:      'Voice',
    growth:     'Growth',
    decision:   'Decision',
    story:      'Story',
    discussion: 'Discussion',
    consensus:  'Consensus',
  },
} as const

type CellState = 'active' | 'loading' | 'readonly' | 'hidden' | 'progress' | 'confirmed'

type ColId = 'voice' | 'growth' | 'decision' | 'story' | 'discussion' | 'consensus'

/** C-4: 旧 EXECUTION → PLANNING + HUMAN_EXEC + AI_EXEC 追加 */
const PHASE_CELL_STATE: Record<Phase, Record<ColId, CellState>> = {
  IDLE:           { voice: 'hidden',    growth: 'hidden',    decision: 'hidden',     story: 'hidden',   discussion: 'hidden',    consensus: 'hidden' },
  KNOWLEDGE_SYNC: { voice: 'loading',   growth: 'loading',   decision: 'hidden',     story: 'active',   discussion: 'hidden',    consensus: 'hidden' },
  PHASE1:         { voice: 'active',    growth: 'active',    decision: 'hidden',     story: 'active',   discussion: 'active',    consensus: 'hidden' },
  PHASE2:         { voice: 'readonly',  growth: 'readonly',  decision: 'active',     story: 'active',   discussion: 'active',    consensus: 'progress' },
  PHASE3:         { voice: 'readonly',  growth: 'readonly',  decision: 'confirmed',  story: 'active',   discussion: 'active',    consensus: 'active' },
  PLANNING:       { voice: 'readonly',  growth: 'readonly',  decision: 'confirmed',  story: 'active',   discussion: 'readonly',  consensus: 'confirmed' },
  HUMAN_EXEC:     { voice: 'readonly',  growth: 'readonly',  decision: 'confirmed',  story: 'readonly', discussion: 'readonly',  consensus: 'confirmed' },
  AI_EXEC:        { voice: 'readonly',  growth: 'readonly',  decision: 'confirmed',  story: 'readonly', discussion: 'readonly',  consensus: 'confirmed' },
  SYNC_BACK:      { voice: 'readonly',  growth: 'readonly',  decision: 'confirmed',  story: 'readonly', discussion: 'readonly',  consensus: 'confirmed' },
}

type Props = {
  agendaItems: AgendaItem[]
  voiceItems: VoiceItem[]
  phase: Phase
  currentRoleId: string
  currentRoleName: string
  onSelectItem: (item: AgendaItem) => void
}

function CellWrapper({ state, children, className = '' }: { state: CellState; children: React.ReactNode; className?: string }) {
  const base = 'px-2 py-2 align-top border-b border-gray-100'
  if (state === 'hidden') return <td className={`${base} ${className}`} />
  if (state === 'loading') {
    return (
      <td className={`${base} ${className} bg-gray-50`}>
        <div className="animate-pulse flex gap-1">
          <div className="h-2 bg-gray-200 rounded w-8" />
          <div className="h-2 bg-gray-200 rounded w-12" />
        </div>
      </td>
    )
  }
  // readonly: pointer-events のみ無効化（opacity はかけない → 視認性を維持）
  const overlay = state === 'readonly' ? 'pointer-events-none' : ''
  return <td className={`${base} ${className} ${overlay}`}>{children}</td>
}

// メインフロー（parked はサイドブランチなので除外）
const STATUS_FLOW: AgendaItem['status'][] = [
  'pending', 'in_discussion', 'converging', 'aligned', 'awaiting_exec', 'decided',
]

const STATUS_CONFIG: Record<AgendaItem['status'], {
  label: string
  badge: string       // background + text
  dot: string         // フロードットの active 色
  tooltip: string
}> = {
  pending:       { label: '未開始',    badge: 'bg-gray-100 text-gray-500',         dot: 'bg-gray-300',     tooltip: 'アジェンダ登録済 — 議論未着手' },
  in_discussion: { label: '議論中',    badge: 'bg-blue-100 text-blue-700',          dot: 'bg-blue-500',     tooltip: '情報共有・意見交換フェーズ' },
  converging:    { label: '収束中',    badge: 'bg-indigo-100 text-indigo-700',      dot: 'bg-indigo-500',   tooltip: '立場表明済み・合意形成フェーズ' },
  aligned:       { label: '合意',      badge: 'bg-green-100 text-green-700',        dot: 'bg-green-500',    tooltip: '方向性一致 — 次ステップ確認待ち' },
  awaiting_exec: { label: 'EXEC待ち',  badge: 'bg-amber-100 text-amber-700',        dot: 'bg-amber-500',    tooltip: '決定済み — 実行フェーズへの移行待ち' },
  decided:       { label: '完了',      badge: 'bg-purple-100 text-purple-700',      dot: 'bg-purple-500',   tooltip: 'アクション・担当者確定・クローズ' },
  parked:        { label: '保留中',    badge: 'bg-yellow-100 text-yellow-700',      dot: 'bg-yellow-500',   tooltip: '次回以降に持ち越し' },
}

function StatusBadge({ status }: { status: AgendaItem['status'] }) {
  const cfg = STATUS_CONFIG[status]
  const flowIdx = STATUS_FLOW.indexOf(status)  // -1 if parked

  return (
    <div className="flex flex-col gap-0.5">
      {/* ステータスラベル */}
      <span
        className={`text-xs px-1.5 py-0.5 rounded-full font-medium w-fit ${cfg.badge}`}
        title={cfg.tooltip}
      >
        {cfg.label}
      </span>
      {/* フロードット（parked 時は非表示） */}
      {flowIdx >= 0 && (
        <div className="flex gap-0.5 pl-0.5" title={`進捗: ${flowIdx + 1} / ${STATUS_FLOW.length} ステップ`}>
          {STATUS_FLOW.map((s, i) => (
            <div
              key={s}
              className={`w-1.5 h-1.5 rounded-full ${
                i < flowIdx  ? 'bg-gray-300' :       // 通過済み（淡色）
                i === flowIdx ? cfg.dot :              // 現在地（色付き）
                'bg-gray-100'                          // 未到達（極淡）
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ConsensusCell({ item, state }: { item: AgendaItem; state: CellState }) {
  const { getConsensusScore, roles } = useAgendaStore()
  const score = getConsensusScore(item.id)
  const posMap = new Map(item.positions.map(p => [p.roleId, p.stance]))

  // 案A: 全ロール分のドットを表示
  // 🟢 賛成(表明済)  ⚪ 中立(表明済)  🔴 反対(表明済)  ○ 未表明(→中立扱い・点線)
  const stanceColor = (roleId: string) => {
    const stance = posMap.get(roleId)
    if (!stance) return 'bg-gray-100 border border-dashed border-gray-400'   // 未表明
    if (stance === 'agree')    return 'bg-green-500'
    if (stance === 'disagree') return 'bg-red-400'
    return 'bg-gray-300'   // neutral 表明済
  }

  const stanceLabel = (roleId: string) => {
    const stance = posMap.get(roleId)
    if (!stance) return '未表明（中立扱い）'
    return { agree: '賛成', neutral: '中立', disagree: '反対' }[stance]
  }

  const scoreColor = score >= 0.7 ? 'text-green-600' : score >= 0.4 ? 'text-yellow-600' : 'text-red-600'
  const barColor   = score >= 0.7 ? 'from-green-400 to-green-600'
                   : score >= 0.4 ? 'from-yellow-400 to-yellow-500'
                   : 'from-red-400 to-red-500'

  return (
    <CellWrapper state={state} className="w-[12%]">
      {state !== 'hidden' && (
        <div className="space-y-1.5">
          {/* スコアバー */}
          <div>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-gray-500">合意度</span>
              <span className={`font-semibold ${scoreColor}`}>
                {Math.round(score * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-300`}
                style={{ width: `${score * 100}%` }}
              />
            </div>
          </div>

          {/* 全ロール分のドット（案A: 未表明は点線グレー） */}
          {roles.length > 0 && (
            <div className="flex gap-0.5 flex-wrap">
              {roles.map(role => (
                <div
                  key={role.id}
                  className={`w-2.5 h-2.5 rounded-full ${stanceColor(role.id)}`}
                  title={`${role.name}: ${stanceLabel(role.id)}`}
                />
              ))}
            </div>
          )}

          {/* 未表明ロール数の注記 */}
          {(() => {
            const unexpressed = roles.filter(r => !posMap.has(r.id)).length
            return unexpressed > 0 ? (
              <p className="text-xs text-gray-400">未表明 {unexpressed}名 →中立扱い</p>
            ) : null
          })()}
        </div>
      )}
    </CellWrapper>
  )
}

/** A-4: GHS スコアバッジ — Growth 列に表示 */
function GhsScoreBadge({ agendaId }: { agendaId: string }) {
  const { items: ghsItems } = useGrowthStore()
  const linked = ghsItems.filter(g => g.scope === 'agenda' && g.agendaId === agendaId)
  if (linked.length === 0) {
    return <div className="text-xs text-gray-300 italic text-center">—</div>
  }
  return (
    <div className="space-y-1.5">
      {linked.map(g => {
        const scoreColor = g.score >= 60 ? 'text-green-600' : g.score >= 40 ? 'text-yellow-600' : 'text-red-500'
        const barColor   = g.score >= 60 ? 'from-green-400 to-green-500'
                         : g.score >= 40 ? 'from-yellow-400 to-yellow-500'
                         : 'from-red-400 to-red-500'
        const trendIcon  = g.trend === 'up' ? '↑' : g.trend === 'down' ? '↓' : '→'
        const trendColor = g.trend === 'up' ? 'text-green-500' : g.trend === 'down' ? 'text-red-500' : 'text-gray-400'
        return (
          <div key={g.id} className="space-y-0.5" title={g.title}>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-semibold tabular-nums ${scoreColor}`}>{g.score}</span>
              <span className={`font-bold text-[10px] ${trendColor}`}>{trendIcon}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all`}
                style={{ width: `${g.score}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 leading-tight line-clamp-1">{g.title}</p>
          </div>
        )
      })}
    </div>
  )
}

export function MatrixView({ agendaItems, voiceItems, phase, currentRoleId, currentRoleName, onSelectItem }: Props) {
  const { selectedIds, toggleSelected } = useAgendaStore()
  const states = PHASE_CELL_STATE[phase]
  const { lang } = usePreferences()
  const col = COL_LABELS[lang]

  function getLinkedVoice(item: AgendaItem): VoiceItem[] {
    if (!item.linkedVoiceIds) return []
    return voiceItems.filter(v => item.linkedVoiceIds!.includes(v.id))
  }

  return (
    <div className="overflow-auto h-full" data-testid="matrix-view">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead className="sticky top-0 bg-white z-10 border-b-2 border-gray-200">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[14%]">{col.agenda}</th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[28%] cursor-pointer hover:bg-gray-50" data-col="voice">
              {col.voice}
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[8%] cursor-pointer hover:bg-gray-50" data-col="growth">
              {col.growth}
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[8%] cursor-pointer hover:bg-gray-50" data-col="decision">
              {col.decision}
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[8%] cursor-pointer hover:bg-gray-50" data-col="story">
              {col.story}
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[22%]" data-col="discussion">
              {col.discussion}
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[12%]" data-col="consensus">
              {col.consensus}
            </th>
          </tr>
        </thead>
        <tbody>
          {agendaItems.map((item, index) => {
            const linkedVoices = getLinkedVoice(item)
            const isSelected = selectedIds.includes(item.id)
            const itemNo = index + 1

            return (
              <tr
                key={item.id}
                className={`transition-colors cursor-pointer ${
                  isSelected       ? 'bg-blue-50 hover:bg-blue-100/50' :
                  item.parked      ? 'bg-yellow-50/40 hover:bg-yellow-50/60' :
                  'bg-white hover:bg-blue-50/30'
                }`}
                onClick={() => onSelectItem(item)}
              >
                {/* Agenda 列 */}
                <td className="px-3 py-2 align-top border-b border-gray-100 w-[14%]">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelected(item.id)}
                      onClick={e => e.stopPropagation()}
                      className="mt-0.5 rounded"
                    />
                    <div className="min-w-0 space-y-1">
                      {/* 項番 + タイトル */}
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-bold text-gray-300 tabular-nums shrink-0 w-4 text-right">
                          {itemNo}.
                        </span>
                        <p className="font-medium text-gray-800 text-xs leading-tight line-clamp-2">{item.title}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <StatusBadge status={item.status} />
                        <span className="text-xs text-gray-400">{item.timeBudgetMin}分</span>
                      </div>
                      {/* 保留中バッジ + 詳細情報 */}
                      {item.parked && (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span
                              className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-300 font-medium"
                              title={item.parkedReason ?? '保留中'}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                              保留中
                            </span>
                            {item.parkedCarryOverDate && (
                              <span
                                className="text-xs text-yellow-600"
                                title={`次回持ち越し予定日: ${item.parkedCarryOverDate}`}
                              >
                                → {item.parkedCarryOverDate}
                              </span>
                            )}
                          </div>
                          {item.parkedReason && (
                            <p className="text-xs text-gray-400 leading-tight line-clamp-1" title={item.parkedReason}>
                              {item.parkedReason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Voice 列 */}
                <CellWrapper state={states.voice} className="w-[28%]">
                  <div className="space-y-1.5">
                    {linkedVoices.slice(0, 3).map(v => (
                      <VoiceCard key={v.id} item={v} compact />
                    ))}
                    {linkedVoices.length > 3 && (
                      <button className="text-xs text-blue-500 hover:underline">
                        +{linkedVoices.length - 3} more
                      </button>
                    )}
                    {linkedVoices.length === 0 && states.voice === 'active' && (
                      <p className="text-xs text-gray-300 italic">リンクなし</p>
                    )}
                  </div>
                </CellWrapper>

                {/* Growth 列 — A-4: GHSスコア表示 */}
                <CellWrapper state={states.growth} className="w-[8%]">
                  <GhsScoreBadge agendaId={item.id} />
                </CellWrapper>

                {/* Decision 列 */}
                <CellWrapper state={states.decision} className="w-[8%]">
                  <div className="space-y-1">
                    {item.linkedDecisionIds && item.linkedDecisionIds.length > 0 ? (
                      <>
                        <div className="text-xs text-gray-500">{item.linkedDecisionIds.length} 選択肢</div>
                        <div className="text-xs text-purple-600 font-medium">評価中</div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-300 italic">—</div>
                    )}
                  </div>
                </CellWrapper>

                {/* Story 列 */}
                <CellWrapper state={states.story} className="w-[8%]">  {/* A-4: Growth/Decision と同幅 */}
                  {(() => {
                    const result = scoreAgendaItem(item)
                    const dotColor =
                      result.level === 'high'   ? 'bg-green-500' :
                      result.level === 'medium' ? 'bg-yellow-400' : 'bg-red-400'
                    const labelColor =
                      result.level === 'high'   ? 'text-green-600' :
                      result.level === 'medium' ? 'text-yellow-600' : 'text-red-500'
                    const tooltipText = result.reason +
                      (result.matchedRules.length > 0
                        ? '\n' + result.matchedRules.map(r => `${r.label} (+${r.weight})`).join(', ')
                        : '')
                    return (
                      <div className="flex flex-col items-center gap-1" title={tooltipText}>
                        <div className={`w-3.5 h-3.5 rounded-full ${dotColor}`} />
                        <span className={`text-xs font-semibold ${labelColor}`}>
                          {Math.round(result.score * 100)}%
                        </span>
                        {result.matchedRules.length > 0 && (
                          <p className="text-xs text-gray-400 text-center leading-tight line-clamp-2">
                            {result.matchedRules.map(r => r.label).join('・')}
                          </p>
                        )}
                      </div>
                    )
                  })()}
                </CellWrapper>

                {/* Discussion 列 */}
                <CellWrapper state={states.discussion} className="w-[22%]">
                  <AgendaInput
                    item={item}
                    phase={phase}
                    currentRoleId={currentRoleId}
                    currentRoleName={currentRoleName}
                    readOnly={states.discussion === 'readonly'}
                    onOpenDetail={() => onSelectItem(item)}
                  />
                </CellWrapper>

                {/* Consensus 列 */}
                <ConsensusCell item={item} state={states.consensus} />
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
