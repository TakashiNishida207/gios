/**
 * DecisionTab データモデル — V2.1拡張
 * V2.0では linkedDecisionIds のみで管理されていたが、V2.1で完全なエンティティとして定義。
 */

export type DecisionType = 'operational' | 'strategic'

export interface Alternative {
  id: string
  label: string
  /** AI推奨フラグ */
  recommended?: boolean
  /** 1-5 */
  impactScore: number
  /** 1-5 */
  riskScore: number
  /** 完了予定日 */
  eta?: string
  description: string
}

export interface VotingResult {
  agree: number
  neutral: number
  disagree: number
  /** 重み付き合意スコア §10準拠 */
  weightedScore: number
}

export type DecisionStatus = 'evaluating' | 'decided' | 'parked' | 'rejected'

export interface DecisionItem {
  id: string
  type: DecisionType
  title: string
  agendaId: string
  alternatives: Alternative[]
  /** VoiceImpactIntelligence IDs */
  voiceImpactIds: string[]
  status: DecisionStatus
  votingResult: VotingResult
}
