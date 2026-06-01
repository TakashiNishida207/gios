"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePermissionStore } from '../../stores/permissionStore'
import {
  ALL_PERMISSION_ACTIONS,
  PERMISSION_ACTION_LABELS,
  PERMISSION_ACTION_DESCRIPTIONS,
} from '../../types/permission'
import type { PermissionAction } from '../../types/permission'

interface Props {
  currentRoleId: string
  onClose: () => void
}

/** 権限説明ポップアップ */
function ActionDescPopup({
  action,
  onClose,
}: {
  action: PermissionAction
  onClose: () => void
}) {
  const desc = PERMISSION_ACTION_DESCRIPTIONS[action]
  const label = PERMISSION_ACTION_LABELS[action]

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.25)', width: '100%', maxWidth: 384, padding: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {/* タイトル */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-gray-800">{label}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none shrink-0">
            ✕
          </button>
        </div>

        {/* 内容 */}
        <div className="space-y-2 text-xs">
          <div className="bg-gray-50 rounded-lg px-3 py-2 space-y-1">
            <p className="font-semibold text-gray-500 uppercase tracking-wide text-[10px]">何ができるか</p>
            <p className="text-gray-700 leading-relaxed">{desc.what}</p>
          </div>
          <div className="bg-blue-50 rounded-lg px-3 py-2 space-y-1">
            <p className="font-semibold text-blue-400 uppercase tracking-wide text-[10px]">使用タイミング</p>
            <p className="text-blue-700 leading-relaxed">{desc.when}</p>
          </div>
          <div className="bg-green-50 rounded-lg px-3 py-2 space-y-1">
            <p className="font-semibold text-green-500 uppercase tracking-wide text-[10px]">使用例</p>
            <p className="text-green-700 leading-relaxed">{desc.example}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full text-xs py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium"
        >
          閉じる
        </button>
      </div>
    </div>
  )
}

/** ドラッグ可能パネル用フック */
function useDraggable() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const origin = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // テキスト選択を防ぐ
    e.preventDefault()
    dragging.current = true
    origin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
  }, [pos])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    dragging.current = true
    origin.current = { mx: t.clientX, my: t.clientY, px: pos.x, py: pos.y }
  }, [pos])

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging.current || !origin.current) return
      setPos({
        x: origin.current.px + e.clientX - origin.current.mx,
        y: origin.current.py + e.clientY - origin.current.my,
      })
    }
    function onTouchMove(e: TouchEvent) {
      if (!dragging.current || !origin.current) return
      const t = e.touches[0]
      setPos({
        x: origin.current.px + t.clientX - origin.current.mx,
        y: origin.current.py + t.clientY - origin.current.my,
      })
    }
    function onUp() {
      dragging.current = false
      origin.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onTouchMove)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [])

  return { pos, onMouseDown, onTouchStart }
}

