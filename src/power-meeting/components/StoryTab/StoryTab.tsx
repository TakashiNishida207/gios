"use client"

import { useState } from 'react'
import { useStoryStore } from '../../stores/storyStore'
import type { StoryAudience, StoryItem, StoryStatus } from '../../types/story'

type SubTab = StoryAudience

const SUBTAB_CONFIG: { id: SubTab; label: string; channels: string }[] = [
  { id: 'customer', label: '顧客向け',  channels: 'Email / Slack Connect / Status Page' },
  { id: 'market',   label: '市場向け',  channels: 'プレスリリース / ブログ / SNS' },
  { id: 'internal', label: '内部向け',  channels: 'All-hands / Slack #announcements / Notion' },
]

const STATUS_CONFIG: Record<StoryStatus, { label: string; color: string }> = {
  draft:     { label: '草案',   color: 'bg-gray-100 text-gray-600' },
  review:    { label: 'レビュー中', color: 'bg-yellow-100 text-yellow-700' },
  approved:  { label: '承認済', color: 'bg-green-100 text-green-700' },
  published: { label: '公開済', color: 'bg-blue-100 text-blue-700' },
}

const AUDIENCE_COLOR: Record<StoryAudience, string> = {
  customer: 'bg-rose-50 border-rose-200',
  market:   'bg-violet-50 border-violet-200',
  internal: 'bg-sky-50 border-sky-200',
}

function StoryCard({ item }: { item: StoryItem }) {
  const [expanded, setExpanded] = useState(false)
  const statusCfg = STATUS_CONFIG[item.status]

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${AUDIENCE_COLOR[item.audience]}`}>
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug min-w-0">{item.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* チャンネル */}
      <p className="text-xs text-gray-500">
        <span className="font-medium">配信チャネル:</span> {item.channel}
      </p>

      {/* ナラティブ */}
      <div>
        <p className={`text-xs text-gray-700 leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
          {item.narrative}
        </p>
        {item.narrative.length > 120 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-500 hover:underline mt-1"
          >
            {expanded ? '収める' : '全文表示'}
          </button>
        )}
      </div>

      {/* Intelligence カード */}
      {item.intelligence && (
        <div className="bg-white/70 rounded-lg p-3 space-y-1.5 border border-white">
          <p className="text-xs font-medium text-gray-600">AI Intelligence</p>
          <p className="text-xs text-gray-700">
            <span className="font-medium">トーン:</span> {item.intelligence.toneRecommendation}
          </p>
          {item.intelligence.riskWarning && (
            <p className="text-xs text-orange-600">
              ⚠️ {item.intelligence.riskWarning}
            </p>
          )}
          <p className="text-xs text-gray-400">
            Confidence: {Math.round(item.intelligence.confidence * 100)}%
          </p>
        </div>
      )}

      {/* フッター */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex gap-2">
          <span>Voice: {item.linkedVoiceIds.length}件</span>
          {item.agendaId && <span>Agenda: {item.agendaId}</span>}
        </div>
        <span>{item.ownerRoleId}</span>
      </div>
    </div>
  )
}

export function StoryTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('customer')
  const { getByAudience } = useStoryStore()

  const items = getByAudience(activeSubTab)

  return (
    <div className="h-full flex flex-col">
      {/* 重要注記バナー */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs text-amber-700 shrink-0">
        <span className="font-medium">【Story タブ】</span>
        コミュニケーション戦略を管理します。Discussion Canvas の Story 列（ミッション整合度スコア）とは別概念です。
      </div>

      {/* サブタブ */}
      <div className="bg-white border-b border-gray-100 px-4 flex gap-1 shrink-0">
        {SUBTAB_CONFIG.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`text-xs px-3 py-2 border-b-2 transition-colors ${
              activeSubTab === tab.id
                ? 'border-rose-500 text-rose-700 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            title={tab.channels}
          >
            {tab.label}
            <span className="ml-1 text-gray-400">
              ({getByAudience(tab.id).length})
            </span>
          </button>
        ))}
      </div>

      {/* Storyカード一覧 */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            このAudience向けのStoryデータはまだありません
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map(item => (
              <StoryCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
