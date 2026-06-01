"use client"

import { useState } from 'react'
import { useAgendaStore } from '../../stores/agendaStore'
import { useVoiceStore } from '../../stores/voiceStore'
import { useDecisionStore } from '../../stores/decisionStore'
import { usePermissionStore } from '../../stores/permissionStore'
import { PHASE_TRANSITION_RULES, PHASE_LABELS, getNextPhase, getPrevPhase } from '../../config/phaseTransitionRules'
import { checkPhaseConditions } from '../../utils/checkPhaseConditions'
import { ForceTransitionModal } from './ForceTransitionModal'
import { RollbackModal } from './RollbackModal'
import type { TransitionMode } from '../../types/phase'
import type { Phase } from '../../types/agenda'

interface Props {
  currentRoleId: string
  onClose: () => void
}

const MODE_LABELS: Record<string, { label: string; color: string }> = {
  manual:   { label: '手動',   color: 'bg-blue-100 text-blue-600' },
  auto:     { label: '自動',   color: 'bg-green-100 text-green-600' },
  force:    { label: '強制',   color: 'bg-red-100 text-red-600' },
  rollback: { label: '後戻り', color: 'bg-amber-100 text-amber-600' },
}

/** フェーズナビゲータパネル（C-2 / C-3） */
export function PhaseNavigator({ currentRoleId, onClose }: Props) {
  const { currentPhase, items: agendaItems, advancePhase, transitionHistory } = useAgendaStore()
  const { items: voiceItems } = useVoiceStore()
  const { items: decisionItems } = useDecisionStore()
  const { can } = usePermissionStore()

  const [showForce, setShowForce] = useState(false)
  const [showRollback, setShowRollback] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const nextPhase = getNextPhase(currentPhase)
  const prevPhase = getPrevPhase(currentPhase)
  const rule = nextPhase ? PHASE_TRANSITION_RULES[currentPhase] : undefined

  const isFacilitator = can(currentRoleId, 'phase:advance')

  const ctx = {
    voiceCount:    voiceItems.length,
    agendaItems,
    decisionCount: decisionItems.length,
  }

  const checkResult = rule ? checkPhaseConditions(rule, ctx) : null

  const handleAdvance = () => {
    if (!nextPhase || !isFacilitator) return
    advancePhase(nextPhase as Phase, 'manual', currentRoleId)
    onClose()
  }

  const handleForce = (reason: string) => {
    if (!nextPhase || !isFacilitator) return
    advancePhase(nextPhase as Phase, 'force', currentRoleId, reason)
    onClose()
  }

  const handleRollback = (reason: string) => {
    if (!prevPhase || !isFacilitator) return
    advancePhase(prevPhase as Phase, 'rollback', currentRoleId, reason)
    onClose()
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5"
          onClick={e => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">🚀 フェーズナビゲータ</h2>
              <p className="text-xs text-gray-400 mt-0.5">遷移条件と進行状況を確認できます</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-light leading-none"
            >
              ✕
            </button>
          </div>

          {/* フェーズ矢印 */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <div className="text-center min-w-[90px]">
              <p className="text-[10px] text-gray-400 mb-0.5">現在のフェーズ</p>
              <p className="text-sm font-bold text-blue-600">{currentPhase}</p>
              <p className="text-[11px] text-gray-500">{PHASE_LABELS[currentPhase]}</p>
            </div>
            <div className="flex-1 text-center text-2xl text-gray-300 leading-none">→</div>
            <div className="text-center min-w-[90px]">
              <p className="text-[10px] text-gray-400 mb-0.5">次のフェーズ</p>
              {nextPhase ? (
                <>
                  <p className="text-sm font-bold text-green-600">{nextPhase}</p>
                  <p className="text-[11px] text-gray-500">{PHASE_LABELS[nextPhase]}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400 font-medium">最終フェーズ</p>
              )}
            </div>
          </div>

          {/* 遷移条件リスト */}
          {checkResult && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                遷移条件
              </p>
              {checkResult.conditions.map(c => (
                <div
                  key={c.id}
                  className={`flex items-start gap-2 rounded-lg px-3 py-2.5 ${
                    c.met
                      ? 'bg-green-50'
                      : c.required
                      ? 'bg-red-50'
                      : 'bg-amber-50'
                  }`}
                >
                  <span
                    className={`mt-0.5 text-sm font-bold leading-none ${
                      c.met ? 'text-green-500' : c.required ? 'text-red-400' : 'text-amber-500'
                    }`}
                  >
                    {c.met ? '✓' : c.required ? '✗' : '△'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-medium leading-snug ${
                        c.met ? 'text-green-700' : c.required ? 'text-red-700' : 'text-amber-700'
                      }`}
                    >
                      {c.label}
                      {!c.required && (
                        <span className="ml-1 text-[10px] opacity-60 font-normal">(推奨)</span>
                      )}
                    </p>
                    {c.info && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{c.info}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 最終フェーズ */}
          {!nextPhase && (
            <p className="text-sm text-center text-gray-400 py-2">
              すべてのフェーズが完了しています 🎉
            </p>
          )}

          {/* アクション（ファシリテータのみ） */}
          {nextPhase && isFacilitator && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowForce(true)}
                className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                title="条件未達でも強制遷移する"
              >
                強制遷移
              </button>
              <button
                onClick={handleAdvance}
                disabled={!checkResult?.canAdvance}
                className={`flex-1 text-xs py-2 rounded-lg font-semibold transition-colors ${
                  checkResult?.canAdvance
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {checkResult?.canAdvance
                  ? `${PHASE_LABELS[nextPhase]} へ進む →`
                  : '必須条件未達（強制遷移で進むことも可能）'}
              </button>
            </div>
          )}

          {/* 権限なし */}
          {nextPhase && !isFacilitator && (
            <p className="text-xs text-center text-gray-400 py-1 bg-gray-50 rounded-lg">
              フェーズ遷移はファシリテータのみ操作できます
            </p>
          )}

          {/* C-3: 後戻りボタン（ファシリテータ & 前フェーズあり） */}
          {prevPhase && isFacilitator && (
            <div className="border-t border-gray-100 pt-3">
              <button
                onClick={() => setShowRollback(true)}
                className="w-full text-xs py-2 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center gap-1.5"
                title={`${PHASE_LABELS[prevPhase]} へ戻る`}
              >
                <span>↩</span>
                <span>前フェーズ（{PHASE_LABELS[prevPhase]}）へ戻る</span>
              </button>
            </div>
          )}

          {/* C-3: 遷移履歴ログ */}
          <div className="border-t border-gray-100 pt-3">
            <button
              onClick={() => setShowHistory(v => !v)}
              className="w-full flex items-center justify-between text-[11px] text-gray-400 hover:text-gray-600 py-0.5"
            >
              <span className="font-semibold uppercase tracking-wide">
                遷移履歴 ({transitionHistory.length}件)
              </span>
              <span>{showHistory ? '▲' : '▼'}</span>
            </button>

            {showHistory && (
              <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                {transitionHistory.length === 0 ? (
                  <p className="text-xs text-gray-300 text-center py-3">履歴なし</p>
                ) : (
                  [...transitionHistory].reverse().map((ev, i) => {
                    const modeStyle = MODE_LABELS[ev.mode] ?? { label: ev.mode, color: 'bg-gray-100 text-gray-500' }
                    const d = new Date(ev.ts)
                    const pad = (n: number) => String(n).padStart(2, '0')
                    const time = `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
                    return (
                      <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${modeStyle.color}`}>
                            {modeStyle.label}
                          </span>
                          <span className="text-[11px] font-medium text-gray-700">
                            {PHASE_LABELS[ev.from]} → {PHASE_LABELS[ev.to]}
                          </span>
                          <span className="text-[9px] text-gray-400 ml-auto shrink-0">{time}</span>
                        </div>
                        {ev.reason && (
                          <p className="text-[10px] text-gray-400 pl-0.5 leading-snug">
                            理由: {ev.reason}
                          </p>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            className="w-full text-xs py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>

      {/* 強制遷移モーダル */}
      {showForce && nextPhase && rule && (
        <ForceTransitionModal
          toPhase={nextPhase as Phase}
          toLabel={PHASE_LABELS[nextPhase]}
          onConfirm={handleForce}
          onClose={() => setShowForce(false)}
        />
      )}

      {/* C-3: 後戻りモーダル */}
      {showRollback && prevPhase && (
        <RollbackModal
          fromPhase={currentPhase}
          fromLabel={PHASE_LABELS[currentPhase]}
          toPhase={prevPhase as Phase}
          toLabel={PHASE_LABELS[prevPhase]}
          onConfirm={handleRollback}
          onClose={() => setShowRollback(false)}
        />
      )}
    </>
  )
}
