"use client"

import { useEffect, useState, Fragment } from 'react'
import { usePreferences } from '@/ui/preferences'
import { DiscussionCanvas } from './components/DiscussionCanvas'
import { VoiceTab } from './components/VoiceTab'
import { GrowthTab } from './components/GrowthTab/GrowthTab'
import { DecisionTab } from './components/DecisionTab/DecisionTab'
import { StoryTab } from './components/StoryTab/StoryTab'
import { PlanningTab } from './components/PlanningTab/PlanningTab'
import { HumanExecutionTab } from './components/HumanExecutionTab/HumanExecutionTab'
import { AIExecutionTab } from './components/AIExecutionTab/AIExecutionTab'
import { SyncBackTab } from './components/SyncBackTab/SyncBackTab'
import { AttendeePanel } from './components/AttendeePanel/AttendeePanel'
import { PermissionMatrixPanel } from './components/PermissionMatrix/PermissionMatrixPanel'
import { PhaseNavigator } from './components/PhaseNavigator'
import { AutoTransitionToast } from './components/PhaseNavigator/AutoTransitionToast'
import { useVoiceStore } from './stores/voiceStore'
import { useAgendaStore } from './stores/agendaStore'
import { useGrowthStore } from './stores/growthStore'
import { useDecisionStore } from './stores/decisionStore'
import { useStoryStore } from './stores/storyStore'
import { useImpactStore } from './stores/impactStore'
import { useAttendeeStore } from './stores/attendeeStore'
import { usePermissionStore } from './stores/permissionStore'
import { PHASE_TRANSITION_RULES, PHASE_ORDER, PHASE_LABELS, PHASE_LABELS_EN, getNextPhase } from './config/phaseTransitionRules'
import { checkPhaseConditions } from './utils/checkPhaseConditions'
import uc1Fixture from './mocks/fixtures/uc1-churn-risk-acme.json'
import uc2Fixture from './mocks/fixtures/uc2-api-gateway-incident.json'
import uc3Fixture from './mocks/fixtures/uc3-enterprise-upsell.json'
import uc4Fixture from './mocks/fixtures/uc4-pmf-feature-pivot.json'
import uc5Fixture from './mocks/fixtures/uc5-beachhead-vertical.json'
import uc6Fixture from './mocks/fixtures/uc6-pricing-emea.json'
import type { MeetingBundle, Phase } from './types/agenda'
import type { VoiceItem } from './types/voice'
import type { GHSItem } from './types/growth'
import type { DecisionItem } from './types/decision'
import type { StoryItem } from './types/story'
import type { VoiceImpactIntelligence } from './types/impact'
import { useGDIOSStore } from '@/store/store'
import { gdiosToMeetingBundle } from './utils/gdiosToMeetingBundle'
import { useExecutionStore } from './stores/executionStore'

type BundleId = 'gdios-live' | 'uc1' | 'uc2' | 'uc3' | 'uc4' | 'uc5' | 'uc6'
const BUNDLES: Record<BundleId, { label: string; fixture: unknown }> = {
  'gdios-live': { label: '🔗 GDIOS連携（現在の顧客データ）', fixture: null },
  uc1: { label: 'UC1: チャーンリスク対応 (ACME)',          fixture: uc1Fixture },
  uc2: { label: 'UC2: API障害広域対応 (26社)',              fixture: uc2Fixture },
  uc3: { label: 'UC3: アップセル戦略確定 (ACME $420K)',    fixture: uc3Fixture },
  uc4: { label: 'UC4: コア機能ピボット判断 (PMF探索)',     fixture: uc4Fixture },
  uc5: { label: 'UC5: Beachhead Vertical集中決定',         fixture: uc5Fixture },
  uc6: { label: 'UC6: Pricing改定 + EMEA追出 (Series C)', fixture: uc6Fixture },
}

type Tab = 'canvas' | 'voice' | 'growth' | 'decision' | 'story' | 'planning' | 'human-exec' | 'ai-exec' | 'sync-back'

