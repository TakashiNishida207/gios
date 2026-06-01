"use client"

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

const DIRECTION_ICON = {
  positive: '▲',
  negative: '▼',
  neutral:  '→',
} as const

const DIRECTION_COLOR = {
  positive: 'text-green-600',
  negative: 'text-red-600',
  neutral:  'text-gray-500',
} as const

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
  const title = useTargetTitle(intel.targetDomain, intel.targetItemId)
  const domain = DOMAIN_CONFIG[intel.targetDomain]
  const level = LEVEL_CONFIG[intel.impactLevel]

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
  const { getByVoiceId } = useImpactStore()
  const allIntelligence = getByVoiceId(voiceId)

  const grouped = {
    growth:   allIntelligence.filter(i => i.targetDomain === 'growth'),
    decision: allIntelligence.filter(i => i.targetDomain === 'decision'),
    story:    allIntelligence.filter(i => i.targetDomain === 'story'),
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[680px] max-w-[95vw] max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-100">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900">Impact Map</h2>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{voiceText}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none shrink-0"
          >
            ×
          </button>
        </div>

        {/* ドメイン別セクション */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(Object.entries(grouped) as [keyof typeof grouped, VoiceImpactIntelligence[]][]).map(
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

          {allIntelligence.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              このVoiceのImpact情報はまだ生成されていません
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="text-xs px-4 py-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            閉じる
          </button>
          <button
            className="text-xs px-4 py-1.5 rounded bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
            title="Impact Intelligenceを再生成（モック）"
          >
            再分析
          </button>
        </div>
      </div>
    </div>
  )
}
