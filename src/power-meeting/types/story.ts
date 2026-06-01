/**
 * StoryTab データモデル — V2.1新規
 * コミュニケーション戦略の管理と Voice影響Intelligence の可視化を担う。
 * 【重要】Story列（§11）= ミッション整合度スコア（自動計算、変更なし）
 *         Storyタブ（§16）= コミュニケーション戦略管理（本型）
 * 両者はデータモデルも責務も別であり、V2.1でも併存する。
 */

/** サブタブ対象Audience */
export type StoryAudience = 'customer' | 'market' | 'internal'

export type StoryStatus = 'draft' | 'review' | 'approved' | 'published'

export interface StoryIntelligence {
  /** AI生成のトーン推奨 */
  toneRecommendation: string
  /** リスク警告 */
  riskWarning?: string
  /** AI推論の確度 0-1 */
  confidence: number
  generatedAt: string
}

export interface StoryItem {
  id: string
  audience: StoryAudience
  title: string
  /** 何をどのトーンで伝えるか（テキスト管理のみ。配信は外部システムへ） */
  narrative: string
  /** Email / Slack / Status Page 等 */
  channel: string
  /** このStoryの構成に反映されているVoice IDs */
  linkedVoiceIds: string[]
  /** VoiceImpactIntelligence ID */
  voiceImpactIds: string[]
  intelligence?: StoryIntelligence
  status: StoryStatus
  /** コミュニケーションオーナー roleId */
  ownerRoleId: string
  agendaId?: string
}
