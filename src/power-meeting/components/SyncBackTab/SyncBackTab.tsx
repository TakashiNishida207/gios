"use client"

/**
 * H-1: SYNC_BACK タブ
 * ミーティング成果を外部システムへ同期する。
 * ※ 実API連携なしのモック実装（H-1 spec に基づく）
 */

import { useState, useMemo } from 'react'
import { useDecisionStore } from '../../stores/decisionStore'
import { useStoryStore } from '../../stores/storyStore'
import { useAgendaStore } from '../../stores/agendaStore'

// ─── 外部システム定義 ───────────────────────────────────────

export type SyncSystem = 'salesforce' | 'zendesk' | 'intercom' | 'jira' | 'slack'
export type SyncStatus = 'pending' | 'syncing' | 'done' | 'error'

export interface SyncTarget {
  id: string
  system: SyncSystem
  title: string
  description: string
  /** 同期先レコードの種類 */
  recordType: string
}

const SYSTEM_META: Record<SyncSystem, { label: string; icon: string; color: string; bgColor: string }> = {
  salesforce: { label: 'Salesforce', icon: '☁️', color: 'text-blue-600',  bgColor: 'bg-blue-50' },
  zendesk:    { label: 'Zendesk',    icon: '🎫', color: 'text-green-600', bgColor: 'bg-green-50' },
  intercom:   { label: 'Intercom',   icon: '💌', color: 'text-purple-600',bgColor: 'bg-purple-50' },
  jira:       { label: 'Jira/Asana', icon: '📋', color: 'text-indigo-600',bgColor: 'bg-indigo-50' },
  slack:      { label: 'Slack',      icon: '💬', color: 'text-yellow-600',bgColor: 'bg-yellow-50' },
}

/** モック同期遅延 ms */
const SYNC_DELAY: Record<SyncSystem, number> = {
  salesforce: 900,
  zendesk:    600,
  intercom:   500,
  jira:       700,
  slack:      300,
}

// ─── コンポーネント ────────────────────────────────────────

