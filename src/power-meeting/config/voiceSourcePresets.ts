export type VoiceSourcePreset = {
  id: string
  label: string
  category: 'support' | 'crm' | 'knowledge' | 'collab' | 'recording' | 'email' | 'survey' | 'review' | 'nps' | 'custom'
  icon: string
  defaultMetadataKeys?: string[]
}

export const voiceSourcePresets: VoiceSourcePreset[] = [
  { id: 'google_form',        label: 'Google Forms',        category: 'survey',    icon: 'forms',      defaultMetadataKeys: ['form_id', 'response_id', 'submitted_at'] },
  { id: 'surveymonkey',       label: 'SurveyMonkey',        category: 'survey',    icon: 'survey',     defaultMetadataKeys: ['survey_id', 'response_id'] },
  { id: 'qualtrics',          label: 'Qualtrics',           category: 'survey',    icon: 'qualtrics',  defaultMetadataKeys: ['survey_id', 'response_id', 'distribution_id'] },
  { id: 'typeform',           label: 'Typeform',            category: 'survey',    icon: 'typeform',   defaultMetadataKeys: ['form_id', 'response_id'] },
  { id: 'app_store_reviews',  label: 'App Store Reviews',   category: 'review',    icon: 'apple',      defaultMetadataKeys: ['app_id', 'review_id', 'rating'] },
  { id: 'play_store_reviews', label: 'Google Play Reviews', category: 'review',    icon: 'android',    defaultMetadataKeys: ['app_id', 'review_id', 'rating'] },
  { id: 'g2',                 label: 'G2 Reviews',          category: 'review',    icon: 'g2',         defaultMetadataKeys: ['review_id', 'rating'] },
  { id: 'trustpilot',         label: 'Trustpilot',          category: 'review',    icon: 'trustpilot', defaultMetadataKeys: ['review_id', 'rating'] },
  { id: 'nps_tool',           label: 'NPS Tool',            category: 'nps',       icon: 'nps',        defaultMetadataKeys: ['campaign_id', 'response_id', 'score'] },
]

export function getPresetById(id: string): VoiceSourcePreset | undefined {
  return voiceSourcePresets.find(p => p.id === id)
}

export function getPresetsByCategory(category: VoiceSourcePreset['category']): VoiceSourcePreset[] {
  return voiceSourcePresets.filter(p => p.category === category)
}
