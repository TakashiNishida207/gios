/**
 * 権限マトリクス (F-2)
 * F-2-1 デフォルト値で初期化される。ファシリテータはすべての操作が可能。
 */

export type PermissionAction =
  | 'voice:add'            // Voice を追加する
  | 'position:vote'        // アジェンダに立場表明（投票）
  | 'agenda:add'           // アジェンダを追加する
  | 'agenda:park'          // アジェンダを保留にする
  | 'agenda:status_change' // アジェンダのステータスを変更する
  | 'decision:add'         // Decision 案を追加する
  | 'decision:vote'        // Decision に投票する
  | 'story:approve'        // Story を承認する
  | 'story:publish'        // Story を公開する
  | 'phase:advance'        // フェーズを進める（ファシリテータ専用）
  | 'attendee:manage'      // 参加者の出席状況を管理する（ファシリテータ専用）

export const ALL_PERMISSION_ACTIONS: PermissionAction[] = [
  'voice:add',
  'position:vote',
  'agenda:add',
  'agenda:park',
  'agenda:status_change',
  'decision:add',
  'decision:vote',
  'story:approve',
  'story:publish',
  'phase:advance',
  'attendee:manage',
]

/** 権限アクションの表示名 */
export const PERMISSION_ACTION_LABELS: Record<PermissionAction, string> = {
  'voice:add':            'Voice 追加',
  'position:vote':        '立場表明（投票）',
  'agenda:add':           'アジェンダ追加',
  'agenda:park':          'アジェンダ保留',
  'agenda:status_change': 'アジェンダ状態変更',
  'decision:add':         'Decision 追加',
  'decision:vote':        'Decision 投票',
  'story:approve':        'Story 承認',
  'story:publish':        'Story 公開',
  'phase:advance':        'フェーズ進行',
  'attendee:manage':      '参加者管理',
}

/** 権限アクションの詳細説明 */
export const PERMISSION_ACTION_DESCRIPTIONS: Record<PermissionAction, { what: string; when: string; example: string }> = {
  'voice:add': {
    what:    'Voice タブに顧客の声・情報ソースを新規追加する',
    when:    'KNOWLEDGE_SYNC フェーズで情報収集する際',
    example: 'Salesforce ケースや Zendesk チケットを会議に取り込む',
  },
  'position:vote': {
    what:    'アジェンダ項目に対して「賛成 / 中立 / 反対」の立場を表明する',
    when:    'PHASE2〜PHASE3 でコンセンサス形成を行う際',
    example: '「SSO修正アプローチ」に賛成票を投じる',
  },
  'agenda:add': {
    what:    '会議に新しいアジェンダ項目を追加する',
    when:    '議論中に新たな論点が生まれたとき',
    example: '「解約防止キャンペーンの検討」を追加する',
  },
  'agenda:park': {
    what:    'アジェンダを「保留」状態にし、次回会議へ持ち越す',
    when:    '時間切れ・情報不足・前提条件未整備のとき',
    example: '「新プライシング案」を保留にして来週に持ち越す',
  },
  'agenda:status_change': {
    what:    'アジェンダのステータス（未開始 → 議論中 → 合意 など）を手動変更する',
    when:    '議論の進捗を会議参加者全員に可視化したいとき',
    example: '「ACME現状把握」を「収束中」から「合意」に更新する',
  },
  'decision:add': {
    what:    'Decision タブに新しい意思決定案（選択肢付き）を登録する',
    when:    'PHASE3 で具体的な選択肢を提示・整理するとき',
    example: '「SSOリカバリ方針 A案/B案/C案」を Decision に追加する',
  },
  'decision:vote': {
    what:    'Decision の選択肢に対してウェイト付き投票を行う',
    when:    'PHASE3 で意思決定の合意スコアを算出するとき',
    example: '「一時パスワードリセット対応」に投票する',
  },
  'story:approve': {
    what:    'Story（コミュニケーション草案）を「承認済」ステータスに変更する',
    when:    'PLANNING フェーズで対外メッセージを確定するとき',
    example: '「ACME向け障害報告メール」を承認する',
  },
  'story:publish': {
    what:    'Story を「公開済」にして外部チャネルへの配信を許可・実行する',
    when:    '承認済みの Story を顧客・市場・社内に配信するとき',
    example: 'Status Page に障害収束通知を公開する',
  },
  'phase:advance': {
    what:    '会議フェーズを次のフェーズへ進める（全員に影響する操作）',
    when:    '現フェーズの目的が達成されたと判断したとき',
    example: 'PHASE2 → PHASE3（意思決定フェーズ）へ移行する',
  },
  'attendee:manage': {
    what:    '参加者の出席状況（出席 / リモート / 欠席）を変更し、ウェイトを再按分する',
    when:    '遅刻・途中退席・欠席が発生したとき',
    example: 'PM が欠席になったため、残り3名でウェイトを再分配する',
  },
}

/** ロール1件の権限エントリ */
export interface RolePermission {
  roleId:        string
  roleName:      string
  isFacilitator: boolean
  /** 許可されているアクション一覧 */
  allowed:       PermissionAction[]
}
