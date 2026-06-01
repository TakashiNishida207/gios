"use client"

import type { AgendaItem, Phase } from '../../types/agenda'
import type { VoiceItem } from '../../types/voice'
import { AgendaInput } from './AgendaInput'
import { VoiceCard } from '../../components/VoiceTab/VoiceCard'
import { VoiceTab } from '../../components/VoiceTab'
import { useAgendaStore } from '../../stores/agendaStore'

type Props = {
  item: AgendaItem
  allVoiceItems: VoiceItem[]
  phase: Phase
  currentRoleId: string
  currentRoleName: string
  onClose: () => void
}

export function DetailPanel({ item, allVoiceItems, phase, currentRoleId, currentRoleName, onClose }: Props) {
  const { getCrossLinkedEntries } = useAgendaStore()
  const crossLinkedEntries = getCrossLinkedEntries(item.id)
  const phaseLabel: Record<Phase, string> = {
    IDLE:           '待機中',
    KNOWLEDGE_SYNC: '情報同期',
    PHASE1:         'Phase 1',
    PHASE2:         'Phase 2',
    PHASE3:         'Phase 3',
    PLANNING:       '実行計画',    // C-4
    HUMAN_EXEC:     '人的実行',    // C-4
    AI_EXEC:        'AI実行',      // C-4
    SYNC_BACK:      '同期完了',
  }

  return (
    <div
      className="fixed inset-y-0 right-0 w-[480px] max-w-full bg-white shadow-2xl border-l border-gray-200 flex flex-col z-30"
      data-testid="detail-panel"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-gray-900 line-clamp-2">{item.title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{phaseLabel[phase]} · {item.timeBudgetMin}分</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {/* Discussion Log */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">ディスカッションログ</h3>
          <div className="space-y-2">
            {item.discussionLog.length === 0 && (
              <p className="text-sm text-gray-300 italic">発言なし</p>
            )}
            {item.discussionLog.map(entry => (
              <div key={entry.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700">{entry.speaker}</span>
                  <span className="text-xs text-gray-400">{new Date(entry.ts).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-sm text-gray-700">{entry.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Input */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">インプット</h3>
          <AgendaInput
            item={item}
            phase={phase}
            currentRoleId={currentRoleId}
            currentRoleName={currentRoleName}
          />
        </section>

        {/* Positions */}
        {item.positions.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">ポジション</h3>
            <div className="space-y-1.5">
              {item.positions.map(p => (
                <div key={p.roleId} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 min-w-0 flex-1">{p.roleId}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.stance === 'agree' ? 'bg-green-100 text-green-700' :
                    p.stance === 'disagree' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {p.stance === 'agree' ? '賛成' : p.stance === 'disagree' ? '反対' : '中立'}
                  </span>
                  {p.note && <span className="text-xs text-gray-400 truncate">{p.note}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Linked Voice Items */}
        {item.linkedVoiceIds && item.linkedVoiceIds.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">関連 Voice</h3>
            <div className="space-y-2">
              {allVoiceItems
                .filter(v => item.linkedVoiceIds!.includes(v.id))
                .map(v => <VoiceCard key={v.id} item={v} />)
              }
            </div>
          </section>
        )}
        {/* E-1: クロスアジェンダ発言 */}
        {crossLinkedEntries.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <span>🔗</span> クロスアジェンダ発言 ({crossLinkedEntries.length})
            </h3>
            <div className="space-y-2">
              {crossLinkedEntries.map(({ entry, sourceAgenda }) => (
                <div key={entry.id} className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-blue-600 truncate max-w-[60%]">
                      📋 {sourceAgenda.title}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {new Date(entry.ts).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    <span className="font-medium text-gray-700">{entry.speaker}</span> より
                  </p>
                  <p className="text-sm text-gray-700">{entry.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
