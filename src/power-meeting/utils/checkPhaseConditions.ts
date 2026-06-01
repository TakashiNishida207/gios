/**
 * C-2: フェーズ遷移条件チェックユーティリティ
 */

import type { PhaseTransitionRule, PhaseContext, TransitionCheckResult } from '../types/phase'

/**
 * ルールとコンテキストを受け取り、各条件の評価結果を返す。
 * ストアに直接アクセスしないため、純粋関数として単体テスト可能。
 */
export function checkPhaseConditions(
  rule: PhaseTransitionRule,
  ctx: PhaseContext,
): TransitionCheckResult {
  const conditions = rule.conditions.map(spec => {
    const result = spec.check(ctx)
    return {
      id:       spec.id,
      label:    spec.label,
      met:      result.met,
      info:     result.info,
      required: spec.required,
    }
  })

  const requiredConditions = conditions.filter(c => c.required)
  const canAdvance = requiredConditions.length === 0 || requiredConditions.every(c => c.met)
  const allMet     = conditions.every(c => c.met)

  return {
    canAdvance,
    allMet,
    conditions,
    readyForAuto: canAdvance && rule.autoAdvance,
  }
}
