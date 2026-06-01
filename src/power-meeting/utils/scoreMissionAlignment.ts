import {
  KEYWORD_RULES,
  NORMALIZATION_BASE,
  THRESHOLDS,
  type AlignmentLevel,
  type KeywordRule,
} from '../config/missionAlignment'
import type { AgendaItem } from '../types/agenda'

export type MissionAlignmentResult = {
  /** 正規化スコア 0.0–1.0 */
  score: number
  /** 判定レベル */
  level: AlignmentLevel
  /** マッチしたルールのラベル一覧 */
  matchedRules: { id: string; label: string; weight: number }[]
  /** スコアの根拠を人が読める形で説明 */
  reason: string
}

/**
 * キーワードが text に含まれるかを判定
 * 大文字小文字・全半角を正規化してチェック
 */
function containsKeyword(text: string, keyword: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0))

  return normalize(text).includes(normalize(keyword))
}

/**
 * 1つのルールがテキストにマッチするか判定
 * ルール内のキーワードが1つでも含まれていれば true
 */
function ruleMatches(text: string, rule: KeywordRule): boolean {
  return rule.keywords.some(kw => containsKeyword(text, kw))
}

/**
 * アジェンダアイテムのミッション整合度を計算する
 *
 * 対象テキスト:
 *   - agendaTitle          : アジェンダタイトル（必須）
 *   - discussionText       : ディスカッションログの結合テキスト（任意）
 *
 * アルゴリズム:
 *   1. 全ルールを照合し、マッチしたルールの weight を合計
 *   2. NORMALIZATION_BASE で割り 0–1 にクランプ
 *   3. THRESHOLDS でレベル判定
 */
export function scoreMissionAlignment(
  agendaTitle: string,
  discussionText = '',
): MissionAlignmentResult {
  const combinedText = `${agendaTitle} ${discussionText}`

  const matchedRules = KEYWORD_RULES.filter(rule =>
    ruleMatches(combinedText, rule)
  ).map(rule => ({ id: rule.id, label: rule.label, weight: rule.weight }))

  const rawScore = matchedRules.reduce((sum, r) => sum + r.weight, 0)
  const score    = Math.min(1.0, rawScore / NORMALIZATION_BASE)

  const level: AlignmentLevel =
    score >= THRESHOLDS.high   ? 'high'   :
    score >= THRESHOLDS.medium ? 'medium' : 'low'

  const reason = buildReason(level, matchedRules)

  return { score, level, matchedRules, reason }
}

/**
 * AgendaItem オブジェクトを直接渡してスコアを計算するヘルパー
 */
export function scoreAgendaItem(item: AgendaItem): MissionAlignmentResult {
  const discussionText = item.discussionLog
    .map(e => e.text)
    .join(' ')
  return scoreMissionAlignment(item.title, discussionText)
}

function buildReason(
  level: AlignmentLevel,
  matchedRules: { label: string }[],
): string {
  if (matchedRules.length === 0) {
    return 'ミッションキーワードとの一致なし'
  }
  const labels = matchedRules.map(r => r.label).join('・')
  const levelLabel = { high: '高', medium: '中', low: '低' }[level]
  return `整合度${levelLabel}（${labels}）`
}
