// src/power-meeting/utils/gdiosToMeetingBundle.ts
// GDIOS Store → PowerMeeting Bundle マッパー
// ★ flow.* データのみを参照する（intelligence.* は旧デモデータが残留するため使わない）

import type { FlowState, IntelligenceState } from "@/store/store";
import type { MeetingBundle, AgendaItem, Role } from "../types/agenda";
import type { VoiceItem } from "../types/voice";
import type { GHSItem } from "../types/growth";
import type { DecisionItem, Alternative } from "../types/decision";
import type { StoryItem } from "../types/story";
import type { HumanTask, AITask } from "../stores/executionStore";

const str  = (v: unknown): string => (v != null ? String(v).trim() : "");
const arr  = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string" && v.trim()) return v.split("\n").map((l) => l.trim()).filter(Boolean);
  return [];
};
const now = () => new Date().toISOString();

// デフォルトロール（GDIOS 汎用）
const DEFAULT_ROLES: Role[] = [
  { id: "role-owner", name: "営業担当",     weight: 0.4 },
  { id: "role-csm",   name: "CS Manager",  weight: 0.3 },
  { id: "role-mgr",   name: "マネージャー", weight: 0.3 },
];

export type GDIOSBundle = {
  bundle:        MeetingBundle;
  voices:        VoiceItem[];
  ghsItems:      GHSItem[];
  decisionItems: DecisionItem[];
  storyItems:    StoryItem[];
  humanTasks:    HumanTask[];
  aiTasks:       AITask[];
};

/**
 * GDIOS store の flow.* データを PowerMeeting bundle + 各タブデータに変換する。
 * intelligence.* は旧デモデータが残留する可能性があるため参照しない。
 * Notion → GDIOS 同期後に呼び出すことで、最新の顧客データを会議に活用できる。
 */
