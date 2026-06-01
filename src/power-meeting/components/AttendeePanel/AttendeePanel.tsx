"use client"

import { useState } from 'react'
import { useAttendeeStore } from '../../stores/attendeeStore'
import type { AttendeeStatus } from '../../types/attendee'

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

  const DOT_COLOR: Record<AttendeeStatus, string> = {
    present: '#22c55e', remote: '#3b82f6', absent: '#f87171',
  }

  return (
    <div style={{ background: 'var(--pm-ctrl-bg, #fff)', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
      {/* 折り畳みヘッダー */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500 }}>👥 参加者管理</span>
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 9999, fontWeight: 500,
          background: hasAbsent ? '#fef3c7' : '#dcfce7',
          color: hasAbsent ? '#92400e' : '#166534',
        }}>
          {present}/{total}名出席中
        </span>
        {!expanded && (
          <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
            {attendees.map(a => (
              <span
                key={a.roleId}
                title={`${a.name}: ${STATUS_CONFIG[a.status].label}`}
                style={{ width: 8, height: 8, borderRadius: '50%', background: DOT_COLOR[a.status], display: 'inline-block' }}
              />
            ))}
          </div>
        )}
        <span style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: 11 }}>{expanded ? '▲ 閉じる' : '▼ 開く'}</span>
      </button>

      {/* 展開パネル */}
      {expanded && (
        <div style={{ padding: '0 16px 12px' }}>
          {/* テーブルヘッダー */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0 12px', alignItems: 'center', fontSize: 11, color: '#9ca3af', marginBottom: 4, padding: '0 4px' }}>
            <span>名前</span><span>ステータス</span><span style={{ textAlign: 'right' }}>基本W</span><span style={{ textAlign: 'right' }}>実効W</span>
          </div>

          {attendees.map(a => {
            const effectivePct = Math.round(a.effectiveWeight * 100)
            const basePct      = Math.round(a.baseWeight * 100)
            const barColor     = a.status === 'absent' ? '#d1d5db' : a.status === 'remote' ? '#60a5fa' : '#22c55e'

            return (
              <div
                key={a.roleId}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                  gap: '0 12px', alignItems: 'center',
                  borderRadius: 8, padding: '6px 8px', marginBottom: 2,
                  opacity: a.status === 'absent' ? 0.5 : 1,
                  background: a.status === 'absent' ? 'rgba(0,0,0,0.03)' : 'transparent',
                }}
              >
                {/* 名前 + ウェイトバー */}
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{a.name}</span>
                  <div style={{ marginTop: 2, height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 2, background: barColor, width: `${effectivePct}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>

                {/* ステータス切り替えボタン群 */}
                <div style={{ display: 'flex', gap: 2 }}>
                  {STATUS_ORDER.map(s => (
                    <button
                      key={s}
                      onClick={() => setStatus(a.roleId, s)}
                      style={{
                        fontSize: 10, padding: '1px 5px', borderRadius: 4, fontWeight: 500,
                        border: '1px solid',
                        background: a.status === s ? (s === 'present' ? '#dcfce7' : s === 'remote' ? '#dbeafe' : '#fee2e2') : 'transparent',
                        color:      a.status === s ? (s === 'present' ? '#166534' : s === 'remote' ? '#1d4ed8' : '#991b1b') : '#9ca3af',
                        borderColor: a.status === s ? (s === 'present' ? '#86efac' : s === 'remote' ? '#93c5fd' : '#fca5a5') : '#e5e7eb',
                        cursor: 'pointer',
                      }}
                      title={STATUS_CONFIG[s].label}
                    >
                      {STATUS_CONFIG[s].short}
                    </button>
                  ))}
                </div>

                <span style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right', width: 32 }}>{basePct}%</span>
                <span style={{
                  fontSize: 11, fontWeight: 500, textAlign: 'right', width: 32,
                  color: a.status === 'absent' ? '#f87171' : effectivePct !== basePct ? '#d97706' : '#15803d',
                }}>
                  {effectivePct}%
                </span>
              </div>
            )
          })}

          {hasAbsent && (
            <p style={{ fontSize: 11, color: '#92400e', background: '#fef3c7', borderRadius: 4, padding: '4px 8px', marginTop: 4 }}>
              ⚠️ 欠席者を除いた出席者間でウェイトが自動再按分されています。
            </p>
          )}
          {hasAbsent && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                onClick={() => attendees.forEach(a => { if (a.status === 'absent') setStatus(a.roleId, 'present') })}
                style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid #86efac', background: '#dcfce7', color: '#166534', cursor: 'pointer' }}
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
