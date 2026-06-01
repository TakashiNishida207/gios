"use client"

import { useState } from 'react'
import type { AgendaItem, AgendaItemStatus, Phase, Reaction, Stance } from '@pm/types/agenda'
import { useAgendaStore } from '@pm/stores/agendaStore'
import { usePermission } from '@pm/hooks/usePermission'

/** E-1: 他アジェンダへのクロスリンク選択ポップオーバー */
function CrossLinkPicker({
  currentAgendaId,
  allAgendas,
  selected,
  onChange,
}: {
  currentAgendaId: string
  allAgendas: AgendaItem[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const others = allAgendas.filter(a => a.id !== currentAgendaId && !a.parked)
  if (others.length === 0) return <p className="text-xs text-gray-400 py-1">他のアジェンダがありません</p>

  return (
    <div className="border border-blue-100 bg-blue-50 rounded-lg p-2 space-y-1">
      <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">他アジェンダに共有</p>
      {others.map(a => {
        const checked = selected.includes(a.id)
        return (
          <label key={a.id} className="flex items-start gap-1.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={checked}
              onChange={() =>
                onChange(
                  checked ? selected.filter(id => id !== a.id) : [...selected, a.id]
                )
              }
              className="mt-0.5 accent-blue-600 shrink-0"
            />
            <span className="text-xs text-gray-700 group-hover:text-blue-700 leading-snug line-clamp-2">
              {a.title}
            </span>
          </label>
        )
      })}
    </div>
  )
}

type Props = {
  item: AgendaItem
  phase: Phase
  currentRoleId: string
  currentRoleName: string
  readOnly?: boolean
  onOpenDetail?: () => void
}

const EMOJIS: Reaction['emoji'][] = ['👍', '⭐', '❓', '⚠️']

// メインフロー（保留はボタン別途）
const STATUS_FLOW_OPTIONS: { value: AgendaItemStatus; label: string; color: string }[] = [
  { value: 'pending',        label: '未開始',    color: 'bg-gray-100 text-gray-500 border-gray-200' },
  { value: 'in_discussion',  label: '議論中',    color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'converging',     label: '収束中',    color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'aligned',        label: '合意',      color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'awaiting_exec',  label: 'EXEC待ち',  color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'decided',        label: '完了',      color: 'bg-purple-50 text-purple-700 border-purple-200' },
]

// 保留理由のプリセット選択肢
const PARK_REASON_PRESETS = [
  '情報不足 — 追加データが必要',
  '時間切れ — 次回に持ち越し',
  '関係者不在 — 意思決定者の確認が必要',
  '前提条件未解決 — 別議題の結論待ち',
  'その他',
]

type ParkFormState = {
  reason: string
  carryOverDate: string
  comment: string
}

/** 保留入力モーダル */
function ParkModal({
  itemTitle,
  onConfirm,
  onCancel,
}: {
  itemTitle: string
  onConfirm: (form: ParkFormState) => void
  onCancel: () => void
}) {
  const today = new Date()
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const [form, setForm] = useState<ParkFormState>({
    reason: '',
    carryOverDate: nextWeek,
    comment: '',
  })

  const canSubmit = form.reason.trim().length > 0

  return (
    // オーバーレイ
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-[420px] max-w-[90vw] p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">アジェンダを保留にする</h3>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{itemTitle}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none shrink-0"
          >
            ×
          </button>
        </div>

        {/* 保留理由 */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">
            保留理由 <span className="text-red-400">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PARK_REASON_PRESETS.map(preset => (
              <button
                key={preset}
                onClick={() => setForm(f => ({ ...f, reason: preset }))}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  form.reason === preset
                    ? 'bg-yellow-100 text-yellow-700 border-yellow-300 font-medium'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          {/* 自由入力欄 */}
          <input
            type="text"
            placeholder="または理由を直接入力..."
            value={form.reason.length > 0 && !PARK_REASON_PRESETS.includes(form.reason)
              ? form.reason
              : (PARK_REASON_PRESETS.includes(form.reason) ? '' : form.reason)}
            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            onFocus={() => {
              if (PARK_REASON_PRESETS.includes(form.reason)) {
                setForm(f => ({ ...f, reason: '' }))
              }
            }}
            className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-yellow-400"
          />
        </div>

        {/* 次回持ち越し予定日 */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">次回持ち越し予定日</label>
          <input
            type="date"
            value={form.carryOverDate}
            onChange={e => setForm(f => ({ ...f, carryOverDate: e.target.value }))}
            className="text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-yellow-400"
          />
        </div>

        {/* 担当者コメント */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">担当者コメント（任意）</label>
          <textarea
            value={form.comment}
            onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
            placeholder="保留に際しての補足・引き継ぎメモ..."
            rows={2}
            className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 resize-none focus:outline-none focus:border-yellow-400"
          />
        </div>

        {/* アクション */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            className="text-xs px-3 py-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={() => canSubmit && onConfirm(form)}
            disabled={!canSubmit}
            className="text-xs px-4 py-1.5 rounded bg-yellow-500 text-white font-medium hover:bg-yellow-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            保留にする
          </button>
        </div>
      </div>
    </div>
  )
}

export function AgendaInput({
  item,
  phase,
  currentRoleId,
  currentRoleName,
  readOnly = false,
  onOpenDetail,
}: Props) {
  const { addDiscussionEntry, addReaction, removeReaction, setPosition, parkAgenda, updateStatus, items: allAgendaItems } = useAgendaStore()
  const [text, setText] = useState('')
  const [showParkModal, setShowParkModal] = useState(false)
  const [showCrossLink, setShowCrossLink] = useState(false)
  const [crossLinkIds, setCrossLinkIds] = useState<string[]>([])

  // F-2 権限チェック
  const canPark         = usePermission(currentRoleId, 'agenda:park')
  const canChangeStatus = usePermission(currentRoleId, 'agenda:status_change')
  const canVote         = usePermission(currentRoleId, 'position:vote')

  const myReactions = item.reactions.filter(r => r.roleId === currentRoleId)
  const myPosition = item.positions.find(p => p.roleId === currentRoleId)

  function handleSubmit() {
    if (!text.trim()) return
    addDiscussionEntry(item.id, {
      id: `disc-${Date.now()}`,
      speaker: currentRoleName,
      roleId: currentRoleId,
      ts: new Date().toISOString(),
      text: text.trim(),
      phase,
      linkedAgendaIds: crossLinkIds.length > 0 ? crossLinkIds : undefined,
    })
    setText('')
    setCrossLinkIds([])
    setShowCrossLink(false)
  }

  function handleReaction(emoji: Reaction['emoji']) {
    const existing = myReactions.find(r => r.emoji === emoji)
    if (existing) {
      removeReaction(item.id, existing.id)
    } else {
      addReaction(item.id, {
        id: `react-${Date.now()}`,
        emoji,
        roleId: currentRoleId,
        ts: new Date().toISOString(),
      })
    }
  }

  function handleStance(stance: Stance) {
    setPosition(item.id, {
      roleId: currentRoleId,
      stance,
      weightContribution: 0.25,
      ts: new Date().toISOString(),
    })
  }

  function handleParkConfirm(form: ParkFormState) {
    parkAgenda(item.id, {
      reason:        form.reason,
      carryOverDate: form.carryOverDate,
      comment:       form.comment,
    })
    setShowParkModal(false)
  }

  const recentEntries = item.discussionLog.slice(-3)
  const reactionSummary = EMOJIS.map(emoji => ({
    emoji,
    count: item.reactions.filter(r => r.emoji === emoji).length,
    mine: myReactions.some(r => r.emoji === emoji),
  }))

  const stanceColor = {
    agree:    'bg-green-100 text-green-700',
    neutral:  'bg-gray-100 text-gray-600',
    disagree: 'bg-red-100 text-red-700',
  }

  return (
    <>
      <div className="space-y-2">
        {/* 最新発言 */}
        <div className="space-y-1">
          {recentEntries.map(entry => (
            <div key={entry.id} className="text-xs text-gray-600 bg-gray-50 rounded p-1.5">
              <span className="font-medium text-gray-700">{entry.speaker}:</span>{' '}
              <span className="line-clamp-2">{entry.text}</span>
            </div>
          ))}
        </div>

        {/* ステータス変更行 */}
        {!readOnly && !item.parked && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-gray-400 shrink-0">進捗:</span>
            {STATUS_FLOW_OPTIONS.map(opt => {
              const isCurrent = item.status === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={e => { e.stopPropagation(); canChangeStatus && updateStatus(item.id, opt.value) }}
                  disabled={!canChangeStatus}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    isCurrent
                      ? `${opt.color} font-semibold`
                      : 'border-gray-100 text-gray-300 hover:border-gray-300 hover:text-gray-500'
                  } ${!canChangeStatus ? 'cursor-not-allowed opacity-60' : ''}`}
                  title={canChangeStatus ? opt.label : '権限がありません (agenda:status_change)'}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Reaction バー */}
        <div className="flex items-center gap-1.5">
          {reactionSummary.map(({ emoji, count, mine }) => (
            <button
              key={emoji}
              onClick={() => !readOnly && handleReaction(emoji)}
              disabled={readOnly}
              className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-colors ${
                mine ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
              } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span>{emoji}</span>
              {count > 0 && <span className="text-gray-500">{count}</span>}
            </button>
          ))}
        </div>

        {/* ポジション表明 */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">立場:</span>
          {(['agree', 'neutral', 'disagree'] as Stance[]).map(stance => {
            const labels = { agree: '賛成', neutral: '中立', disagree: '反対' }
            const active = myPosition?.stance === stance
            const disabled = readOnly || !canVote
            return (
              <button
                key={stance}
                onClick={() => !disabled && handleStance(stance)}
                disabled={disabled}
                title={!canVote ? '権限がありません (position:vote)' : labels[stance]}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  active
                    ? stanceColor[stance] + ' border-transparent'
                    : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                {labels[stance]}
              </button>
            )
          })}
          {!canVote && (
            <span className="text-xs text-gray-300 ml-1" title="position:vote 権限が必要です">🔒</span>
          )}
        </div>

        {/* インプット欄 + ボタン行 */}
        {!readOnly && (
          <div className="space-y-1.5">
            <div className="flex gap-1">
              <input
                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                placeholder="発言を入力... (@メンション対応)"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
              />
              {/* E-1: クロスリンクトグル */}
              <button
                onClick={e => { e.stopPropagation(); setShowCrossLink(v => !v) }}
                className={`text-xs px-1.5 py-1 rounded border transition-colors ${
                  crossLinkIds.length > 0
                    ? 'border-blue-400 bg-blue-50 text-blue-600'
                    : showCrossLink
                    ? 'border-blue-300 bg-blue-50 text-blue-500'
                    : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                }`}
                title="他のアジェンダにもこの発言を共有する"
              >
                🔗{crossLinkIds.length > 0 ? ` ${crossLinkIds.length}` : ''}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!text.trim()}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-40"
              >
                送信
              </button>
              {/* 詳細パネルを開くボタン */}
              <button
                onClick={onOpenDetail}
                disabled={!onOpenDetail}
                className="text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded hover:bg-gray-50 disabled:opacity-30"
                title="詳細パネルを開く（ディスカッションログ・関連Voice全表示）"
              >
                詳細
              </button>
              {/* 保留ボタン — agenda:park 権限必須 */}
              {!item.parked && canPark && (
                <button
                  onClick={() => setShowParkModal(true)}
                  className="text-xs text-yellow-600 border border-yellow-200 bg-yellow-50 px-2 py-1 rounded hover:bg-yellow-100"
                  title="このアジェンダを保留にする（理由・持ち越し日を入力）"
                >
                  保留
                </button>
              )}
              {!item.parked && !canPark && (
                <span
                  className="text-xs text-gray-300 border border-gray-100 px-2 py-1 rounded cursor-not-allowed"
                  title="権限がありません (agenda:park)"
                >
                  🔒 保留
                </span>
              )}
            </div>

            {/* E-1: クロスリンク選択ピッカー */}
            {showCrossLink && (
              <CrossLinkPicker
                currentAgendaId={item.id}
                allAgendas={allAgendaItems}
                selected={crossLinkIds}
                onChange={setCrossLinkIds}
              />
            )}
          </div>
        )}
      </div>

      {/* 保留モーダル */}
      {showParkModal && (
        <ParkModal
          itemTitle={item.title}
          onConfirm={handleParkConfirm}
          onCancel={() => setShowParkModal(false)}
        />
      )}
    </>
  )
}
