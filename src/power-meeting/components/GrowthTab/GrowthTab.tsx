"use client"

import { useState } from 'react'
import { useGrowthStore } from '../../stores/growthStore'
import { useImpactStore } from '../../stores/impactStore'
import type { GHSItem, GrowthCategory } from '../../types/growth'

type SubTab = 'all' | GrowthCategory

const SUBTAB_CONFIG: { id: SubTab; label: string }[] = [
  { id: 'all',         label: '全カテゴリ' },
  { id: 'acquisition', label: 'アクイジション' },
  { id: 'retention',   label: 'リテンション' },
  { id: 'expansion',   label: 'エクスパンション' },
  { id: 'churn',       label: 'チャーン' },
]

const CATEGORY_LABEL: Record<GrowthCategory, string> = {
  acquisition: 'アクイジション',
  retention:   'リテンション',
  expansion:   'エクスパンション',
  churn:       'チャーン',
}

const CATEGORY_COLOR: Record<GrowthCategory, string> = {
  acquisition: 'bg-blue-100 text-blue-700',
  retention:   'bg-green-100 text-green-700',
  expansion:   'bg-purple-100 text-purple-700',
  churn:       'bg-red-100 text-red-700',
}

/** GHSスコア帯に応じた色 */
function scoreColor(score: number): string {
  if (score >= 70) return 'text-green-600'
  if (score >= 40) return 'text-orange-500'
  return 'text-red-600'
}

function scoreBg(score: number): string {
  if (score >= 70) return 'bg-green-50 border-green-200'
  if (score >= 40) return 'bg-orange-50 border-orange-200'
  return 'bg-red-50 border-red-200'
}

const TREND_ICON = { up: '↑', down: '↓', flat: '→' } as const
const TREND_COLOR = { up: 'text-green-600', down: 'text-red-600', flat: 'text-gray-400' } as const

function GHSCard({ item }: { item: GHSItem }) {
  const { getByTarget } = useImpactStore()
  const impacts = getByTarget('growth', item.id)
  const diff = item.score - item.previousScore
  const diffStr = diff > 0 ? `+${diff}` : String(diff)

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${scoreBg(item.score)}`}>
      {/* ヘッダー行 */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[item.category]}`}>
              {CATEGORY_LABEL[item.category]}
            </span>
            {item.scope === 'agenda' && (
              <span className="text-xs text-gray-400">アジェンダ紐付き</span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mt-1">{item.title}</h3>
        </div>
        {/* スコア表示 */}
        <div className="text-right shrink-0">
          <div className={`text-2xl font-bold tabular-nums ${scoreColor(item.score)}`}>
            {item.score}
          </div>
          <div className="flex items-center justify-end gap-1 text-xs">
            <span className={TREND_COLOR[item.trend]}>{TREND_ICON[item.trend]}</span>
            <span className="text-gray-400">{diffStr} 前回比</span>
          </div>
        </div>
      </div>

      {/* スコアバー */}
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${
            item.score >= 70 ? 'bg-green-500' : item.score >= 40 ? 'bg-orange-400' : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(item.score, 100)}%` }}
        />
      </div>

      {/* 影響Voice */}
      {impacts.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500">影響Voice ({impacts.length}件)</p>
          {impacts.slice(0, 2).map(intel => (
            <div key={intel.id} className="flex items-start gap-1.5 text-xs text-gray-600">
              <span className={
                intel.impactDirection === 'positive' ? 'text-green-600' :
                intel.impactDirection === 'negative' ? 'text-red-600' : 'text-gray-400'
              }>
                {intel.impactDirection === 'positive' ? '▲' : intel.impactDirection === 'negative' ? '▼' : '→'}
              </span>
              <span className="line-clamp-1">{intel.reasoning}</span>
              <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded border font-medium ${
                intel.impactLevel === 'high' ? 'bg-red-50 text-red-600 border-red-200' :
                intel.impactLevel === 'medium' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                'bg-gray-50 text-gray-500 border-gray-200'
              }`}>
                {intel.impactLevel === 'high' ? 'High' : intel.impactLevel === 'medium' ? 'Med' : 'Low'}
              </span>
            </div>
          ))}
          {impacts.length > 2 && (
            <p className="text-xs text-gray-400">+{impacts.length - 2}件</p>
          )}
        </div>
      )}

      {/* スコア変化の根拠（commentsの最初の1件を展開表示） */}
      {item.comments.length > 0 && (
        <div className="bg-white/60 rounded-lg p-2.5 border border-white space-y-1">
          <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">スコア根拠</p>
          {item.comments[0].text.split("\n").filter(Boolean).map((line, i) => (
            <p key={i} className="text-[10px] text-gray-600 leading-snug">{line}</p>
          ))}
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-gray-400">{item.ownerRoleId}</span>
        <div className="flex gap-1">
          <button className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100">
            議論を起こす
          </button>
          <button className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50">
            改善提案
          </button>
        </div>
      </div>
    </div>
  )
}

export function GrowthTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('all')
  const { items } = useGrowthStore()

  const filtered = activeSubTab === 'all'
    ? items
    : items.filter(i => i.category === activeSubTab)

  return (
    <div className="h-full flex flex-col">
      {/* サブタブ */}
      <div className="bg-white border-b border-gray-100 px-4 flex gap-1 shrink-0">
        {SUBTAB_CONFIG.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`text-xs px-3 py-2 border-b-2 transition-colors ${
              activeSubTab === tab.id
                ? 'border-emerald-500 text-emerald-700 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.id !== 'all' && (
              <span className="ml-1 text-gray-400">
                ({items.filter(i => i.category === tab.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* GHSカード一覧 */}
      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            このカテゴリのGHSデータはまだありません
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(item => (
              <GHSCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
