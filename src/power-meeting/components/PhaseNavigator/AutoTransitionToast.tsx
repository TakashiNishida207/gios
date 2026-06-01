"use client"

import { useState, useEffect, useCallback } from 'react'
import type { Phase } from '@pm/types/agenda'
import { PHASE_LABELS } from '@pm/config/phaseTransitionRules'

interface Props {
  toPhase: Phase
  delaySeconds: number
  onConfirm: () => void
  onDismiss: () => void
}

/** 自動遷移カウントダウントースト */
export function AutoTransitionToast({ toPhase, delaySeconds, onConfirm, onDismiss }: Props) {
  const [remaining, setRemaining] = useState(delaySeconds)

  const handleConfirm = useCallback(() => {
    onConfirm()
  }, [onConfirm])

  useEffect(() => {
    if (remaining <= 0) {
      handleConfirm()
      return
    }
    const timer = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(timer)
  }, [remaining, handleConfirm])

  const progress = ((delaySeconds - remaining) / delaySeconds) * 100

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <div className="bg-blue-600 text-white rounded-xl shadow-2xl px-4 py-3 space-y-2">
        {/* 上段 */}
        <div className="flex items-center gap-3">
          {/* カウントダウン円 */}
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
            {remaining}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold">自動フェーズ遷移</p>
            <p className="text-[11px] opacity-80">
              {remaining}秒後に <strong>{PHASE_LABELS[toPhase]}（{toPhase}）</strong> へ移行
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg shrink-0 transition-colors"
          >
            停止
          </button>
        </div>

        {/* プログレスバー */}
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/70 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
