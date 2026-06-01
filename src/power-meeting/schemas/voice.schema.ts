import { z } from 'zod'

export const VoiceSourceSchema = z.enum([
  'zendesk', 'intercom', 'jira', 'asana',  // D-1
  'salesforce', 'hubspot', 'notion',
  'slack', 'gong', 'email',
  'manual', 'other',
])

export const VoiceMetadataSchema = z.object({
  intercom: z.object({
    conversationId: z.string(),
    finInvolved: z.boolean(),
    finConfidence: z.number().min(0).max(1).optional(),
    finResolved: z.boolean().optional(),
    handoffReason: z.enum([
      'knowledge_gap',
      'confidence_threshold_unmet',
      'procedure_failed',
      'customer_requested_human',
    ]).optional(),
    proceduresUsed: z.array(z.string()).optional(),
  }).optional(),
  zendesk: z.object({
    ticketId: z.string(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']),
    status: z.string(),
  }).optional(),
  jira: z.object({
    issueKey: z.string(),
    type: z.string(),
    status: z.string(),
  }).optional(),
  /** D-1: Asana */
  asana: z.object({
    taskId: z.string(),
    taskName: z.string(),
    projectName: z.string(),
    status: z.enum(['pending', 'in_progress', 'completed']),
    assignee: z.string().optional(),
    dueDate: z.string().optional(),
  }).optional(),
  salesforce: z.object({
    recordType: z.enum(['Account', 'Opportunity', 'Case', 'Contact', 'Activity']),
    recordId: z.string(),
    stage: z.string().optional(),
    arr: z.number().optional(),
    ownerName: z.string().optional(),
  }).optional(),
  hubspot: z.object({
    recordType: z.enum(['Deal', 'Contact', 'Ticket', 'Conversation']),
    recordId: z.string(),
    pipeline: z.string().optional(),
    dealStage: z.string().optional(),
  }).optional(),
  notion: z.object({
    pageId: z.string(),
    databaseId: z.string().optional(),
    pageTitle: z.string(),
    lastEditedBy: z.string().optional(),
    lastEditedTs: z.string().optional(),
    parentDatabaseTitle: z.string().optional(),
    comments: z.array(z.object({
      author: z.string(),
      ts: z.string(),
      text: z.string(),
    })).optional(),
    blockCount: z.number().optional(),
    contentLength: z.number().optional(),
  }).optional(),
  slack: z.object({
    channel: z.string(),
    threadTs: z.string().optional(),
    permalink: z.string().optional(),
  }).optional(),
  gong: z.object({
    callId: z.string(),
    callTitle: z.string(),
    startTs: z.string(),
    durationSec: z.number(),
    speakerSide: z.enum(['rep', 'customer']),
  }).optional(),
  email: z.object({
    messageId: z.string(),
    subject: z.string(),
    threadCount: z.number(),
  }).optional(),
  other: z.object({
    externalSystem: z.string(),
    externalSystemId: z.string().optional(),
    externalUrl: z.string().optional(),
    customFields: z.record(z.string()).optional(),
  }).optional(),
})

export const VoiceItemSchema = z.object({
  id: z.string(),
  source: VoiceSourceSchema,
  sourceLabel: z.string().optional(),
  handler: z.object({
    name: z.string(),
    role: z.string().optional(),
    organization: z.string().optional(),
  }).optional(),
  speaker: z.object({
    name: z.string(),
    role: z.string().optional(),
    company: z.string().optional(),
  }),
  ts: z.string(),
  text: z.string(),
  textSummary: z.string().optional(),
  sentiment: z.enum(['advocacy', 'positive', 'neutral', 'concerned', 'negative', 'critical']).optional(),
  linkedAgendaIds: z.array(z.string()).optional(),
  incidentId: z.string().optional(),  // D-2
  metadata: VoiceMetadataSchema.optional(),
})

export type VoiceItemInput = z.input<typeof VoiceItemSchema>
