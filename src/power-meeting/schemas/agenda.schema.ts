import { z } from 'zod'

/** C-4: EXECUTION → PLANNING + HUMAN_EXEC + AI_EXEC 追加 */
export const PhaseSchema = z.enum([
  'IDLE',
  'KNOWLEDGE_SYNC',
  'PHASE1',
  'PHASE2',
  'PHASE3',
  'PLANNING',
  'HUMAN_EXEC',
  'AI_EXEC',
  'SYNC_BACK',
])

export const DiscussionEntrySchema = z.object({
  id: z.string(),
  speaker: z.string(),
  roleId: z.string(),
  ts: z.string(),
  text: z.string(),
  phase: PhaseSchema,
  replyTo: z.string().optional(),
  /** E-1: クロスアジェンダリンク */
  linkedAgendaIds: z.array(z.string()).optional(),
})

export const ReactionSchema = z.object({
  id: z.string(),
  emoji: z.enum(['👍', '⭐', '❓', '⚠️']),
  roleId: z.string(),
  ts: z.string(),
})

export const StanceSchema = z.enum(['agree', 'neutral', 'disagree'])

export const PositionSchema = z.object({
  roleId: z.string(),
  stance: StanceSchema,
  weightContribution: z.number().min(0).max(1),
  note: z.string().optional(),
  ts: z.string(),
})

export const AgendaItemStatusSchema = z.enum([
  'pending',
  'in_discussion',
  'converging',
  'aligned',
  'awaiting_exec',
  'decided',
  'parked',
])

export const AgendaItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  ownerRoleId: z.string(),
  timeBudgetMin: z.number().positive(),
  status: AgendaItemStatusSchema,
  discussionLog: z.array(DiscussionEntrySchema),
  reactions: z.array(ReactionSchema),
  positions: z.array(PositionSchema),
  parked: z.boolean(),
  parkedFrom: z.string().optional(),
  linkedVoiceIds: z.array(z.string()).optional(),
  linkedDecisionIds: z.array(z.string()).optional(),
  linkedInformationBlockIds: z.array(z.string()).optional(),
})

export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  weight: z.number().min(0).max(1),
})

export type AgendaItemInput = z.input<typeof AgendaItemSchema>
export type RoleInput = z.input<typeof RoleSchema>
