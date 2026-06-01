"use client"

import { useState } from 'react'
import type { VoiceItem } from '@pm/types/voice'
import { useImpactStore } from '@pm/stores/impactStore'
import { ImpactMapModal } from './ImpactMapModal'

type Props = {
  item: VoiceItem
  compact?: boolean
}

// ① タイムスタンプ
function Timestamp({ ts, compact }: { ts: string; compact: boolean }) {
  const d = new Date(ts)
  const date = d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  return (
    <span className="text-xs text-gray-400 whitespace-nowrap tabular-nums">
      {compact ? date : `${date} ${time}`}
    </span>
  )
}

// ② システム名 / チャネル
const SOURCE_LABELS: Record<string, string> = {
  zendesk: 'Zendesk', intercom: 'Intercom · Fin', jira: 'Jira', asana: 'Asana',
  salesforce: 'Salesforce', hubspot: 'HubSpot', notion: 'Notion',
  slack: 'Slack', gong: 'Gong', email: 'Email', manual: 'Manual', other: 'Other',
}
const SOURCE_COLORS: Record<string, string> = {
  zendesk:    'bg-green-50  border-green-200',
  intercom:   'bg-blue-50   border-blue-200',
  jira:       'bg-indigo-50 border-indigo-200',
  asana:      'bg-pink-50   border-pink-200',
  salesforce: 'bg-sky-50    border-sky-200',
  hubspot:    'bg-orange-50 border-orange-200',
  notion:     'bg-gray-50   border-gray-200',
  slack:      'bg-purple-50 border-purple-200',
  gong:       'bg-red-50    border-red-200',
  email:      'bg-yellow-50 border-yellow-200',
  manual:     'bg-white     border-gray-200',
  other:      'bg-white     border-gray-200',
}
const SOURCE_BADGE_COLORS: Record<string, string> = {
  zendesk: 'bg-green-100 text-green-700', intercom: 'bg-blue-100 text-blue-700',
  jira: 'bg-indigo-100 text-indigo-700', asana: 'bg-pink-100 text-pink-700',
  salesforce: 'bg-sky-100 text-sky-700',
  hubspot: 'bg-orange-100 text-orange-700', notion: 'bg-gray-200 text-gray-700',
  slack: 'bg-purple-100 text-purple-700', gong: 'bg-red-100 text-red-700',
  email: 'bg-yellow-100 text-yellow-700', manual: 'bg-gray-100 text-gray-600',
  other: 'bg-gray-100 text-gray-600',
}
/** ② ソースバッジ — ホバーツールチップ定義 */
const SOURCE_TOOLTIPS: Record<string, string> = {
  zendesk:    'ZendeskチケットからのVoC — 顧客サポート問い合わせ・インシデント記録',
  intercom:   'Intercom会話からのVoC — Fin AIと担当者によるサポートセッション',
  jira:       'JiraチケットからのVoC — 機能要望・バグ報告・タスク管理',
  asana:      'AsanaタスクからのVoC — プロジェクト管理・アクションアイテム追跡',
  salesforce: 'SalesforceレコードからのVoC — Case/Opportunity/Activity等',
  hubspot:    'HubSpotレコードからのVoC — Deal/Contact/Conversation等',
  notion:     'NotionページからのVoC — 社内ドキュメント・議事録・コメント',
  slack:      'SlackメッセージからのVoC — チャンネル投稿・スレッド',
  gong:       'Gong通話録音からのVoC — 商談コール・CSコール転写テキスト',
  email:      'メールスレッドからのVoC — 顧客・担当者間のメールやりとり',
  manual:     '手動登録VoC — CSM/AEが直接入力・記録した顧客の声',
  other:      '外部システムからのVoC',
}
/** channelSub（レコード種別）のツールチップ */
const SF_RECORD_TOOLTIPS: Record<string, string> = {
  Case:        'Salesforce Case — 顧客からのサポート問い合わせ・インシデント',
  Opportunity: 'Salesforce Opportunity — 商談記録・フェーズ管理',
  Account:     'Salesforce Account — 顧客企業情報',
  Contact:     'Salesforce Contact — 個人連絡先情報',
  Activity:    'Salesforce Activity — 電話・会議・ToDoの活動記録',
}
const HS_RECORD_TOOLTIPS: Record<string, string> = {
  Deal:         'HubSpot Deal — 商談・ディールパイプライン',
  Contact:      'HubSpot Contact — 個人連絡先',
  Ticket:       'HubSpot Ticket — サポートチケット',
  Conversation: 'HubSpot Conversation — チャット・メール会話',
}
const MOCK_SOURCES: string[] = ['salesforce', 'hubspot']

