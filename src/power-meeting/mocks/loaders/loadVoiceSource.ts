import type { VoiceSource, VoiceItem } from '@pm/types/voice'
import { VoiceItemSchema } from '@pm/schemas/voice.schema'
import { z } from 'zod'

const fixtureMap: Record<VoiceSource, () => Promise<unknown>> = {
  zendesk:    () => import('../fixtures/voice-sources/zendesk-sample.json'),
  intercom:   () => import('../fixtures/voice-sources/intercom-sample.json'),
  jira:       () => import('../fixtures/voice-sources/jira-sample.json'),
  asana:      () => Promise.resolve([]),  // D-1: fixture未作成時は空配列
  salesforce: () => import('../fixtures/voice-sources/salesforce-sample.json'),
  hubspot:    () => import('../fixtures/voice-sources/hubspot-sample.json'),
  notion:     () => import('../fixtures/voice-sources/notion-sample.json'),
  slack:      () => import('../fixtures/voice-sources/slack-sample.json'),
  gong:       () => import('../fixtures/voice-sources/gong-sample.json'),
  email:      () => import('../fixtures/voice-sources/email-sample.json'),
  manual:     () => Promise.resolve([]),
  other:      () => Promise.resolve([]),
}

export async function loadVoiceSource(source: VoiceSource): Promise<VoiceItem[]> {
  const loader = fixtureMap[source]
  const raw = await loader()
  const data = Array.isArray(raw) ? raw : (raw as { default: unknown[] }).default ?? []
  return z.array(VoiceItemSchema).parse(data) as VoiceItem[]
}

export async function loadAllVoiceSources(sources: VoiceSource[] = Object.keys(fixtureMap) as VoiceSource[]): Promise<VoiceItem[]> {
  const results = await Promise.all(sources.map(s => loadVoiceSource(s)))
  return results.flat()
}
