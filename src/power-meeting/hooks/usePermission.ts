import { usePermissionStore } from '@pm/stores/permissionStore'
import type { PermissionAction } from '@pm/types/permission'

/**
 * 現在のロール（roleId）が指定アクションを実行できるかを返す。
 *
 * @example
 * const canPark = usePermission('role-ceo', 'agenda:park')
 */
export function usePermission(roleId: string, action: PermissionAction): boolean {
  return usePermissionStore(state => state.can(roleId, action))
}

/**
 * 複数アクションをまとめてチェックする版。
 * すべて can な場合のみ true。
 */
export function usePermissions(
  roleId: string,
  actions: PermissionAction[],
): boolean {
  return usePermissionStore(state =>
    actions.every(a => state.can(roleId, a))
  )
}