function ChannelBadge({ item }: { item: VoiceItem }) {
  const label = item.sourceLabel ?? SOURCE_LABELS[item.source] ?? item.source
  const badgeColor = SOURCE_BADGE_COLORS[item.source] ?? 'bg-gray-100 text-gray-600'
  const sourceTooltip = SOURCE_TOOLTIPS[item.source] ?? item.source
  const isMock = MOCK_SOURCES.includes(item.source)

  // チャネル補足（レコード種別など）— テキストとツールチップをペアで返す
  const channelSub = (() => {
    const m = item.metadata
    if (m?.salesforce?.recordType) return {
      text: m.salesforce.recordType,
      title: SF_RECORD_TOOLTIPS[m.salesforce.recordType] ?? m.salesforce.recordType,
    }
    if (m?.hubspot?.recordType) return {
      text: m.hubspot.recordType,
      title: HS_RECORD_TOOLTIPS[m.hubspot.recordType] ?? m.hubspot.recordType,
    }
    if (m?.zendesk?.status) return {
      text: `Ticket · ${m.zendesk.priority}`,
      title: `Zendesk チケット — ステータス: ${m.zendesk.status} / 優先度: ${m.zendesk.priority}`,
    }
    if (m?.jira?.type) return {
      text: m.jira.type,
      title: `Jira ${m.jira.type} — ステータス: ${m.jira.status}`,
    }
    if (m?.slack?.channel) return {
      text: m.slack.channel,
      title: `Slack チャンネル: ${m.slack.channel}`,
    }
    if (m?.gong?.callTitle) return {
      text: 'Call',
      title: `Gong コール録音: ${m.gong.callTitle}`,
    }
    if (m?.email?.subject) return {
      text: 'Email',
      title: `メール件名: ${m.email.subject}`,
    }
    return null
  })()

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span
        className={`text-xs font-semibold px-1.5 py-0.5 rounded ${badgeColor}`}
        title={sourceTooltip}
      >
        {label}
      </span>
      {channelSub && (
        <span className="text-xs text-gray-500" title={channelSub.title}>
          {channelSub.text}
        </span>
      )}
      {isMock && (
        <span className="text-xs text-gray-300 italic" title="モックデータ — 本番APIには未接続">
          mock
        </span>
      )}
    </div>
  )
}

// ③ 社内担当者
function HandlerRow({ handler }: { handler: NonNullable<VoiceItem['handler']> }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-gray-400 shrink-0">担当:</span>
      <span className="font-medium text-gray-600">{handler.name}</span>
      {handler.role && <span className="text-gray-400">（{handler.role}）</span>}
      {handler.organization && (
        <span className="text-gray-300">· {handler.organization}</span>
      )}
    </div>
  )
}

// ④ 発言者
function SpeakerRow({ speaker, isCustomer }: { speaker: VoiceItem['speaker']; isCustomer: boolean }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-gray-400 shrink-0">発言者:</span>
      <span className="font-semibold text-gray-700">{speaker.name}</span>
      {speaker.role && <span className="text-gray-400">（{speaker.role}）</span>}
      {speaker.company && <span className="text-gray-500">· {speaker.company}</span>}
      {isCustomer && (
        <span
          className="ml-1 text-xs bg-amber-50 text-amber-600 border border-amber-200 px-1 py-0.5 rounded-sm leading-none"
          title="発言者がクライアント・エンドユーザーと判定されました（Sophia Project社外）"
        >
          顧客
        </span>
      )}
    </div>
  )
}

