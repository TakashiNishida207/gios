"use client"

import { useState } from 'react'
import type { Phase } from '@pm/types/agenda'

interface Props {
  fromPhase: Phase
  fromLabel: string
  toPhase: Phase
  toLabel: string
  onConfirm: (reason: string) => void
  onClose: () => void
}

/**
 * C-3: フェーズ後戻り確認モーダル
 * 理由入力必須。前フェーズへの rollback を記録する。
 */
export function RollbackModal({ fromPhase, fromLabel, toPhase, toLabel, onConfirm, onClose }: Props) {
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
          <h3 className="text-sm font-bold text-amber-600">↩ フェーズ後戻り</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
            ✕
          </button>
        </div>

        {/* フェーズ矢印 */}
        <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-4 py-3">
          <div className="text-center flex-1">
            <p className="text-[10px] text-gray-400 mb-0.5">現在</p>
            <p className="text-sm font-bold text-gray-700">{fromPhase}</p>
            <p className="text-[11px] text-gray-500">{fromLabel}</p>
          </div>
          <div className="text-xl text-amber-400 font-bold leading-none">←</div>
          <div className="text-center flex-1">
            <p className="text-[10px] text-gray-400 mb-0.5">戻り先</p>
            <p className="text-sm font-bold text-amber-600">{toPhase}</p>
            <p className="text-[11px] text-gray-500">{toLabel}</p>
          </div>
        </div>

        {/* 警告 */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>{toLabel}（{toPhase}）</strong> へ戻ります。
            現フェーズでの作業内容（発言・ポジション等）は保持されますが、
            この操作は全参加者に即時反映され、遷移履歴に記録されます。
          </p>
        </div>

        {/* 理由入力 */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            後戻り理由 <span className="text-amber-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="例：追加の情報収集が必要なため"
            className="w-full text-xs border border-gray-200 rounded-lg p-2.5 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
            autoFocus
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
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            後戻りを実行
          </button>
        </div>
      </div>
    </div>
  )
}
