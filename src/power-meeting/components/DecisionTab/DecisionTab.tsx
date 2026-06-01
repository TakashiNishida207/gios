"use client"

import { useState } from 'react'
import { useDecisionStore } from '../../stores/decisionStore'
import { useImpactStore } from '../../stores/impactStore'
import type { DecisionItem, DecisionType } from '../../types/decision'

type SubTab = DecisionType

const SUBTAB_CONFIG: { id: SubTab; label: string; desc: string }[] = [
  { id: 'operational', label: '機能・オペレーション', desc: '技術修復アプローチ、リソース配分、SLA対応' },
  { id: 'strategic',   label: '事業・マーケティング戦略', desc: 'プライシング変更、新規セグメント参入' },
]

const STATUS_CONFIG = {
  evaluating: { label: '評価中',   color: 'bg-blue-100 text-blue-700' },
  decided:    { label: '決定',     color: 'bg-green-100 text-green-700' },
  parked:     { label: '保留',     color: 'bg-yellow-100 text-yellow-700' },
  rejected:   { label: '却下',     color: 'bg-red-100 text-red-700' },
} as const

function StarRating({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <span className="text-xs text-yellow-500">
      {'★'.repeat(Math.round(score))}{'☆'.repeat(max - Math.round(score))}
    </span>
  )
}

function DecisionCard({ item }: { item: DecisionItem }) {
  const [expanded, setExpanded] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAltLabel, setNewAltLabel] = useState('')
  const { getByTarget } = useImpactStore()
  const { addAlternative } = useDecisionStore()
  const impacts = getByTarget('decision', item.id)
  const statusCfg = STATUS_CONFIG[item.status]

  const handleAddAlternative = () => {
    if (!newAltLabel.trim()) return
    const newAlt: import('../../types/decision').Alternative = {
      id:          `alt-${Date.now()}`,
      label:       newAltLabel.trim(),
      recommended: false,
      impactScore: 3,
      riskScore:   3,
      description: newAltLabel.trim(),
    }
    addAlternative(item.id, newAlt)
    setNewAltLabel('')
    setShowAddForm(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* カードヘッダー */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 leading-snug">{item.title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">agenda: {item.agendaId}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>
        </div>

        {/* 採決状況 */}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span>賛 {item.votingResult.agree}</span>
          <span>中 {item.votingResult.neutral}</span>
          <span>反 {item.votingResult.disagree}</span>
          <span className="ml-auto font-medium text-gray-700">
            スコア: {item.votingResult.weightedScore.toFixed(2)}
          </span>
        </div>
      </div>

      {/* 選択肢リスト */}
      <div className="divide-y divide-gray-50">
        {item.alternatives.map((alt, idx) => (
          <div key={alt.id} className="p-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <span className="text-xs font-bold text-gray-400 shrink-0 mt-0.5">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-medium text-gray-800">{alt.label}</span>
                    {alt.recommended && (
                      <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-1.5 rounded font-medium">
                        AI推奨
                      </span>
                    )}
                  </div>
                  {expanded && (
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{alt.description}</p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 space-y-0.5">
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-xs text-gray-400">Impact</span>
                  <StarRating score={alt.impactScore} />
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-xs text-gray-400">Risk</span>
                  <StarRating score={alt.riskScore} />
                </div>
                {alt.eta && (
                  <p className="text-xs text-gray-400">ETA: {alt.eta}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 影響Voice + アクション */}
      <div className="p-3 bg-gray-50 flex items-center justify-between gap-2">
        <div className="text-xs text-gray-400">
          影響Voice: {impacts.length}件
          {impacts.length > 0 && (
            <span className="ml-1">
              ({impacts.filter(i => i.impactDirection === 'positive').length}正 /
               {impacts.filter(i => i.impactDirection === 'negative').length}負)
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-white"
          >
            {expanded ? '収める' : '詳細'}
          </button>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="text-xs px-2 py-1 rounded border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
          >
            {showAddForm ? 'キャンセル' : '+ 選択肢を追加'}
          </button>
        </div>
      </div>

      {/* 選択肢追加フォーム */}
      {showAddForm && (
        <div className="p-3 border-t border-indigo-100 bg-indigo-50/40 space-y-2">
          <p className="text-xs font-medium text-indigo-700">新しい選択肢を追加</p>
          <input
            type="text"
            value={newAltLabel}
            onChange={e => setNewAltLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddAlternative()}
            placeholder="選択肢のラベルを入力（例: C: 段階的対応）"
            className="w-full text-xs px-3 py-2 border border-indigo-200 rounded-lg bg-white focus:outline-none focus:border-indigo-400"
            autoFocus
          />
          <div className="flex gap-1 justify-end">
            <button
              onClick={() => { setShowAddForm(false); setNewAltLabel('') }}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded text-gray-500 hover:bg-white"
            >キャンセル</button>
            <button
              onClick={handleAddAlternative}
              disabled={!newAltLabel.trim()}
              className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >追加</button>
          </div>
        </div>
      )}
    </div>
  )
}

export function DecisionTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('operational')
  const { getByType } = useDecisionStore()

  const items = getByType(activeSubTab)

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
                ? 'border-indigo-500 text-indigo-700 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            title={tab.desc}
          >
            {tab.id === 'operational' ? '① ' : '② '}{tab.label}
            <span className="ml-1 text-gray-400">({getByType(tab.id).length})</span>
          </button>
        ))}
      </div>

      {/* DecisionCard一覧 */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            このカテゴリのDecisionデータはまだありません
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl">
            {items.map(item => (
              <DecisionCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
