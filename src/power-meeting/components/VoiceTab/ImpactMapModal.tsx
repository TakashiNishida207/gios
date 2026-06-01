"use client"

import { useState } from 'react'
import { useImpactStore } from '../../stores/impactStore'
import { useGrowthStore } from '../../stores/growthStore'
import { useDecisionStore } from '../../stores/decisionStore'
import { useStoryStore } from '../../stores/storyStore'
import type { VoiceImpactIntelligence } from '../../types/impact'

type Props = {
  voiceId: string
  voiceText: string
  onClose: () => void
}

const DOMAIN_CONFIG = {
  growth:   { label: 'Growth',   color: 'bg-emerald-50 border-emerald-200 text-emerald-700',  dotColor: 'bg-emerald-500', icon: '📈' },
  decision: { label: 'Decision', color: 'bg-indigo-50 border-indigo-200 text-indigo-700',    dotColor: 'bg-indigo-500',  icon: '⚖️' },
  story:    { label: 'Story',    color: 'bg-rose-50 border-rose-200 text-rose-700',           dotColor: 'bg-rose-500',    icon: '📣' },
} as const

const LEVEL_CONFIG = {
  high:   { label: 'High',   color: 'bg-red-100 text-red-700 border-red-200' },
  medium: { label: 'Medium', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  low:    { label: 'Low',    color: 'bg-gray-100 text-gray-600 border-gray-200' },
} as const

const DIRECTION_ICON   = { positive: '▲', negative: '▼', neutral:  '→' } as const
const DIRECTION_COLOR  = { positive: 'text-green-600', negative: 'text-red-600', neutral: 'text-gray-500' } as const

function useTargetTitle(domain: VoiceImpactIntelligence['targetDomain'], targetItemId: string) {
  const { items: ghsItems }      = useGrowthStore()
  const { items: decisionItems } = useDecisionStore()
  const { items: storyItems }    = useStoryStore()

  if (domain === 'growth')   return ghsItems.find(i => i.id === targetItemId)?.title ?? targetItemId
  if (domain === 'decision') return decisionItems.find(i => i.id === targetItemId)?.title ?? targetItemId
  if (domain === 'story')    return storyItems.find(i => i.id === targetItemId)?.title ?? targetItemId
  return targetItemId
}

function ImpactCard({ intel }: { intel: VoiceImpactIntelligence }) {
  const title  = useTargetTitle(intel.targetDomain, intel.targetItemId)
  const domain = DOMAIN_CONFIG[intel.targetDomain]
  const level  = LEVEL_CONFIG[intel.impactLevel]

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${domain.color}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`text-sm font-bold ${DIRECTION_COLOR[intel.impactDirection]}`}>
            {DIRECTION_ICON[intel.impactDirection]}
          </span>
          <span className="text-xs font-medium truncate">{title}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${level.color}`}>
          {level.label}
        </span>
      </div>
      <p className="text-xs text-gray-700 leading-relaxed">{intel.reasoning}</p>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Confidence: {Math.round(intel.confidence * 100)}%</span>
        <span className="capitalize">{intel.generatedBy}</span>
      </div>
    </div>
  )
}

export function ImpactMapModal({ voiceId, voiceText, onClose }: Props) {
  const { getByVoiceId, addItem, items: allItems } = useImpactStore()
  const { items: ghsItems }      = useGrowthStore()
  const { items: decisionItems } = useDecisionStore()
  const { items: storyItems }    = useStoryStore()

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const allIntelligence = getByVoiceId(voiceId)

  const grouped = {
    growth:   allIntelligence.filter(i => i.targetDomain === 'growth'),
    decision: allIntelligence.filter(i => i.targetDomain === 'decision'),
    story:    allIntelligence.filter(i => i.targetDomain === 'story'),
  }

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/impact-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId,
          voiceText,
          ghsItems:      ghsItems.map(g => ({ id: g.id, title: g.title, category: g.category })),
          decisionItems: decisionItems.map(d => ({ id: d.id, title: d.title })),
          storyItems:    storyItems.map(s => ({ id: s.id, title: s.title, audience: s.audience })),
        }),
      })

      const data = await res.json()
      if (!data.ok) throw new Error(data.error)

      // 既存の分析結果を削除して最新のみ保持
      const existingIds = allIntelligence.map(i => i.id)
      // impactStore に直接追加（既存は残す→重複防止のため同voiceIdを先に削除）
      useImpactStore.setState(s => ({
        items: [
          ...s.items.filter(i => i.voiceId !== voiceId),
          ...data.items,
        ],
      }))
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="bg-white"
        style={{ borderRadius: 16, boxShadow: '0 25px 50px rgba(0,0,0,0.25)', width: 680, maxWidth: '95vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-100">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900">Impact Map</h2>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{voiceText}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none shrink-0">×</button>
        </div>

        {/* ドメイン別セクション */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              ⚠️ 分析エラー: {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12 gap-3">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">AI が影響を分析中…</span>
            </div>
          )}

          {!loading && (Object.entries(grouped) as [keyof typeof grouped, VoiceImpactIntelligence[]][]).map(
            ([domain, items]) => {
              const cfg = DOMAIN_CONFIG[domain]
              return (
                <section key={domain}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                    <span className="text-xs font-semibold text-gray-700">
                      {cfg.icon} {cfg.label} への影響（{items.length}件）
                    </span>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs text-gray-400 pl-4">なし</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map(intel => (
                        <ImpactCard key={intel.id} intel={intel} />
                      ))}
                    </div>
                  )}
                </section>
              )
            }
          )}

          {!loading && allIntelligence.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <p className="text-gray-400 text-sm">このVoiceのImpact情報はまだ生成されていません</p>
              <p className="text-gray-400 text-xs">「再分析」ボタンを押すとAIが影響を分析します</p>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between gap-2 p-4 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {allIntelligence.length > 0 && `最終分析: ${new Date(allIntelligence[0].generatedAt).toLocaleString('ja-JP')}`}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs px-4 py-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              閉じる
            </button>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className={`text-xs px-4 py-1.5 rounded font-medium transition-colors ${
                loading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? '分析中…' : '✦ AI 再分析'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
