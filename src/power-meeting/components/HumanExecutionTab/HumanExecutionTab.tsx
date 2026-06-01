"use client"

/**
 * Human Execution タブ（HUMAN_EXEC フェーズ）
 * 人が実行するアクションタスクの一覧・進捗管理
 * GDIOS連携モード時はストアにセットされた顧客データを使用する
 */

import { useExecutionStore } from '../../stores/executionStore'
import type { HumanTaskStatus } from '../../stores/executionStore'

const STATUS_LABELS: Record<HumanTaskStatus, string> = {
  pending:     '未着手',
  in_progress: '実行中',
  done:        '完了',
}

const PRIORITY_COLORS = {
  high:   'bg-red-100 text-red-600',
  medium: 'bg-amber-100 text-amber-600',
  low:    'bg-gray-100 text-gray-500',
}

const CATEGORY_ICONS = {
  customer:  '🤝',
  technical: '⚙️',
  internal:  '📄',
}

import { useState } from 'react'

export function HumanExecutionTab() {
  const { humanTasks, updateHumanTaskStatus } = useExecutionStore()
  const [filter, setFilter] = useState<HumanTaskStatus | 'all'>('all')

  const toggleStatus = (id: string) => {
    const task = humanTasks.find((t) => t.id === id)
    if (!task) return
    const next: HumanTaskStatus =
      task.status === 'pending'     ? 'in_progress' :
      task.status === 'in_progress' ? 'done'         : 'pending'
    updateHumanTaskStatus(id, next)
  }

  const filtered  = filter === 'all' ? humanTasks : humanTasks.filter((t) => t.status === filter)
  const doneCount = humanTasks.filter((t) => t.status === 'done').length

  if (humanTasks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">タスクがありません。GDIOS連携モードで同期後に表示されます。</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* ヘッダー */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-800">👤 人的実行タスク</h2>
            <p className="text-xs text-gray-400 mt-0.5">人が担当するアクションの進捗を管理します</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-700">
              {doneCount}<span className="text-xs font-normal text-gray-400"> / {humanTasks.length}</span>
            </p>
            <p className="text-[10px] text-gray-400">完了</p>
          </div>
        </div>

        {/* プログレスバー */}
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 bg-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${humanTasks.length > 0 ? (doneCount / humanTasks.length) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-600 shrink-0">
              {humanTasks.length > 0 ? Math.round((doneCount / humanTasks.length) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* フィルター */}
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'pending', 'in_progress', 'done'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                filter === s
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s === 'all'
                ? `全て (${humanTasks.length})`
                : `${STATUS_LABELS[s]} (${humanTasks.filter((t) => t.status === s).length})`}
            </button>
          ))}
        </div>

        {/* タスクリスト */}
        <div className="space-y-2">
          {filtered.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-xl border p-3.5 space-y-2 transition-opacity ${
                task.status === 'done' ? 'opacity-60 border-gray-100' : 'border-gray-100'
              }`}
            >
              <div className="flex items-start gap-2">
                <button
                  onClick={() => toggleStatus(task.id)}
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    task.status === 'done'        ? 'bg-green-500 border-green-500 text-white' :
                    task.status === 'in_progress' ? 'bg-orange-400 border-orange-400 text-white' :
                    'border-gray-300 hover:border-orange-400'
                  }`}
                  title="ステータスを切り替え"
                >
                  {task.status === 'done'        && <span className="text-[10px]">✓</span>}
                  {task.status === 'in_progress' && <span className="text-[8px]">▶</span>}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>{CATEGORY_ICONS[task.category]}</span>
                    <p className={`text-xs font-semibold ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {task.title}
                    </p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{task.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pl-7 flex-wrap">
                <span className="text-[10px] text-gray-400">👤 {task.assignee}（{task.role}）</span>
                {task.dueDate && (
                  <span className={`text-[10px] ${
                    task.status !== 'done' && task.dueDate < new Date().toISOString().slice(0, 10)
                      ? 'text-red-500 font-medium' : 'text-gray-400'
                  }`}>
                    📅 期限: {task.dueDate}
                  </span>
                )}
                {task.completedAt && (
                  <span className="text-[10px] text-green-600">
                    ✓ 完了: {new Date(task.completedAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1.5">
                  {task.status !== 'done' && (
                    <button
                      onClick={() => updateHumanTaskStatus(task.id, 'done')}
                      className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 font-medium"
                    >
                      ✓ 完了にする
                    </button>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    task.status === 'done'        ? 'bg-green-50 text-green-600'   :
                    task.status === 'in_progress' ? 'bg-orange-50 text-orange-600' :
                    'bg-gray-50 text-gray-400'
                  }`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-xs text-center text-gray-400 py-8">該当タスクがありません</p>
        )}

      </div>
    </div>
  )
}
