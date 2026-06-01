export type VoiceSource =
  | 'zendesk' | 'intercom' | 'jira' | 'asana'  // D-1
  | 'salesforce' | 'hubspot' | 'notion'
  | 'slack' | 'gong' | 'email'
  | 'manual' | 'other'

export type VoiceItem = {
  id: string
  source: VoiceSource
  sourceLabel?: string
  /** 社内担当者 — Sophia Project 側でこの情報を受け取った・記録した人 */
  handler?: { name: string; role?: string; organization?: string }
  /** 発言者 — 実際に声を発した人（顧客 or 社内） */
  speaker: { name: string; role?: string; company?: string }
  ts: string
  text: string
  textSummary?: string
  /** D-2: 同一インシデントのグルーピングID */
  incidentId?: string
  /**
   * センチメント分類（6段階）
   *
   * advocacy  — 推薦・絶賛: NPS推薦者、強い肯定評価、口コミ期待
   * positive  — 好意的: 満足・概ねポジティブな評価
   * neutral   — 中立: 情報共有のみ・感情シグナルなし
   * concerned — 懸念あり: 軽微な不満・機能要望・条件付き評価
   * negative  — 否定的: 明確な不満・クレーム
   * critical  — 要緊急対応: 解約リスク・エスカレーション・SLA違反
   */
  sentiment?: 'advocacy' | 'positive' | 'neutral' | 'concerned' | 'negative' | 'critical'
  linkedAgendaIds?: string[]
  metadata?: VoiceMetadata
}

export type VoiceMetadata = {
  intercom?: {
    conversationId: string
    finInvolved: boolean
    finConfidence?: number
    finResolved?: boolean
    handoffReason?: 'knowledge_gap' | 'confidence_threshold_unmet' | 'procedure_failed' | 'customer_requested_human'
    proceduresUsed?: string[]
  }
  zendesk?: { ticketId: string; priority: 'low' | 'normal' | 'high' | 'urgent'; status: string }
  jira?: { issueKey: string; type: string; status: string }
  salesforce?: {
    recordType: 'Account' | 'Opportunity' | 'Case' | 'Contact' | 'Activity'
    recordId: string
    stage?: string
    arr?: number
    ownerName?: string
  }
  hubspot?: {
    recordType: 'Deal' | 'Contact' | 'Ticket' | 'Conversation'
    recordId: string
    pipeline?: string
    dealStage?: string
  }
  notion?: {
    pageId: string
    databaseId?: string
    pageTitle: string
    lastEditedBy?: string
    lastEditedTs?: string
    parentDatabaseTitle?: string
    comments?: { author: string; ts: string; text: string }[]
    blockCount?: number
    contentLength?: number
  }
  slack?: { channel: string; threadTs?: string; permalink?: string }
  gong?: {
    callId: string
    callTitle: string
    startTs: string
    durationSec: number
    speakerSide: 'rep' | 'customer'
  }
  email?: { messageId: string; subject: string; threadCount: number }
  /** D-1: Asana タスク情報 */
  asana?: {
    taskId: string
    taskName: string
    projectName: string
    status: 'pending' | 'in_progress' | 'completed'
    assignee?: string
    dueDate?: string
  }
  other?: {
    externalSystem: string
    externalSystemId?: string
    externalUrl?: string
    customFields?: Record<string, string>
  }
}
