/**
 * GrowthTab データモデル — V2.1新規
 * GHS（Growth Health Score）の管理と Voice影響Intelligence の可視化を担う。
 */

export type GrowthCategory = 'acquisition' | 'retention' | 'expansion' | 'churn'

export interface Comment {
  id: string
  roleId: string
  text: string
  ts: string
}

export interface GHSItem {
  id: string
  category: GrowthCategory
  /** meeting | agenda | global */
  scope: 'meeting' | 'agenda' | 'global'
  agendaId?: string
  title: string
  /** 0-100 */
  score: number
  trend: 'up' | 'down' | 'flat'
  previousScore: number
  comments: Comment[]
  /** VoiceImpactIntelligence ID */
  voiceImpactIds: string[]
  ownerRoleId: string
}