export function SyncBackTab() {
  const { items: decisions }    = useDecisionStore()
  const { items: stories }      = useStoryStore()
  const { items: agendaItems }  = useAgendaStore()

  // ミーティング成果を集計
  const decidedDecisions  = decisions.filter(d => d.status === 'decided')
  const approvedStories   = stories.filter(s => s.status === 'approved' || s.status === 'published')
  const alignedAgendas    = agendaItems.filter(a => ['aligned','decided','awaiting_exec'].includes(a.status) && !a.parked)
  const parkedAgendas     = agendaItems.filter(a => a.parked)

  // 同期ターゲットをストアデータから動的生成
  const syncTargets: SyncTarget[] = useMemo(() => {
    const targets: SyncTarget[] = []

    // Salesforce: 決定事項をOpportunityに反映
    decidedDecisions.forEach(d => {
      targets.push({
        id: `sf-${d.id}`,
        system: 'salesforce',
        title: `Opportunity更新: ${d.title}`,
        description: `決定内容をSalesforce CRMのOpportunityフィールドに反映し、Next Stepを更新する`,
        recordType: 'Opportunity',
      })
    })
    // Salesforce: アライン済みアジェンダをCase更新
    alignedAgendas.slice(0, 2).forEach(a => {
      targets.push({
        id: `sf-case-${a.id}`,
        system: 'salesforce',
        title: `Case更新: ${a.title.slice(0, 30)}`,
        description: `Case ステータスを「解決済」に更新し、対応内容をコメントに記録する`,
        recordType: 'Case',
      })
    })

    // Zendesk: 対応完了チケットのクローズ
    alignedAgendas.forEach(a => {
      targets.push({
        id: `zd-${a.id}`,
        system: 'zendesk',
        title: `チケットクローズ: ${a.title.slice(0, 30)}`,
        description: `関連Zendeskチケットをクローズし、解決サマリーを内部メモに追記する`,
        recordType: 'Ticket',
      })
    })

    // Intercom: 承認済みStoryをメッセージ配信
    approvedStories.forEach(s => {
      targets.push({
        id: `ic-${s.id}`,
        system: 'intercom',
        title: `メッセージ配信: ${s.title}`,
        description: `承認済みStory「${s.title}」を ${s.channel} 経由で対象顧客に配信する`,
        recordType: 'Message',
      })
    })

    // Jira: 保留アジェンダをチケット作成
    parkedAgendas.forEach(a => {
      targets.push({
        id: `jira-${a.id}`,
        system: 'jira',
        title: `チケット作成: ${a.title.slice(0, 30)}`,
        description: `保留アジェンダ「${a.title.slice(0, 25)}...」を次回スプリントのJiraチケットとして登録する`,
        recordType: 'Issue',
      })
    })
    // Jira: 決定事項のアクションアイテム
    decidedDecisions.forEach(d => {
      targets.push({
        id: `jira-action-${d.id}`,
        system: 'jira',
        title: `アクション登録: ${d.title}`,
        description: `決定内容に基づくフォローアップタスクをJiraに登録し、担当者・期日を設定する`,
        recordType: 'Task',
      })
    })

    // Slack: ミーティングサマリーを投稿（常に1件）
    targets.push({
      id: 'slack-summary',
      system: 'slack',
      title: 'ミーティングサマリー投稿',
      description: `#general と #cs-alerts に会議結果（決定: ${decidedDecisions.length}件、Story: ${approvedStories.length}件）をサマリー投稿する`,
      recordType: 'Message',
    })

    return targets
  }, [decidedDecisions, approvedStories, alignedAgendas, parkedAgendas])

  const [statusMap, setStatusMap] = useState<Record<string, SyncStatus>>({})
  const [isBulkRunning, setIsBulkRunning] = useState(false)

  const getStatus = (id: string): SyncStatus => statusMap[id] ?? 'pending'

  const syncOne = async (target: SyncTarget) => {
    setStatusMap(prev => ({ ...prev, [target.id]: 'syncing' }))
    await new Promise(res => setTimeout(res, SYNC_DELAY[target.system] + Math.random() * 200))
    // 5%の確率でエラーシミュレーション
    const isError = Math.random() < 0.05
    setStatusMap(prev => ({ ...prev, [target.id]: isError ? 'error' : 'done' }))
  }

  const syncAll = async () => {
    setIsBulkRunning(true)
    // システムごとに順次、ターゲット内は並列
    const pending = syncTargets.filter(t => getStatus(t.id) !== 'done')
    const bySystem = pending.reduce<Partial<Record<SyncSystem, SyncTarget[]>>>((acc, t) => {
      acc[t.system] = [...(acc[t.system] ?? []), t]; return acc
    }, {})
    for (const system of Object.keys(SYSTEM_META) as SyncSystem[]) {
      const targets = bySystem[system] ?? []
      if (targets.length === 0) continue
      await Promise.all(targets.map(t => syncOne(t)))
    }
    setIsBulkRunning(false)
  }

  const doneCount  = syncTargets.filter(t => getStatus(t.id) === 'done').length
  const errorCount = syncTargets.filter(t => getStatus(t.id) === 'error').length
  const allDone    = doneCount + errorCount === syncTargets.length && syncTargets.length > 0
  const progress   = syncTargets.length > 0 ? Math.round((doneCount / syncTargets.length) * 100) : 0

  // システムごとにグループ化して表示
  const groupedTargets = (Object.keys(SYSTEM_META) as SyncSystem[]).map(system => ({
    system,
    targets: syncTargets.filter(t => t.system === system),
  })).filter(g => g.targets.length > 0)

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 space-y-5">

        {/* ヘッダー */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-800">🔄 SYNC_BACK — 外部システム同期</h2>
            <p className="text-xs text-gray-400 mt-0.5">ミーティング成果を各外部システムへ反映します</p>
          </div>
          <button
            onClick={syncAll}
            disabled={isBulkRunning || allDone}
            className={`text-xs px-3 py-2 rounded-lg font-semibold transition-colors shrink-0 ${
              allDone
                ? 'bg-green-100 text-green-600 cursor-default'
                : isBulkRunning
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {allDone ? '✓ 全件完了' : isBulkRunning ? '同期中...' : `全て同期 (${syncTargets.length})`}
          </button>
        </div>

        {/* ミーティング成果サマリー */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '決定事項', value: decidedDecisions.length, icon: '✅', color: 'text-green-600' },
            { label: '承認Story', value: approvedStories.length,  icon: '📢', color: 'text-blue-600' },
            { label: '合意アジェンダ', value: alignedAgendas.length, icon: '🤝', color: 'text-indigo-600' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
              <p className="text-xl">{icon}</p>
              <p className={`text-lg font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* プログレスバー */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">同期進捗</span>
            <span className="text-gray-700 font-semibold">{doneCount} / {syncTargets.length} 完了</span>
          </div>
          <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${allDone ? 'bg-green-500' : 'bg-indigo-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {errorCount > 0 && (
            <p className="text-[10px] text-red-500">⚠️ {errorCount}件でエラーが発生しました。再実行してください。</p>
          )}
        </div>

        {/* 完了メッセージ */}
        {allDone && errorCount === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-1">
            <p className="text-2xl">🎉</p>
            <p className="text-sm font-bold text-green-700">全システムへの同期が完了しました</p>
            <p className="text-xs text-green-600">ミーティングの成果がすべての外部システムに反映されました。</p>
          </div>
        )}

        {/* システム別同期リスト */}
        {groupedTargets.map(({ system, targets }) => {
          const meta = SYSTEM_META[system]
          const systemDone = targets.filter(t => getStatus(t.id) === 'done').length
          return (
            <div key={system} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* システムヘッダー */}
              <div className={`flex items-center justify-between px-4 py-2.5 ${meta.bgColor}`}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{meta.icon}</span>
                  <span className={`text-xs font-bold ${meta.color}`}>{meta.label}</span>
                  <span className="text-[10px] text-gray-400">{systemDone}/{targets.length}</span>
                </div>
                <button
                  onClick={() => Promise.all(targets.filter(t => getStatus(t.id) !== 'done').map(t => syncOne(t)))}
                  disabled={isBulkRunning || targets.every(t => getStatus(t.id) === 'done')}
                  className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${
                    targets.every(t => getStatus(t.id) === 'done')
                      ? 'text-green-600'
                      : `${meta.color} border border-current hover:opacity-70`
                  }`}
                >
                  {targets.every(t => getStatus(t.id) === 'done') ? '✓ 完了' : '一括同期'}
                </button>
              </div>

              {/* ターゲットリスト */}
              <div className="divide-y divide-gray-50">
                {targets.map(target => {
                  const status = getStatus(target.id)
                  return (
                    <div key={target.id} className="flex items-start gap-3 px-4 py-3">
                      {/* ステータスアイコン */}
                      <div className="shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center">
                        {status === 'done'    && <span className="text-green-500 text-sm">✓</span>}
                        {status === 'error'   && <span className="text-red-500 text-sm">✗</span>}
                        {status === 'syncing' && (
                          <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        )}
                        {status === 'pending' && <span className="text-gray-300 text-sm">○</span>}
                      </div>

                      {/* テキスト */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold leading-snug ${status === 'done' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                          {target.title}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{target.description}</p>
                        <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                          {target.recordType}
                        </span>
                      </div>

                      {/* 実行ボタン */}
                      <button
                        onClick={() => syncOne(target)}
                        disabled={status === 'syncing' || status === 'done'}
                        className={`shrink-0 text-[10px] px-2.5 py-1 rounded-lg font-medium transition-colors ${
                          status === 'done'
                            ? 'bg-green-50 text-green-500 cursor-default'
                            : status === 'error'
                            ? 'bg-red-50 text-red-500 hover:bg-red-100'
                            : status === 'syncing'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : `${meta.bgColor} ${meta.color} hover:opacity-80`
                        }`}
                      >
                        {status === 'done'    ? '完了'   :
                         status === 'error'   ? '再試行' :
                         status === 'syncing' ? '...'    : '同期'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {syncTargets.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center space-y-2">
            <p className="text-2xl">📭</p>
            <p className="text-sm text-gray-400">同期対象データがありません</p>
            <p className="text-xs text-gray-300">Decision・Story・Agendaデータが揃うと同期ターゲットが表示されます</p>
          </div>
        )}

      </div>
    </div>
  )
}