// センチメント設定 — 6段階仕様
type SentimentLevel = 'advocacy' | 'positive' | 'neutral' | 'concerned' | 'negative' | 'critical'

const SENTIMENT_CONFIG: Record<SentimentLevel, {
  label: string
  badge: string   // badge 外枠・背景・テキスト色
  dot: string     // 左端ドット色
  bold?: boolean  // 太字フラグ（高緊急度）
  ring?: string   // 追加リング（critical のみ）
  title: string   // ホバーツールチップ
}> = {
  advocacy: {
    label: '推薦・絶賛',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dot:   'bg-emerald-500',
    bold:  true,
    title: 'NPS推薦者・強い肯定評価',
  },
  positive: {
    label: '好意的',
    badge: 'bg-green-50 text-green-700 border border-green-200',
    dot:   'bg-green-500',
    title: '満足・概ねポジティブな評価',
  },
  neutral: {
    label: '中立',
    badge: 'bg-gray-100 text-gray-500 border border-gray-200',
    dot:   'bg-gray-400',
    title: '情報共有のみ・感情シグナルなし',
  },
  concerned: {
    label: '懸念あり',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot:   'bg-amber-400',
    title: '軽微な不満・機能要望・条件付き評価',
  },
  negative: {
    label: '否定的',
    badge: 'bg-orange-50 text-orange-700 border border-orange-200',
    dot:   'bg-orange-500',
    title: '明確な不満・クレーム',
  },
  critical: {
    label: '要緊急対応',
    badge: 'bg-red-50 text-red-700 border border-red-300',
    dot:   'bg-red-500',
    bold:  true,
    ring:  'ring-1 ring-red-300',
    title: '解約リスク・エスカレーション・SLA違反',
  },
}