export function gdiosToMeetingBundle(
  flow: FlowState,
  _intelligence: IntelligenceState,  // 意図的に未使用（デモ汚染回避）
): GDIOSBundle {
  const input    = flow.Input      as Record<string, unknown>;
  const proc     = flow.Processing as Record<string, unknown>;
  const insight  = flow.Insight    as Record<string, unknown>;
  const action   = flow.Action     as Record<string, unknown>;
  const learning = flow.Learning   as Record<string, unknown>;

  const customerId   = str(input.customerId)   || str(input.customerName) || "顧客";
  const customerName = str(input.customerName) || customerId;
  const ts = now();

  // スコア（0〜10 スケール → 0〜100 に正規化）
  const painScore = typeof proc.painSeverity   === "number" ? Math.round(proc.painSeverity   * 10) : 50;
  const oppScore  = typeof proc.opportunitySize === "number" ? Math.round(proc.opportunitySize * 10) : 60;
  const priScore  = typeof proc.priorityScore   === "number" ? Math.round(proc.priorityScore  * 10) : 70;

  // ─── ① VoiceItems（flow.Input から生成） ──────────────────────────────────
  const voices: VoiceItem[] = [];
  const voiceIds: string[] = [];

  if (str(input.painPoint)) {
    const id = "v-gdios-pain";
    voiceIds.push(id);
    voices.push({
      id,
      source:  "notion",
      speaker: { name: customerName, company: customerName },
      ts,
      text:    str(input.painPoint),
      textSummary: str(input.painPoint).slice(0, 100) + (str(input.painPoint).length > 100 ? "…" : ""),
      sentiment:   str(proc.gapLevel).toLowerCase() === "critical" ? "critical" : "negative",
      metadata: { notion: { pageId: "", pageTitle: customerId } },
    });
  }
  if (str(input.context)) {
    const id = "v-gdios-context";
    voiceIds.push(id);
    voices.push({
      id,
      source:  "notion",
      speaker: { name: str(input.contactPerson) || customerName, company: customerName },
      ts,
      text:    str(input.context),
      sentiment: "neutral",
    });
  }
  if (str(input.hypothesis)) {
    const id = "v-gdios-hypothesis";
    voiceIds.push(id);
    voices.push({
      id,
      source:  "manual",
      speaker: { name: "営業担当", role: "内部" },
      ts,
      text:    `【仮説】${str(input.hypothesis)}`,
      sentiment: "positive",
    });
  }

  // ─── ② AgendaItems（flow.Input.agenda + flow.Action.actionItems から生成） ─
  const agendaItems: AgendaItem[] = [];

  // アジェンダ文字列 → 個別アイテム
  const agendaLines = arr(input.agenda);
  agendaLines.forEach((line, i) => {
    agendaItems.push({
      id:            `agenda-gdios-${i + 1}`,
      title:         line.replace(/^[①②③④⑤\d][.)．）\s]*/, ""),
      ownerRoleId:   "role-owner",
      timeBudgetMin: 15,
      status:        str(action.chosenOption) ? "aligned" : "pending",
      discussionLog: [],
      reactions:     [],
      positions:     [],
      parked:        false,
      linkedVoiceIds: voiceIds.slice(0, 1),
    });
  });

  // アクションアイテム → PLANNING アジェンダ（voice/growth との紐付けも設定）
  const actionLines = arr(action.actionItems);
  if (actionLines.length > 0 || str(action.nextAction)) {
    const discussionLog = actionLines.map((line, i) => ({
      id:      `disc-action-${i}`,
      speaker: str(action.owner) || "営業担当",
      roleId:  "role-owner",
      ts,
      text:    line,
      phase:   "PLANNING" as const,
    }));
    agendaItems.push({
      id:            "agenda-gdios-actions",
      title:         str(action.nextAction) || "次のアクション確認",
      ownerRoleId:   "role-owner",
      timeBudgetMin: 20,
      status:        "aligned",
      discussionLog,
      reactions:     [],
      positions:     DEFAULT_ROLES.map((r) => ({
        roleId:            r.id,
        stance:            "agree" as const,
        weightContribution: r.weight,
        ts,
      })),
      parked:            false,
      linkedDecisionIds: ["dec-gdios-main"],
      linkedVoiceIds:    voiceIds,          // ★ 全 voice を紐付け
      linkedGrowthIds:   ["ghs-gdios-expansion", "ghs-gdios-churn", "ghs-gdios-retention"],
    });
  }

  const firstAgendaId = agendaItems[0]?.id ?? "agenda-gdios-1";

  // ─── ③ DecisionItems（flow.Action + flow.Insight から生成。intelligence.* は使わない）
  const alternatives: Alternative[] = [];

  // 選択肢A: 実際に選択されたアクション
  const chosenOpt = str(action.chosenOption);
  if (chosenOpt) {
    alternatives.push({
      id:          "alt-gdios-chosen",
      label:       chosenOpt,
      recommended: true,
      impactScore: Math.min(5, Math.round(priScore / 20)) || 4,
      riskScore:   Math.max(1, Math.round((100 - priScore) / 25)) || 2,
      description: str(action.nextAction) || chosenOpt,
      eta:         str(action.dueDate) || undefined,
    });
  }

  // 選択肢B: 現状維持（対比案として）
  if (chosenOpt || str(insight.valueHypothesis)) {
    alternatives.push({
      id:          "alt-gdios-status-quo",
      label:       "現状維持（対応なし）",
      recommended: false,
      impactScore: 1,
      riskScore:   Math.min(5, Math.round(painScore / 20)) || 4,
      description: "対策を講じない場合、課題が継続・拡大するリスクがある。",
    });
  }

  const decisionItems: DecisionItem[] = [{
    id:       "dec-gdios-main",
    type:     "strategic",
    title:    str(insight.valueHypothesis) || str(insight.narrative) || `${customerId} — 方針決定`,
    agendaId: firstAgendaId,
    alternatives,
    voiceImpactIds: [],
    status:   chosenOpt ? "decided" : "evaluating",
    votingResult: {
      agree:         8,
      neutral:       1,
      disagree:      0,
      weightedScore: 0.9,
    },
  }];

  // ─── ④ StoryItems（flow.Insight + flow.Learning から生成。intelligence.Story は使わない）
  const storyItems: StoryItem[] = [];

  // 顧客向けナラティブ
  const customerNarr = str(insight.narrative) || str(insight.valueHypothesis);
  if (customerNarr) {
    storyItems.push({
      id:           "story-gdios-customer",
      audience:     "customer",
      title:        `${customerId} 向けナラティブ`,
      narrative:    customerNarr,
      channel:      "提案資料 / Email",
      linkedVoiceIds:  voiceIds,
      voiceImpactIds:  [],
      status:       "review",
      ownerRoleId:  "role-csm",
      agendaId:     firstAgendaId,
    });
  }

  // 社内向けナラティブ（意思決定根拠）
  const internalNarr = str(insight.decisionRationale) || str(insight.successMetric);
  if (internalNarr) {
    storyItems.push({
      id:           "story-gdios-internal",
      audience:     "internal",
      title:        "意思決定根拠・成功指標",
      narrative:    [
        str(insight.decisionRationale) && `【判断根拠】${str(insight.decisionRationale)}`,
        str(insight.successMetric)     && `【成功指標】${str(insight.successMetric)}`,
      ].filter(Boolean).join("\n\n"),
      channel:      "Slack / 社内メモ",
      linkedVoiceIds:  [],
      voiceImpactIds:  [],
      status:       "approved",
      ownerRoleId:  "role-mgr",
    });
  }

  // 学習ナラティブ（次のプレイブックへ）
  if (str(learning.learning)) {
    storyItems.push({
      id:           "story-gdios-learning",
      audience:     "internal",
      title:        "学習・プレイブック更新",
      narrative:    [
        str(learning.learning)          && `【学習】${str(learning.learning)}`,
        str(learning.updatedHypothesis) && `【更新仮説】${str(learning.updatedHypothesis)}`,
        str(learning.playbookUpdate)    && `【プレイブック】${str(learning.playbookUpdate)}`,
      ].filter(Boolean).join("\n\n"),
      channel:      "プレイブック / ナレッジベース",
      linkedVoiceIds:  [],
      voiceImpactIds:  [],
      status:       "approved",
      ownerRoleId:  "role-mgr",
    });
  }

  // ─── ⑤ GHSItems（スコア変化の根拠を明示） ───────────────────────────────
  const ghsItems: GHSItem[] = [];

  // エクスパンション（機会の大きさ = opportunitySize）
  ghsItems.push({
    id:            "ghs-gdios-expansion",
    category:      "expansion",
    scope:         "agenda",
    agendaId:      firstAgendaId,
    title:         "エクスパンション機会",
    score:         oppScore,
    trend:         oppScore >= 60 ? "up" : "down",
    previousScore: Math.round(oppScore * 0.88),
    comments:      [{
      id:      "c-expansion",
      roleId:  "role-mgr",
      text:    [
        `【スコア根拠】機会の大きさ: ${str(proc.opportunitySize) || "未設定"}/10`,
        str(action.nextAction) && `【推奨アクション】${str(action.nextAction)}`,
        str(insight.valueHypothesis) && `【価値仮説】${str(insight.valueHypothesis)}`,
      ].filter(Boolean).join("\n"),
      ts,
    }],
    voiceImpactIds: [],
    ownerRoleId:   "role-mgr",
  });

  // チャーン（課題の深刻度 = 高いほどチャーンリスク高 → スコア低）
  const churnScore = Math.round(100 - painScore);
  ghsItems.push({
    id:            "ghs-gdios-churn",
    category:      "churn",
    scope:         "agenda",
    agendaId:      firstAgendaId,
    title:         "チャーン・リスク（課題深刻度）",
    score:         churnScore,
    trend:         churnScore >= 60 ? "flat" : "down",
    previousScore: Math.round(churnScore * 1.1 > 100 ? 100 : churnScore * 1.1),
    comments:      [{
      id:      "c-churn",
      roleId:  "role-mgr",
      text:    [
        `【スコア根拠】課題の深刻度: ${str(proc.painSeverity) || "未設定"}/10（高いほどリスク高、スコアは逆転）`,
        `ギャップレベル: ${str(proc.gapLevel) || "未設定"}`,
        str(input.painPoint) && `【課題内容】${str(input.painPoint).slice(0, 120)}`,
        str(learning.updatedHypothesis) && `【対策仮説】${str(learning.updatedHypothesis)}`,
      ].filter(Boolean).join("\n"),
      ts,
    }],
    voiceImpactIds: [],
    ownerRoleId:   "role-mgr",
  });

  // リテンション（優先度スコア = 対応済みの根拠から）
  ghsItems.push({
    id:            "ghs-gdios-retention",
    category:      "retention",
    scope:         "agenda",
    title:         "リテンション・施策進捗",
    score:         priScore,
    trend:         str(action.chosenOption) ? "up" : "flat",
    previousScore: Math.round(priScore * 0.9),
    comments:      [{
      id:      "c-retention",
      roleId:  "role-mgr",
      text:    [
        `【スコア根拠】優先度スコア: ${str(proc.priorityScore) || "未設定"}/10`,
        str(action.chosenOption) && `【決定アクション】${str(action.chosenOption)}`,
        str(action.dueDate)      && `【期限】${str(action.dueDate)}`,
        str(learning.learning)   && `【蓄積学習】${str(learning.learning).slice(0, 100)}`,
      ].filter(Boolean).join("\n"),
      ts,
    }],
    voiceImpactIds: [],
    ownerRoleId:   "role-mgr",
  });

  // ─── ⑥ HumanTasks（flow.Action.actionItems → 人的タスク） ──────────────────
  const dueDate   = str(action.dueDate)
  const ownerText = str(action.owner)

  const humanTasks: HumanTask[] = actionLines.map((line, i) => {
    // "担当者: タスク" または "担当者（役割）: タスク" 形式の解析
    const ownerMatch = line.match(/^(.{2,10})[（(][^)）]*[)）]?\s*[:：]\s*(.+)/)
    const colonMatch = line.match(/^([^:：]{2,12})[:：]\s*(.+)/)
    const assignee   = ownerMatch ? ownerMatch[1].trim()
                     : colonMatch ? colonMatch[1].trim()
                     : ownerText  ? ownerText.split('／')[i % Math.max(1, ownerText.split('／').length)].trim()
                     : DEFAULT_ROLES[i % DEFAULT_ROLES.length].name
    const title      = ownerMatch ? ownerMatch[2].trim()
                     : colonMatch ? colonMatch[2].trim()
                     : line

    // カテゴリ推定
    const category: HumanTask["category"] =
      /顧客|担当者|コール|面談|提案|メール|連絡/.test(line) ? "customer"  :
      /システム|設定|デプロイ|技術|修正|確認/.test(line) ? "technical" : "internal"

    return {
      id:          `ht-gdios-${i}`,
      title,
      description: `${customerId} 向けアクション`,
      assignee,
      role:        assignee,
      dueDate,
      status:      "pending",
      priority:    i < 2 ? "high" : i < 4 ? "medium" : "low",
      category,
    }
  })

  // ─── ⑦ AITasks（アクションアイテムから自動化可能なもの） ────────────────────
  // キーワードに基づいてAI実行可能なタスクを生成
  const AI_CHANNEL_MAP: { keyword: RegExp; channel: string; icon: string }[] = [
    { keyword: /資料|シート|スプレッド|ドキュメント|ファイル/,  channel: "Google Docs / Sheets", icon: "📊" },
    { keyword: /メール|送付|連絡|通知/,                         channel: "Gmail / Outlook",      icon: "📧" },
    { keyword: /Notion|データベース|更新|記録/,                 channel: "Notion",               icon: "📝" },
    { keyword: /日程|スケジュール|打ち合わせ|カレンダー/,       channel: "Google Calendar",      icon: "📅" },
    { keyword: /CRM|Salesforce|パイプライン/,                  channel: "Salesforce CRM",       icon: "☁️" },
    { keyword: /Slack|チャット|社内共有/,                       channel: "Slack",                icon: "💬" },
  ]

  const aiTasks: AITask[] = []
  actionLines.forEach((line, i) => {
    const matched = AI_CHANNEL_MAP.find((m) => m.keyword.test(line))
    if (matched) {
      aiTasks.push({
        id:               `ai-gdios-${i}`,
        title:            `${line.slice(0, 30)}${line.length > 30 ? "…" : ""}`,
        description:      `${customerId}: ${line}`,
        channel:          matched.channel,
        channelIcon:      matched.icon,
        estimatedSeconds: 2,
        status:           "ready",
      })
    }
  })

  // AI タスクが少ない場合、次のアクションを Notion 記録タスクとして追加
  if (aiTasks.length === 0 && str(action.nextAction)) {
    aiTasks.push({
      id:               "ai-gdios-summary",
      title:            "アクション記録を Notion に更新",
      description:      `${customerId} の次のアクション「${str(action.nextAction).slice(0, 60)}…」を Notion に記録する`,
      channel:          "Notion",
      channelIcon:      "📝",
      estimatedSeconds: 2,
      status:           "ready",
    })
  }
  if (str(action.meetingDecisions)) {
    aiTasks.push({
      id:               "ai-gdios-decisions",
      title:            "ミーティング議事録の自動生成",
      description:      `決定事項「${str(action.meetingDecisions).slice(0, 60)}」を議事録としてNotionに記録し、参加者に共有する`,
      channel:          "Notion / Email",
      channelIcon:      "📋",
      estimatedSeconds: 3,
      status:           "ready",
    })
  }

  // ─── MeetingBundle 組み立て ─────────────────────────────────────────────────
  const bundle: MeetingBundle = {
    id:     "bundle-gdios-live",
    name:   `${customerId} — GDIOS連携ミーティング`,
    phase:  str(action.chosenOption) ? "PLANNING" : "PHASE3",
    roles:  DEFAULT_ROLES,
    agendaItems,
    voices,
  };

  return { bundle, voices, ghsItems, decisionItems, storyItems, humanTasks, aiTasks };
}
