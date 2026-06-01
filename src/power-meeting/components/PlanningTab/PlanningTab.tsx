"use client"

/**
 * C-4: Planning タブ（旧 EXECUTION フェーズの計画調整ビュー）
 * Story承認状況・決定事項サマリー・次フェーズタスク振り分けを表示
 */

import { useStoryStore } from '../../stores/storyStore'
import { useDecisionStore } from '../../stores/decisionStore'
import { useAgendaStore } from '../../stores/agendaStore'

export function PlanningTab() {
  const { items: stories } = useStoryStore()
  const { items: decisions } = useDecisionStore()
  const { items: agendaItems } = useAgendaStore()

  const approvedStories  = stories.filter(s => s.status === 'approved' || s.status === 'published')
  const draftStories     = stories.filter(s => s.status === 'draft')
  const decidedAgendas   = agendaItems.filter(a => ['aligned', 'decided', 'awaiting_exec'].includes(a.status))

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* ヘッダー */}
        <div>
          <h2 className="text-sm font-bold text-gray-800">📋 実行計画</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            決定事項を実行に移す準備を確認します。次は <strong>人的実行（HUMAN_EXEC）</strong> フェーズです。
          </p>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{decidedAgendas.length}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">合意済アジェンダ</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{decisions.length}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">意思決定</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className="text-2xl font-bold text-indigo-600">{approvedStories.length}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">承認済 Story</p>
          </div>
        </div>

        {/* Story 承認状況 */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-700">📨 コミュニケーション計画（Story）</h3>
            <span className="text-[10px] text-gray-400">{stories.length} 件</span>
          </div>

          {stories.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Story が登録されていません</p>
          ) : (
            <div className="space-y-2">
              {stories.map(story => (
                <div key={story.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                    story.status === 'published' ? 'bg-green-100 text-green-700' :
                    story.status === 'approved'  ? 'bg-blue-100 text-blue-700'  :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {story.status === 'published' ? '公開済' :
                     story.status === 'approved'  ? '承認済' : '草案'}
                  </span>
                  <p className="text-xs text-gray-700 min-w-0 truncate flex-1">{story.title}</p>
                  <span className="text-[10px] text-gray-400 shrink-0">{story.audience}</span>
                </div>
              ))}
            </div>
          )}

          {draftStories.length > 0 && (
            <div className="bg-amber-50 rounded-lg px-3 py-2">
              <p className="text-xs text-amber-700">
                ⚠️ 未承認の草案が {draftStories.length} 件あります。承認後に次フェーズへ進んでください。
              </p>
            </div>
          )}
        </div>

        {/* 次フェーズ予告 */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <h3 className="text-xs font-bold text-gray-700">🔜 次フェーズのタスク予告</h3>
          <div className="space-y-2">
            <div className="flex items-start gap-3 bg-orange-50 rounded-lg px-3 py-2.5">
              <span className="text-sm mt-0.5">👤</span>
              <div>
                <p className="text-xs font-semibold text-orange-700">HUMAN_EXEC — 人的実行</p>
                <p className="text-[11px] text-orange-600 mt-0.5">
                  人が担当するアクション（顧客対応・設定修正・承認フロー等）を実行します
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-purple-50 rounded-lg px-3 py-2.5">
              <span className="text-sm mt-0.5">🤖</span>
              <div>
                <p className="text-xs font-semibold text-purple-700">AI_EXEC — AI実行</p>
                <p className="text-[11px] text-purple-600 mt-0.5">
                  CRM更新・メール配信・Slack通知など AI が自動実行できるタスクを処理します
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
