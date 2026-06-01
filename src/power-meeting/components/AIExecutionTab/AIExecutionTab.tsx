"use client"

/**
 * AI Execution タブ（AI_EXEC フェーズ）
 * AI が自動実行できるタスクの一覧・実行シミュレーション
 * GDIOS連携モード時はストアにセットされた顧客データを使用する
 */

import { useExecutionStore } from '../../stores/executionStore'

export function AIExecutionTab() {
  const { aiTasks, updateAITaskStatus } = useExecutionStore()

  const runTask = (id: string) => {
    const task = aiTasks.find((t) => t.id === id)
    if (!task || task.status !== 'ready') return
    updateAITaskStatus(id, 'running')
    setTimeout(() => {
      updateAITaskStatus(id, 'done', '実行完了')
    }, task.estimatedSeconds * 1000)
  }

  const runAll = () => {
    aiTasks.filter((t) => t.status === 'ready').forEach((t) => runTask(t.id))
  }

  const doneCount    = aiTasks.filter((t) => t.status === 'done').length
  const runningCount = aiTasks.filter((t) => t.status === 'running').length
  const readyCount   = aiTasks.filter((t) => t.status === 'ready').length

  if (aiTasks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">AIタスクがありません。GDIOS連携モードで同期後に表示されます。</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* ヘッダー */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-800">🤖 AI実行タスク</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              AI が自動実行できるタスク。確認後「AI実行」で処理を開始します
            </p>
          </div>
          {readyCount > 0 && (
            <button
              onClick={runAll}
              className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shrink-0"
            >
              全て実行 ({readyCount})
            </button>
          )}
        </div>

        {/* プログレス */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${aiTasks.length > 0 ? (doneCount / aiTasks.length) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-600 shrink-0">
              {doneCount} / {aiTasks.length} 完了
            </span>
          </div>
          {runningCount > 0 && (
            <p className="text-[10px] text-purple-600 animate-pulse">
              ⚡ {runningCount} 件を実行中...
            </p>
          )}
        </div>

        {/* タスクリスト */}
        <div className="space-y-2">
          {aiTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-xl border p-3.5 transition-all duration-300 ${
                task.status === 'done'    ? 'border-purple-100 opacity-75' :
                task.status === 'running' ? 'border-purple-300 shadow-sm'  :
                'border-gray-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-base shrink-0">
                  {task.channelIcon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold leading-snug ${
                        task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'
                      }`}>
                        {task.title}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{task.channel}</p>
                    </div>

                    {task.status === 'ready' && (
                      <button
                        onClick={() => runTask(task.id)}
                        className="text-[10px] px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 transition-colors shrink-0"
                      >
                        AI実行
                      </button>
                    )}
                    {task.status === 'running' && (
                      <span className="text-[10px] px-2.5 py-1 bg-purple-100 text-purple-600 rounded-lg shrink-0 animate-pulse">
                        実行中...
                      </span>
                    )}
                    {task.status === 'done' && (
                      <span className="text-[10px] px-2.5 py-1 bg-green-100 text-green-600 rounded-lg shrink-0 font-medium">
                        ✓ 完了
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-500 mt-1 leading-snug">{task.description}</p>

                  {task.result && (
                    <div className="mt-1.5 bg-green-50 rounded px-2 py-1">
                      <p className="text-[10px] text-green-700">✓ {task.result}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {doneCount === aiTasks.length && aiTasks.length > 0 && (
          <div className="bg-purple-50 rounded-xl border border-purple-100 p-4 text-center">
            <p className="text-sm font-bold text-purple-700">🎉 全タスク完了！</p>
            <p className="text-xs text-purple-500 mt-1">
              次のフェーズ（SYNC_BACK）へ進む準備ができました
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
