"use client"

import { useState } from 'react'
import { useAttendeeStore } from '@pm/stores/attendeeStore'
import type { AttendeeStatus } from '@pm/types/attendee'

const STATUS_CONFIG: Record<
  AttendeeStatus,
  { label: string; short: string; color: string; dot: string }
> = {
  present: { label: '出席',   short: '出', color: 'bg-green-100 text-green-700 border-green-300',  dot: 'bg-green-500' },
  remote:  { label: 'リモート', short: 'R', color: 'bg-blue-100 text-blue-700 border-blue-300',    dot: 'bg-blue-500'  },
  absent:  { label: '欠席',   short: '欠', color: 'bg-red-100 text-red-700 border-red-300',        dot: 'bg-red-400'   },
}

const STATUS_ORDER: AttendeeStatus[] = ['present', 'remote', 'absent']

/** 参加者1名の行 */
function AttendeeRow() {
  // Component defined inline below
  return null
}
void AttendeeRow // suppress unused warning

/** 参加者管理パネル (collapsible) */
export function AttendeePanel() {
  const [expanded, setExpanded] = useState(false)
  const { attendees, setStatus, getPresentCount } = useAttendeeStore()

  const total   = attendees.length
  const present = getPresentCount()
  const hasAbsent = attendees.some(a => a.status === 'absent')

  return (
    <div className="bg-white border-b border-gray-200 shrink-0">
      {/* 折り畳みヘッダー */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
      >
        <span className="text-sm font-medium text-gray-700">👥 参加者管理</span>
        {/* 出席サマリーバッジ */}
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          hasAbsent ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
        }`}>
          {present}/{total}名出席中
        </span>
        {/* 各ロールのドットインジケータ (collapsed 時のみ) */}
        {!expanded && (
          <div className="flex gap-1 ml-1">
            {attendees.map(a => (
              <span
                key={a.roleId}
                title={`${a.name}: ${STATUS_CONFIG[a.status].label}`}
                className={`w-2 h-2 rounded-full ${STATUS_CONFIG[a.status].dot}`}
              />
            ))}
          </div>
        )}
        <span className="ml-auto text-gray-400 text-xs">{expanded ? '▲ 閉じる' : '▼ 開く'}</span>
      </button>

      {/* 展開パネル */}
      {expanded && (
        <div className="px-4 pb-3 space-y-1">
          {/* テーブルヘッダー */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center text-xs text-gray-400 mb-1 px-1">
            <span>名前</span>
            <span>ステータス</span>
            <span className="text-right">基本W</span>
            <span className="text-right">実効W</span>
          </div>

          {attendees.map(a => {
            const effectivePct = Math.round(a.effectiveWeight * 100)
            const basePct      = Math.round(a.baseWeight * 100)

            return (
              <div
                key={a.roleId}
                className={`grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center rounded-lg px-2 py-1.5 ${
                  a.status === 'absent' ? 'opacity-50 bg-gray-50' : 'bg-white'
                }`}
              >
                {/* 名前 + ウェイトバー */}
                <div className="min-w-0">
                  <span className="text-xs font-medium text-gray-800">{a.name}</span>
                  {/* 実効ウェイトバー */}
                  <div className="mt-0.5 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        a.status === 'absent' ? 'bg-gray-300' :
                        a.status === 'remote' ? 'bg-blue-400' : 'bg-green-500'
                      }`}
                      style={{ width: `${effectivePct}%` }}
                    />
                  </div>
                </div>

                {/* ステータス切り替えボタン群 */}
                <div className="flex gap-0.5">
                  {STATUS_ORDER.map(s => (
                    <button
                      key={s}
                      onClick={() => setStatus(a.roleId, s)}
                      className={`text-xs px-1.5 py-0.5 rounded border font-medium transition-colors ${
                        a.status === s
                          ? STATUS_CONFIG[s].color
                          : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                      }`}
                      title={STATUS_CONFIG[s].label}
                    >
                      {STATUS_CONFIG[s].short}
                    </button>
                  ))}
                </div>

                {/* 基本ウェイト */}
                <span className="text-xs text-gray-400 text-right w-8">{basePct}%</span>

                {/* 実効ウェイト (変化があれば強調) */}
                <span className={`text-xs font-medium text-right w-8 ${
                  a.status === 'absent'
                    ? 'text-red-400'
                    : effectivePct !== basePct
                      ? 'text-amber-600'
                      : 'text-green-700'
                }`}>
                  {effectivePct}%
                </span>
              </div>
            )
          })}

          {/* 欠席者がいるときの注記 */}
          {hasAbsent && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1 mt-1">
              ⚠️ 欠席者を除いた出席者間でウェイトが自動再按分されています。コンセンサス計算に反映済みです。
            </p>
          )}

          {/* 全員出席ボタン */}
          {hasAbsent && (
            <div className="flex justify-end mt-1">
              <button
                onClick={() => {
                  attendees.forEach(a => {
                    if (a.status === 'absent') setStatus(a.roleId, 'present')
                  })
                }}
                className="text-xs px-2 py-1 rounded border border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
              >
                全員出席に戻す
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
