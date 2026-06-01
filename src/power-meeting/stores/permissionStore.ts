import { create } from 'zustand'
import type { PermissionAction, RolePermission } from '../types/permission'
import { ALL_PERMISSION_ACTIONS } from '../types/permission'
import type { Role } from '../types/agenda'

// ──────────────────────────────────────────────────────────────────
// F-2-1 デフォルト権限決定ロジック
// ロール名パターンに基づいてデフォルト権限セットを返す。
// ファシリテータは全権限を持つ。
// ──────────────────────────────────────────────────────────────────

/** ロール名パターンから F-2-1 デフォルト権限を導出する（純粋関数） */
export function deriveDefaultPermissions(
  roleName: string,
  isFacilitator: boolean,
): PermissionAction[] {
  if (isFacilitator) return [...ALL_PERMISSION_ACTIONS]

  const n = roleName.toLowerCase()

  // 全ロール共通の基本権限
  const base: PermissionAction[] = ['voice:add', 'position:vote', 'decision:vote']

  // CEO / Owner / Executive → 議事進行に近い権限
  if (n.includes('ceo') || n.includes('owner') || n.includes('exec')) {
    return [
      ...base,
      'agenda:add',
      'agenda:park',
      'agenda:status_change',
      'decision:add',
      'story:approve',
      'story:publish',
    ]
  }

  // CS / Customer Success / Account
  if (n.includes('cs') || n.includes('customer') || n.includes('account')) {
    return [
      ...base,
      'agenda:add',
      'story:approve',
      'story:publish',
    ]
  }

  // PM / Product / プロダクト
  if (n.includes('pm') || n.includes('product') || n.includes('プロダクト')) {
    return [
      ...base,
      'agenda:add',
      'decision:add',
    ]
  }

  // Engineering / Tech / 開発
  if (n.includes('eng') || n.includes('tech') || n.includes('dev') || n.includes('開発')) {
    return [
      ...base,
      'decision:add',
    ]
  }

  // その他: 基本権限のみ
  return base
}

// ──────────────────────────────────────────────────────────────────
// Zustand Store
// ──────────────────────────────────────────────────────────────────

interface PermissionState {
  permissions:       RolePermission[]
  facilitatorRoleId: string | null

  /** ロール一覧 + ファシリテータ指定で F-2-1 デフォルト権限を初期化 */
  initFromRoles: (roles: Role[], facilitatorRoleId?: string) => void
  /** ファシリテータを変更（権限マトリクスを再計算） */
  setFacilitator: (roleId: string) => void
  /** 特定ロールに権限を付与 */
  grantPermission: (roleId: string, action: PermissionAction) => void
  /** 特定ロールから権限を剥奪 */
  revokePermission: (roleId: string, action: PermissionAction) => void

  /** roleId がアクションを実行できるか */
  can: (roleId: string, action: PermissionAction) => boolean
  /** roleId のエントリを返す */
  getEntry: (roleId: string) => RolePermission | undefined
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions:       [],
  facilitatorRoleId: null,

  initFromRoles: (roles, facilitatorRoleId) => {
    // facilitatorRoleId が未指定なら最初のロールをファシリテータとする
    const facId = facilitatorRoleId ?? roles[0]?.id ?? null
    const permissions: RolePermission[] = roles.map(r => ({
      roleId:        r.id,
      roleName:      r.name,
      isFacilitator: r.id === facId,
      allowed:       deriveDefaultPermissions(r.name, r.id === facId),
    }))
    set({ permissions, facilitatorRoleId: facId })
  },

  setFacilitator: (roleId) =>
    set(state => {
      const permissions = state.permissions.map(p => ({
        ...p,
        isFacilitator: p.roleId === roleId,
        allowed:       deriveDefaultPermissions(p.roleName, p.roleId === roleId),
      }))
      return { permissions, facilitatorRoleId: roleId }
    }),

  grantPermission: (roleId, action) =>
    set(state => ({
      permissions: state.permissions.map(p =>
        p.roleId === roleId && !p.allowed.includes(action)
          ? { ...p, allowed: [...p.allowed, action] }
          : p
      ),
    })),

  revokePermission: (roleId, action) =>
    set(state => ({
      permissions: state.permissions.map(p =>
        p.roleId === roleId
          ? { ...p, allowed: p.allowed.filter(a => a !== action) }
          : p
      ),
    })),

  can: (roleId, action) => {
    const entry = get().permissions.find(p => p.roleId === roleId)
    return entry?.allowed.includes(action) ?? false
  },

  getEntry: (roleId) =>
    get().permissions.find(p => p.roleId === roleId),
}))
