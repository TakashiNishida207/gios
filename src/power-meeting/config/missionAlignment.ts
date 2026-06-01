/**
 * ミッション整合度スコアリング設定
 *
 * MISSION_STATEMENT  : 組織のミッション文
 * KEYWORD_RULES      : アジェンダテキストと照合するルール群
 *
 * 各ルールは「このキーワードが含まれていればミッションへの貢献度 weight を加算」
 * という形式。weight の総和を NORMALIZATION_BASE で割り 0–1 に正規化する。
 */

export const MISSION_STATEMENT =
  '顧客の声をリアルタイムで意思決定に変え、GTM チームの実行速度を最大化する次世代プラットフォームを提供する'

export type KeywordRule = {
  id: string
  label: string
  keywords: string[]
  weight: number   // この rule がマッチしたとき加算される貢献度
}

/**
 * ルール定義
 * 合計 weight = 1.30 → NORMALIZATION_BASE = 0.55 で正規化
 * (顧客+リテンション の2ルールだけで HIGH に達する設計)
 */
export const KEYWORD_RULES: KeywordRule[] = [
  {
    id: 'customer',
    label: '顧客関連',
    keywords: ['顧客', 'ユーザー', 'カスタマー', 'クライアント', 'Corp', '企業', '担当者', 'エンドユーザー'],
    weight: 0.30,
  },
  {
    id: 'retention',
    label: 'リテンション・解約防止',
    keywords: ['解約', 'チャーン', 'churn', 'リテンション', '更新', '継続', 'リスク', '離脱', '防止'],
    weight: 0.25,
  },
  {
    id: 'cs',
    label: 'CS・サポート',
    keywords: ['CS', 'CSM', 'サポート', 'カスタマーサクセス', 'サービス品質', 'SLA', 'オンボーディング'],
    weight: 0.20,
  },
  {
    id: 'growth',
    label: '成長・収益',
    keywords: ['成長', 'ARR', 'MRR', '売上', '収益', '拡大', '獲得', 'LTV', '価格', 'プライシング', 'アップセル'],
    weight: 0.20,
  },
  {
    id: 'product',
    label: 'プロダクト価値',
    keywords: ['プロダクト', '機能', '改善', 'UX', 'UI', '体験', 'フィードバック', 'VoC', '要望', 'ロードマップ'],
    weight: 0.15,
  },
  {
    id: 'reliability',
    label: '技術・信頼性',
    keywords: ['障害', '技術', 'セキュリティ', 'SSO', 'パフォーマンス', '品質', 'インフラ', 'ETA', '解決', '根本', 'バグ', '修正'],
    weight: 0.10,
  },
  {
    id: 'strategy',
    label: '施策・戦略',
    keywords: ['施策', '対応', '戦略', 'GTM', 'キャンペーン', '提案', 'プラン', 'アクション', 'リカバリー'],
    weight: 0.10,
  },
]

/**
 * 正規化の基準値
 * 「顧客 (0.30) + リテンション (0.25) = 0.55」でほぼ HIGH になる設計
 */
export const NORMALIZATION_BASE = 0.55

/** スコアのしきい値 */
export const THRESHOLDS = {
  high:   0.65,   // ≥ 0.65 → green
  medium: 0.35,   // ≥ 0.35 → yellow
  // < 0.35 → red
} as const

export type AlignmentLevel = 'high' | 'medium' | 'low'
