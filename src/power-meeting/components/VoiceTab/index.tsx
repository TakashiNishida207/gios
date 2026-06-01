"use client"

import { useState } from 'react'
import { useVoiceStore } from '@pm/stores/voiceStore'
import { VoiceCard } from './VoiceCard'
import { SourceFilterChips } from './SourceFilterChips'
import type { VoiceSource } from '@pm/types/voice'

const ALL_SOURCES: VoiceSource[] = [
  'zendesk', 'intercom', 'jira', 'asana',  // D-1: asana 追加
  'salesforce', 'hubspot',
  'notion', 'slack', 'gong', 'email', 'manual', 'other',
]

/** D-2: インシデントIDを読みやすいラベルに変換 */
function formatIncidentLabel(incidentId: string): string {
  // "sso-001" → "SSO-001", "renewal-02" → "RENEWAL-02"
  return incidentId.toUpperCase()
}

type Props = {
  linkedVoiceIds?: string[]
}

export function VoiceTab({ linkedVoiceIds }: Props) {
  const {
    items,
    filter,
    toggleSource,
    setFilterMode,
    getFilteredItems,
    getCountBySource,
    getGroupedItems,
    sort,
    setSort,
    groupByIncident,
    toggleGroupByIncident,
    updateItemIncidentId,
  } = useVoiceStore()

  const [manualInput, setManualInput] = useState({ open: false, text: '', speaker: '' })

  const filteredItems = linkedVoiceIds
    ? getFilteredItems().filter(item => linkedVoiceIds.includes(item.id))
    : getFilteredItems()

  // D-2: グループ表示用
  const grouped = getGroupedItems()
  const filteredGrouped = linkedVoiceIds
    ? {
        byIncident: grouped.byIncident.map(g => ({
          ...g,
          items: g.items.filter(it => linkedVoiceIds.includes(it.id)),
        })).filter(g => g.items.length > 0),
        standalone: grouped.standalone.filter(it => linkedVoiceIds.includes(it.id)),
      }
    : grouped

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* フィルター + ソート + グループ切り替えヘッダー */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-100 shrink-0 space-y-2">
        <SourceFilterChips
          sources={ALL_SOURCES}
          selectedSources={filter.sources}
          filterMode={filter.mode}
          countBySource={getCountBySource}
          onToggle={toggleSource}
          onModeChange={setFilterMode}
        />

        {/* D-3: ソート切り替え / D-2: グループ切り替え */}
        <div className="flex items-center gap-3">
          {/* ソートラベル */}
          <span className="text-xs text-gray-400 shrink-0">並び順:</span>
          <div className="flex gap-1">
            {([
              { key: 'newest',     label: '最新順' },
              { key: 'importance', label: '重要度順' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={`text-xs px-2.5 py-0.5 rounded-full transition-colors ${
                  sort === key
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* D-2: グループ表示トグル */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-xs text-gray-400">グループ表示:</span>
            <button
              onClick={toggleGroupByIncident}
              className={`text-xs px-2.5 py-0.5 rounded-full transition-colors ${
                groupByIncident
                  ? 'bg-violet-600 text-white font-medium'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={groupByIncident ? 'フラット表示に切り替え' : 'インシデント別グループ表示に切り替え'}
            >
              🔗 インシデント別
            </button>
          </div>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* D-2: グループ表示モード */}
        {groupByIncident ? (
          <>
            {filteredGrouped.byIncident.length === 0 && filteredGrouped.standalone.length === 0 && (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                {items.length === 0 ? 'データを読み込み中...' : 'フィルター条件に一致するデータがありません'}
              </div>
            )}

            {/* インシデントグループ */}
            {filteredGrouped.byIncident.map(group => (
              <IncidentGroup
                key={group.incidentId}
                incidentId={group.incidentId}
                items={group.items}
                onUnlink={(itemId) => updateItemIncidentId(itemId, undefined)}
              />
            ))}

            {/* スタンドアロン（グループ未所属） */}
            {filteredGrouped.standalone.length > 0 && (
              <div>
                {filteredGrouped.byIncident.length > 0 && (
                  <p className="text-xs text-gray-400 mb-2 font-medium">その他</p>
                )}
                <div className="space-y-3">
                  {filteredGrouped.standalone.map(item => (
                    <VoiceCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* フラット表示モード */
          <>
            {filteredItems.length === 0 && (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                {items.length === 0 ? 'データを読み込み中...' : 'フィルター条件に一致するデータがありません'}
              </div>
            )}
            {filteredItems.map(item => (
              <VoiceCard key={item.id} item={item} />
            ))}
          </>
        )}
      </div>

      {/* 手動入力 */}
      <div className="px-4 py-2 border-t border-gray-100 shrink-0">
        <button
          onClick={() => setManualInput(s => ({ ...s, open: !s.open }))}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          + 手動入力で追加
        </button>
        {manualInput.open && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
            <input
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
              placeholder="発言者名"
              value={manualInput.speaker}
              onChange={e => setManualInput(s => ({ ...s, speaker: e.target.value }))}
            />
            <textarea
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 resize-none"
              rows={3}
              placeholder="内容を入力..."
              value={manualInput.text}
              onChange={e => setManualInput(s => ({ ...s, text: e.target.value }))}
            />
            <div className="flex gap-2">
              <button
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={!manualInput.text || !manualInput.speaker}
                onClick={() => {
                  useVoiceStore.getState().addItem({
                    id: `manual-${Date.now()}`,
                    source: 'manual',
                    speaker: { name: manualInput.speaker },
                    ts: new Date().toISOString(),
                    text: manualInput.text,
                  })
                  setManualInput({ open: false, text: '', speaker: '' })
                }}
              >
                追加
              </button>
              <button
                className="text-sm text-gray-500 px-3 py-1 rounded hover:bg-gray-100"
                onClick={() => setManualInput({ open: false, text: '', speaker: '' })}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── D-2: インシデントグループコンポーネント ──────────────────

type IncidentGroupProps = {
  incidentId: string
  items: import('@pm/types/voice').VoiceItem[]
  onUnlink: (itemId: string) => void
}

function IncidentGroup({ incidentId, items, onUnlink }: IncidentGroupProps) {
  const [expanded, setExpanded] = useState(true)

  // ソースバッジ（最大3種）
  const sources = [...new Set(items.map(it => it.source))].slice(0, 3)
  const sourceColors: Record<string, string> = {
    zendesk: 'bg-green-100 text-green-700',
    intercom: 'bg-blue-100 text-blue-700',
    jira: 'bg-indigo-100 text-indigo-700',
    asana: 'bg-pink-100 text-pink-700',
    salesforce: 'bg-sky-100 text-sky-700',
    zendesk2: 'bg-green-100 text-green-700',
  }

  const maxSentiment = items.reduce((acc, it) => {
    const weights: Record<string, number> = { critical: 6, negative: 5, concerned: 4, neutral: 3, positive: 2, advocacy: 1 }
    const w = weights[it.sentiment ?? ''] ?? 0
    return w > acc.w ? { w, sentiment: it.sentiment ?? '' } : acc
  }, { w: 0, sentiment: '' })

  const alertColor = maxSentiment.sentiment === 'critical' ? 'border-red-300 bg-red-50/50'
    : maxSentiment.sentiment === 'negative' ? 'border-orange-200 bg-orange-50/30'
    : 'border-violet-200 bg-violet-50/20'

  return (
    <div className={`rounded-lg border-2 overflow-hidden ${alertColor}`}>
      {/* グループヘッダー */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-black/5 transition-colors"
      >
        <span className="text-xs font-semibold text-violet-700">🔗 インシデント: {formatIncidentLabel(incidentId)}</span>
        <div className="flex gap-1">
          {sources.map(src => (
            <span key={src} className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${sourceColors[src] ?? 'bg-gray-100 text-gray-600'}`}>
              {src}
            </span>
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-auto">{items.length}件</span>
        <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* グループ内アイテム */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-2">
          {items.map(item => (
            <div key={item.id} className="relative">
              <VoiceCard item={item} />
              {/* D-2: グループから除外ボタン */}
              <button
                onClick={() => onUnlink(item.id)}
                className="absolute top-1.5 right-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded px-1 py-0.5 transition-colors"
                title="このインシデントグループから除外する"
              >
                ×除外
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
