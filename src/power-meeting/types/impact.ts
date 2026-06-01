/**
 * VoiceImpactIntelligence — V2.1新規
 * Voice 1件が Growth / Decision / Story の各ターゲットに与える影響を表すエンティティ。
 * ImpactMapModal の中核データ。
 */
export interface VoiceImpactIntelligence {
  id: string
  voiceId: string
  targetDomain: 'growth' | 'decision' | 'story'
  targetItemId: string
  impactLevel: 'high' | 'medium' | 'low'
  impactDirection: 'positive' | 'negative' | 'neutral'
  /** AI生成の説明文 */
  reasoning: string
  /** AI推論の確度 0-1 */
  confidence: number
  /** ISO 8601 */
  generatedAt: string
  generatedBy: 'auto' | 'manual' | 'hybrid'
}