const PHASE_MAIN_TAB: Record<Phase, Tab[]> = {
  IDLE:           [],
  KNOWLEDGE_SYNC: ['voice'],
  PHASE1:         ['canvas'],
  PHASE2:         ['canvas', 'growth'],
  PHASE3:         ['decision'],
  PLANNING:       ['planning', 'story'],
  HUMAN_EXEC:     ['human-exec'],
  AI_EXEC:        ['ai-exec'],
  SYNC_BACK:      ['sync-back'],
}

const TABS: { id: Tab; ja: string; en: string }[] = [
  { id: 'canvas',     ja: 'ディスカッションキャンバス', en: 'Discussion Canvas' },
  { id: 'voice',      ja: 'ボイス',                     en: 'Voice'             },
  { id: 'growth',     ja: 'グロース',                   en: 'Growth'            },
  { id: 'decision',   ja: 'デシジョン',                 en: 'Decision'          },
  { id: 'story',      ja: 'ストーリー',                 en: 'Story'             },
  { id: 'planning',   ja: '実行計画',                   en: 'Planning'          },
  { id: 'human-exec', ja: '人的実行',                   en: 'Human Exec'        },
  { id: 'ai-exec',    ja: 'AI実行',                     en: 'AI Exec'           },
  { id: 'sync-back',  ja: '外部システム同期',           en: 'External Sync'     },
]