function SentimentBadge({ sentiment }: { sentiment?: SentimentLevel | string }) {
  if (!sentiment) return null
  const cfg = SENTIMENT_CONFIG[sentiment as SentimentLevel]
  if (!cfg) return null
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${cfg.badge} ${cfg.ring ?? ''}`}
      title={cfg.title}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      <span className={cfg.bold ? 'font-semibold' : ''}>{cfg.label}</span>
    </span>
  )
}

/** Intercom ハンドオフ理由ツールチップ */
const HANDOFF_REASON_TOOLTIPS: Record<string, string> = {
  knowledge_gap:              '知識不足 — Fin AIの学習データにない質問',
  confidence_threshold_unmet: '確信度不足 — Fin AIの回答スコアが閾値未達',
  procedure_failed:           '手順失敗 — Fin AIのガイドフローが完了できず',
  customer_requested_human:   '顧客希望 — 人間担当者への切り替えを顧客が要求',
}

// ソース別追加情報
function SourceExtras({ item }: { item: VoiceItem }) {
  const m = item.metadata
  if (!m) return null

  // D-1: Asana タスク情報
  if (m.asana) {
    const { taskName, projectName, status, assignee, dueDate } = m.asana
    const statusConfig = {
      pending:     { label: '未着手',    color: 'bg-gray-100 text-gray-600' },
      in_progress: { label: '進行中',    color: 'bg-pink-100 text-pink-700' },
      completed:   { label: '完了',      color: 'bg-green-100 text-green-700' },
    }[status] ?? { label: status, color: 'bg-gray-100 text-gray-600' }
    return (
      <div className="flex flex-wrap gap-1.5 mt-1 items-center">
        <span
          className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusConfig.color}`}
          title={`Asana プロジェクト: ${projectName}`}
        >
          {statusConfig.label}
        </span>
        <span className="text-xs text-gray-500" title={`タスク名: ${taskName}`}>
          {projectName}
        </span>
        {assignee && (
          <span className="text-xs text-gray-400" title={`担当者: ${assignee}`}>
            @{assignee}
          </span>
        )}
        {dueDate && (
          <span className="text-xs text-gray-400" title={`期日: ${dueDate}`}>
            期日: {dueDate}
          </span>
        )}
      </div>
    )
  }

  if (m.intercom) {
    const { finResolved, finConfidence, handoffReason } = m.intercom
    return (
      <div className="flex items-center gap-2 flex-wrap mt-1">
        <span
          className={`text-xs px-1.5 py-0.5 rounded font-medium ${finResolved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
          title={finResolved
            ? 'Fin AIが自律的に解決 — 人間担当者へのハンドオフなし'
            : 'Fin AIが解決できず人間担当者にエスカレーション'}
        >
          Fin {finResolved ? '解決済' : 'ハンドオフ'}
        </span>
        {finConfidence !== undefined && (
          <div
            className="flex items-center gap-1"
            title={`Fin AI 解決確信度スコア: ${Math.round(finConfidence * 100)}% — 閾値未達でハンドオフが発生`}
          >
            <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${finConfidence * 100}%` }} />
            </div>
            <span className="text-xs text-gray-500">{Math.round(finConfidence * 100)}%</span>
          </div>
        )}
        {handoffReason && (
          <span
            className="text-xs text-gray-400"
            title={HANDOFF_REASON_TOOLTIPS[handoffReason] ?? handoffReason}
          >
            {handoffReason.replace(/_/g, ' ')}
          </span>
        )}
      </div>
    )
  }
  if (m.salesforce) {
    const { stage, arr, ownerName } = m.salesforce
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {stage && (
          <span className="text-xs text-gray-500" title={`Salesforce ステージ: ${stage}`}>
            {stage}
          </span>
        )}
        {arr && (
          <span
            className="text-xs font-medium text-sky-700"
            title={`Annual Recurring Revenue（年間定期収益）: $${arr.toLocaleString()}`}
          >
            ${(arr / 1000).toFixed(0)}K ARR
          </span>
        )}
        {ownerName && (
          <span className="text-xs text-gray-400" title={`Salesforce レコードオーナー（AE）: ${ownerName}`}>
            AE: {ownerName}
          </span>
        )}
      </div>
    )
  }
  if (m.hubspot) {
    const stages = ['Prospecting','Qualification','Demo Scheduled','Proposal/Quote','Negotiation','Contract Sent','Closed Won']
    const idx = m.hubspot.dealStage ? stages.indexOf(m.hubspot.dealStage) : -1
    return (
      <div className="flex flex-wrap gap-1 mt-1 items-center">
        {m.hubspot.pipeline && (
          <span className="text-xs text-gray-500" title={`HubSpot パイプライン: ${m.hubspot.pipeline}`}>
            {m.hubspot.pipeline}
          </span>
        )}
        {idx >= 0 && (
          <div
            className="flex gap-0.5"
            title={`HubSpot ディールステージ (${idx + 1}/${stages.length}): ${m.hubspot.dealStage}`}
          >
            {stages.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= idx ? 'bg-orange-400' : 'bg-gray-200'}`} />
            ))}
          </div>
        )}
        {m.hubspot.dealStage && (
          <span className="text-xs text-gray-400" title={`HubSpot 現在ステージ: ${m.hubspot.dealStage}`}>
            {m.hubspot.dealStage}
          </span>
        )}
      </div>
    )
  }
  if (m.notion) {
    return (
      <div className="flex flex-wrap gap-1 mt-1 items-center">
        {m.notion.parentDatabaseTitle && (
          <span
            className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border"
            title={`Notion データベース: ${m.notion.parentDatabaseTitle}`}
          >
            {m.notion.parentDatabaseTitle}
          </span>
        )}
        {m.notion.lastEditedBy && (
          <span className="text-xs text-gray-400" title={`最終編集者: ${m.notion.lastEditedBy}`}>
            最終編集: {m.notion.lastEditedBy}
          </span>
        )}
        {m.notion.blockCount && (
          <span className="text-xs text-gray-400" title={`ページ内ブロック数: ${m.notion.blockCount}`}>
            {m.notion.blockCount} blocks
          </span>
        )}
      </div>
    )
  }
  if (m.slack) {
    return (
      <div className="flex gap-1 mt-1 items-center">
        <span className="text-xs font-mono text-purple-600" title={`Slack チャンネル: ${m.slack.channel}`}>
          {m.slack.channel}
        </span>
        {m.slack.permalink && (
          <a
            href={m.slack.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 underline"
            title="Slack でスレッドを開く"
          >
            開く
          </a>
        )}
      </div>
    )
  }
  if (m.gong) {
    const mins = Math.floor(m.gong.durationSec / 60)
    const secs = m.gong.durationSec % 60
    return (
      <div className="flex gap-2 mt-1 items-center">
        <button
          className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded hover:bg-red-100"
          title={`Gong コール録音を再生: ${m.gong.callTitle}`}
        >
          ▶ 再生(モック)
        </button>
        <span className="text-xs text-gray-500" title={`通話時間: ${mins}分${secs}秒`}>
          {mins}分
        </span>
        <span
          className="text-xs text-gray-400"
          title={m.gong.speakerSide === 'rep' ? '発言者: 社内担当者（rep）side' : '発言者: 顧客（customer）side'}
        >
          {m.gong.speakerSide === 'rep' ? '社内' : '顧客'} side
        </span>
      </div>
    )
  }
  if (m.other) {
    return (
      <div className="flex gap-1 mt-1 items-center">
        <span className="text-xs text-gray-500" title={`外部システム: ${m.other.externalSystem}`}>
          {m.other.externalSystem}
        </span>
        {m.other.externalUrl && (
          <a
            href={m.other.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500"
            title="外部システムで開く"
          >
            ↗
          </a>
        )}
      </div>
    )
  }
  return null
}

// 発言者が顧客かどうかを判定
function isCustomerSpeaker(item: VoiceItem): boolean {
  // handler が存在し speaker.company が handler.organization と異なる → 顧客
  if (item.handler && item.speaker.company && item.speaker.company !== item.handler.organization) return true
  // Zendesk/Intercom は基本的に顧客の声
  if (item.source === 'zendesk' || item.source === 'intercom') return true
  // Salesforce Case は顧客起点
  if (item.metadata?.salesforce?.recordType === 'Case') return true
  return false
}

export function VoiceCard({ item, compact = false }: Props) {
  const [showImpactMap, setShowImpactMap] = useState(false)
  const { getByVoiceId } = useImpactStore()
  const impactCount = getByVoiceId(item.id).length

  const cardColor = SOURCE_COLORS[item.source] ?? 'bg-white border-gray-200'
  const isCustomer = isCustomerSpeaker(item)

  return (
    <>
      <div className={`border rounded-lg overflow-hidden ${cardColor}`}>
        {/* ヘッダー行: ① タイムスタンプ + ② システム名 + sentiment */}
        <div className="flex items-center justify-between px-3 pt-2 pb-1 gap-2">
          <ChannelBadge item={item} />
          <div className="flex items-center gap-1.5 shrink-0">
            <SentimentBadge sentiment={item.sentiment} />
            <Timestamp ts={item.ts} compact={compact} />
          </div>
        </div>

        <div className="px-3 pb-2 space-y-1">
          {/* ③ 社内担当者 */}
          {item.handler && <HandlerRow handler={item.handler} />}

          {/* ④ 発言者 */}
          <SpeakerRow speaker={item.speaker} isCustomer={isCustomer} />

          {/* ⑤ 発言内容 */}
          <p className={`text-gray-700 leading-relaxed mt-1.5 ${compact ? 'line-clamp-2 text-xs' : 'text-sm'}`}>
            {item.textSummary ?? item.text}
          </p>

          {/* ソース別追加情報 */}
          <SourceExtras item={item} />

          {/* Impact Map ボタン — V2.1新設 */}
          {!compact && (
            <div className="pt-1">
              <button
                onClick={() => setShowImpactMap(true)}
                title="このVoiceがGrowth / Decision / Storyに与える影響を表示"
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
              >
                <span>📊</span>
                <span>Impact Map</span>
                {impactCount > 0 && (
                  <span className="bg-indigo-200 text-indigo-800 rounded-full px-1.5 text-xs font-medium">
                    {impactCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Impact Map モーダル */}
      {showImpactMap && (
        <ImpactMapModal
          voiceId={item.id}
          voiceText={item.textSummary ?? item.text}
          onClose={() => setShowImpactMap(false)}
        />
      )}
    </>
  )
}