export function PermissionMatrixPanel({ currentRoleId, onClose }: Props) {
  const { permissions, facilitatorRoleId, grantPermission, revokePermission, setFacilitator } =
    usePermissionStore()

  const [descAction, setDescAction] = useState<PermissionAction | null>(null)
  const { pos, onMouseDown, onTouchStart } = useDraggable()

  const isFacilitator = currentRoleId === facilitatorRoleId
  const FACILITATOR_ONLY: PermissionAction[] = ['phase:advance', 'attendee:manage']

  return (
    <>
      {/* 薄い背景オーバーレイ（クリック閉じなし: ドラッグ操作を妨げないため） */}
      <div className="fixed inset-0 z-50 pointer-events-none bg-black/20" />

      {/* ドラッグ可能パネル */}
      <div
        className="fixed z-50"
        style={{
          top:  '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
          width: '100%',
          maxWidth: '56rem',   // max-w-4xl
          padding: '0 1rem',
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
          style={{ pointerEvents: 'auto' }}
        >

          {/* ヘッダー（ドラッグハンドル） */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-gray-100 cursor-grab active:cursor-grabbing select-none"
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
          >
            <div>
              <h2 className="text-base font-bold text-gray-900">
                🔐 権限マトリクス
                <span className="ml-2 text-[10px] text-gray-300 font-normal">⠿ ドラッグで移動</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                F-2-1 デフォルト値。権限名の <span className="font-semibold text-indigo-500">?</span> をタップすると定義を確認できます。
              </p>
            </div>
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-light"
            >
              ✕
            </button>
          </div>

          {/* ファシリテータ変更バー（全員が変更可能） */}
          <div className="px-6 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-indigo-700">ファシリテータ:</span>
            {permissions.map(p => (
              <button
                key={p.roleId}
                onClick={() => setFacilitator(p.roleId)}
                className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-colors ${
                  p.roleId === facilitatorRoleId
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-indigo-600 border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                {p.roleName}
              </button>
            ))}
          </div>

          {/* テーブル */}
          <div className="flex-1 overflow-auto px-6 py-4">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 text-gray-500 font-medium w-44 sticky left-0 bg-gray-50 border-b border-gray-200">
                    権限 \ ロール
                  </th>
                  {permissions.map(p => (
                    <th
                      key={p.roleId}
                      className="px-3 py-2 text-center text-gray-700 font-semibold border-b border-gray-200 min-w-[100px]"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span>{p.roleName}</span>
                        {p.isFacilitator && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1 rounded">
                            ファシリ
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_PERMISSION_ACTIONS.map((action, rowIdx) => {
                  const isFacOnly = FACILITATOR_ONLY.includes(action)
                  return (
                    <tr
                      key={action}
                      className={`${rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${
                        isFacOnly ? 'opacity-70' : ''
                      }`}
                    >
                      {/* 権限名 + ? ボタン */}
                      <td className="px-3 py-2 text-gray-600 sticky left-0 bg-inherit border-b border-gray-100">
                        <div className="flex items-center gap-1.5">
                          {isFacOnly && (
                            <span className="text-[10px] text-indigo-400" title="ファシリテータ専用">🔒</span>
                          )}
                          <span>{PERMISSION_ACTION_LABELS[action]}</span>
                          {/* ? ボタン */}
                          <button
                            onClick={() => setDescAction(action)}
                            className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-100 text-indigo-500 text-[10px] font-bold leading-none hover:bg-indigo-200 transition-colors flex items-center justify-center"
                            title="権限の定義を確認"
                          >
                            ?
                          </button>
                        </div>
                      </td>

                      {/* 各ロールのチェックセル */}
                      {permissions.map(p => {
                        const granted = p.allowed.includes(action)
                        const canEdit = isFacilitator && !p.isFacilitator && !isFacOnly
                        return (
                          <td
                            key={p.roleId}
                            className="px-3 py-2 text-center border-b border-gray-100"
                          >
                            {isFacOnly ? (
                              <span className={p.isFacilitator ? 'text-indigo-600 font-bold' : 'text-gray-200'}>
                                {p.isFacilitator ? '✓' : '−'}
                              </span>
                            ) : p.isFacilitator ? (
                              <span className="text-indigo-600 font-bold">✓</span>
                            ) : canEdit ? (
                              <input
                                type="checkbox"
                                checked={granted}
                                onChange={e => {
                                  if (e.target.checked) grantPermission(p.roleId, action)
                                  else revokePermission(p.roleId, action)
                                }}
                                className="w-3.5 h-3.5 cursor-pointer accent-indigo-600"
                              />
                            ) : (
                              <span className={granted ? 'text-green-600 font-bold' : 'text-gray-300'}>
                                {granted ? '✓' : '−'}
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* フッター */}
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between gap-4">
            <p className="text-xs text-gray-400">
              {isFacilitator
                ? 'チェックボックスをクリックして権限を変更できます。ファシリテータ列・🔒 専用権限は変更不可です。'
                : `権限の変更は現在のファシリテータ（${permissions.find(p => p.isFacilitator)?.roleName ?? '未設定'}）のみ可能。ファシリテータ変更は誰でも行えます。`}
            </p>
            <button
              onClick={onClose}
              className="text-xs px-4 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 shrink-0"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>

      {/* 権限説明ポップアップ */}
      {descAction && (
        <ActionDescPopup
          action={descAction}
          onClose={() => setDescAction(null)}
        />
      )}
    </>
  )
}
