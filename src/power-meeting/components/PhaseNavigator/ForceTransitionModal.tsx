"use client"

import { useState } from 'react'
import type { Phase } from '@pm/types/agenda'

interface Props {
  toPhase: Phase
  toLabel: string
  onConfirm: (reason: string) => void
  onClose: () => void
}

/** 強制遷移用：理由入力モーダル */
export function ForceTransitionModal({ toPhase, toLabel, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState('')

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* タイトル */}
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-bold text-red-600">⚠️ 強制フェーズ遷移</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
            ✕
          </button>
        </div>

        {/* 警告 */}
        <div className="bg-red-50 rounded-lg p-3">
          <p className="text-xs text-red-700 leading-relaxed">
            遷移条件が未達の状態で{' '}
            <strong>
              {toLabel}（{toPhase}）
            </strong>{' '}
            へ強制遷移します。この操作は全参加者に即時反映されます。
          </p>
        </div>

        {/* 理由入力 */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            遷移理由 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="例：時間の制約により次のフェーズへ移行します"
            className="w-full text-xs border border-gray-200 rounded-lg p-2.5 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>

        {/* ボタン */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 text-xs py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={() => {
              if (reason.trim()) onConfirm(reason.trim())
            }}
            disabled={!reason.trim()}
            className={`flex-1 text-xs py-2 rounded-lg font-semibold transition-colors ${
              reason.trim()
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            強制遷移を実行
          </button>
        </div>
      </div>
    </div>
  )
}