export default function PowerMeetApp() {
  const [activeTab, setActiveTab] = useState<Tab>('canvas')
  const [showPermissions, setShowPermissions] = useState(false)
  const [showPhaseNav, setShowPhaseNav] = useState(false)
  const [autoToastDismissed, setAutoToastDismissed] = useState(false)
  const [activeBundleId, setActiveBundleId] = useState<BundleId>('uc1')

  // GDIOSテーマ・言語同期
  const { theme, lang } = usePreferences()

  // GDIOS 連携用: 現在のストア状態を読む
  const gdiosFlow         = useGDIOSStore((s) => s.flow)
  const gdiosIntelligence = useGDIOSStore((s) => s.intelligence)

  const { setItems: setVoiceItems }   = useVoiceStore()
  const { setItems: setAgendaItems, setRoles, setPhase } = useAgendaStore()
  const { setItems: setGrowthItems }   = useGrowthStore()
  const { setItems: setDecisionItems } = useDecisionStore()
  const { setItems: setStoryItems }    = useStoryStore()
  const { setItems: setImpactItems }     = useImpactStore()
  const { setHumanTasks, setAITasks }   = useExecutionStore()
  const { initFromRoles }                  = useAttendeeStore()
  const { initFromRoles: initPermissions } = usePermissionStore()

  useEffect(() => {
    if (activeBundleId === 'gdios-live') {
      // GDIOS連携モード: 現在のストアデータをリアルタイムでマッピング
      const { bundle, voices, ghsItems, decisionItems, storyItems, humanTasks, aiTasks } =
        gdiosToMeetingBundle(gdiosFlow, gdiosIntelligence)
      setAgendaItems(bundle.agendaItems)
      setRoles(bundle.roles)
      setPhase(bundle.phase)
      setVoiceItems(voices)
      setGrowthItems(ghsItems)
      setDecisionItems(decisionItems)
      setStoryItems(storyItems)
      setHumanTasks(humanTasks)
      setAITasks(aiTasks)
      initFromRoles(bundle.roles)
      initPermissions(bundle.roles)
      return
    }

    // 固定フィクスチャモード (UC1〜UC6)
    const bundle = BUNDLES[activeBundleId].fixture as unknown as MeetingBundle & {
      informationBlocks: unknown
      voices: VoiceItem[]
      ghsItems?: GHSItem[]
      decisionItems?: DecisionItem[]
      storyItems?: StoryItem[]
      voiceImpactIntelligence?: VoiceImpactIntelligence[]
    }
    setAgendaItems(bundle.agendaItems)
    setRoles(bundle.roles)
    setPhase(bundle.phase)
    setVoiceItems(bundle.voices)
    if (bundle.ghsItems)                setGrowthItems(bundle.ghsItems)
    if (bundle.decisionItems)           setDecisionItems(bundle.decisionItems)
    if (bundle.storyItems)              setStoryItems(bundle.storyItems)
    if (bundle.voiceImpactIntelligence) setImpactItems(bundle.voiceImpactIntelligence)
    initFromRoles(bundle.roles)
    initPermissions(bundle.roles)
  }, [
    activeBundleId, gdiosFlow, gdiosIntelligence,
    setAgendaItems, setRoles, setPhase,
    setVoiceItems, setGrowthItems, setDecisionItems, setStoryItems, setImpactItems,
    setHumanTasks, setAITasks,
    initFromRoles, initPermissions,
  ])

  const { items: agendaItems, currentPhase, roles, advancePhase } = useAgendaStore()
  const { items: voiceItems } = useVoiceStore()
  const { items: decisionItems } = useDecisionStore()
  const { items: storyItems } = useStoryStore()

  const currentRole = roles[0] ?? { id: 'role-ceo', name: 'CEO', weight: 0.3 }
  const mainTabs = PHASE_MAIN_TAB[currentPhase] ?? []

  const nextPhase = getNextPhase(currentPhase)
  const autoRule = nextPhase ? PHASE_TRANSITION_RULES[currentPhase] : undefined
  const storyApprovedCount = storyItems.filter(s => s.status === 'approved' || s.status === 'published').length
  const autoCheckResult = autoRule
    ? checkPhaseConditions(autoRule, { voiceCount: voiceItems.length, agendaItems, decisionCount: decisionItems.length, storyApprovedCount })
    : null
  const showAutoToast =
    !autoToastDismissed &&
    !showPhaseNav &&
    autoCheckResult?.readyForAuto === true

  return (
    <div className="pm-root flex flex-col w-full bg-gray-50 overflow-hidden" style={{ flex: 1, minHeight: 0 }} data-pm-theme={theme}>

      {/* コントロールバー: フェーズバー(左) + UCセレクター・ロール・権限(右) */}
      <div style={{
        display: 'flex', flexDirection: 'row', flexWrap: 'nowrap',
        alignItems: 'center', gap: 8, padding: '6px 12px',
        background: 'var(--pm-ctrl-bg, #fff)', borderBottom: '1px solid #e5e7eb',
        flexShrink: 0, width: '100%', minWidth: 0, overflow: 'hidden',
      }}>

        {/* フェーズバー */}
        <div style={{
          display: 'flex', flexDirection: 'row', flexWrap: 'nowrap',
          alignItems: 'center', flex: 1, minWidth: 0,
          overflowX: 'auto', overflowY: 'hidden',
        }}>
          {PHASE_ORDER.map((phase, idx) => {
            const phaseIdx   = PHASE_ORDER.indexOf(phase)
            const currentIdx = PHASE_ORDER.indexOf(currentPhase)
            const isCurrent  = phase === currentPhase
            const isPast     = phaseIdx < currentIdx
            const phaseLabel = lang === 'ja' ? PHASE_LABELS[phase] : PHASE_LABELS_EN[phase]
            return (
              <Fragment key={phase}>
                {idx > 0 && (
                  <span style={{ color: '#d1d5db', fontSize: 10, padding: '0 2px', flexShrink: 0, whiteSpace: 'nowrap' }}>›</span>
                )}
                {isCurrent ? (
                  <button
                    onClick={() => { setShowPhaseNav(true); setAutoToastDismissed(false) }}
                    style={{
                      fontSize: 11, fontWeight: 600, background: '#eff6ff', color: '#2563eb',
                      padding: '2px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
                      flexShrink: 0, whiteSpace: 'nowrap', lineHeight: 1.4,
                    }}
                    title={lang === 'ja' ? 'フェーズナビゲータを開く' : 'Open Phase Navigator'}
                  >
                    {phaseLabel}
                  </button>
                ) : (
                  <span style={{
                    fontSize: 10, padding: '2px 6px', borderRadius: 4,
                    flexShrink: 0, whiteSpace: 'nowrap', lineHeight: 1.4,
                    color: isPast ? '#9ca3af' : '#d1d5db',
                  }}>
                    {phaseLabel}
                  </span>
                )}
              </Fragment>
            )
          })}
        </div>

        {/* 右端: ロール + UCセレクター + 権限ボタン */}
        <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0, whiteSpace: 'nowrap' }}>{currentRole.name}</span>

        <select
          value={activeBundleId}
          onChange={e => {
            setActiveBundleId(e.target.value as BundleId)
            setActiveTab('canvas')
            setAutoToastDismissed(false)
            setShowPhaseNav(false)
          }}
          style={{
            fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 4,
            padding: '4px 8px', color: '#4b5563', background: 'inherit',
            cursor: 'pointer', flexShrink: 0, maxWidth: 240,
          }}
          title="ミーティングを切り替え"
        >
          {(Object.entries(BUNDLES) as [BundleId, { label: string }][]).map(([id, b]) => (
            <option key={id} value={id}>{b.label}</option>
          ))}
        </select>

        <button
          onClick={() => setShowPermissions(true)}
          style={{
            fontSize: 12, padding: '4px 8px', borderRadius: 4,
            border: '1px solid #e5e7eb', color: '#6b7280', background: 'inherit',
            cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
          }}
          title="権限マトリクスを表示"
        >
          🔐 権限
        </button>
      </div>

      {/* 権限マトリクスモーダル */}
      {showPermissions && (
        <PermissionMatrixPanel
          currentRoleId={currentRole.id}
          onClose={() => setShowPermissions(false)}
        />
      )}

      {/* フェーズナビゲータ */}
      {showPhaseNav && (
        <PhaseNavigator
          currentRoleId={currentRole.id}
          onClose={() => setShowPhaseNav(false)}
        />
      )}

      {/* 自動遷移トースト */}
      {showAutoToast && nextPhase && autoRule && (
        <AutoTransitionToast
          toPhase={nextPhase}
          delaySeconds={autoRule.autoDelaySeconds}
          onConfirm={() => {
            advancePhase(nextPhase, 'auto', currentRole.id)
            setAutoToastDismissed(true)
          }}
          onDismiss={() => setAutoToastDismissed(true)}
        />
      )}

      {/* タブナビゲーション */}
      <nav style={{
        display: 'flex', flexDirection: 'row', flexWrap: 'nowrap',
        gap: 4, padding: '0 16px', flexShrink: 0, width: '100%',
        background: 'var(--pm-ctrl-bg, #fff)', borderBottom: '1px solid #e5e7eb',
        overflowX: 'auto', overflowY: 'hidden',
      }}>
        {TABS.map(tab => {
          const isMain = mainTabs.includes(tab.id)
          const tabLabel = lang === 'ja' ? tab.ja : tab.en
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative text-sm px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tabLabel}
              {isMain && (
                <span
                  className="absolute top-1.5 right-1 w-1.5 h-1.5 rounded-full bg-green-500"
                  title={`${lang === 'ja' ? PHASE_LABELS[currentPhase] : PHASE_LABELS_EN[currentPhase]} のフォーカスタブ`}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* 参加者管理パネル */}
      <AttendeePanel />

      {/* コンテンツ */}
      <main style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {activeTab === 'canvas' && (
          <DiscussionCanvas
            agendaItems={agendaItems}
            voiceItems={voiceItems}
            phase={currentPhase}
            currentRoleId={currentRole.id}
            currentRoleName={currentRole.name}
          />
        )}
        {activeTab === 'voice'      && <VoiceTab />}
        {activeTab === 'growth'     && <GrowthTab />}
        {activeTab === 'decision'   && <DecisionTab />}
        {activeTab === 'story'      && <StoryTab />}
        {activeTab === 'planning'   && <PlanningTab />}
        {activeTab === 'human-exec' && <HumanExecutionTab />}
        {activeTab === 'ai-exec'    && <AIExecutionTab />}
        {activeTab === 'sync-back'  && <SyncBackTab />}
      </main>
    </div>
  )
}
