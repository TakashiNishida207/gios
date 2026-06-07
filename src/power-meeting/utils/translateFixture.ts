// src/power-meeting/utils/translateFixture.ts
// フィクスチャデータの日本語→英語変換マップ + 変換関数
// 英語モード時にこれを使ってコンテンツを英語化する

/** 日本語フレーズ → 英語フレーズ の変換マップ */
const JA_TO_EN: Record<string, string> = {
  // === UC1: Churn Risk / ACME ===
  'ACME解約リスクの現状把握':       'ACME Churn Risk: Current Status',
  'SSO障害の技術的根本原因と解決ETA': 'SSO Outage: Root Cause & Resolution ETA',
  'リテンション施策の決定':         'Retention Strategy Decision',
  '顧客リテンション施策（価格・SLA・CSM対応）': 'Customer Retention Plan (Pricing, SLA, CSM)',
  'ACMEリテンション戦略':          'ACME Retention Strategy',
  '現在ACMEのNPSは-12まで下落。SSO障害が発端で、5名の主要ユーザーが利用停止中。':
    'ACME NPS has dropped to -12. The SSO outage has halted 5 key users.',
  'ARR $240Kだ。緊急対応モードで行く。他のリソースは一時的に後回しにしてでも解決する。':
    'ARR is $240K. We go into emergency mode. We solve this even if we delay other projects.',
  'SAMLのAttributeStatementsのフィールドマッピング定義が、ACME社のAzure AD設定と不一致になっていた。パッチはすでに開発完了、ステージング検証中。':
    'The SAML AttributeStatements field mapping was mismatched with ACME\'s Azure AD config. Patch developed, staging in progress.',
  'ETAはいつですか？ACME社の高橋CTOに今日中に回答が必要です。':
    'What\'s the ETA? We need to respond to ACME\'s CTO today.',
  '本日18時にデプロイ予定。その後ACMEの環境で検証を行い、21時には完全解決の見込み。':
    'Deploy at 18:00 today. Verify in ACME environment, full resolution expected by 21:00.',
  // SSO障害系
  'SSO障害の解決ETA確認':          'Confirm SSO Fix ETA',
  'リテンション条件の決定':         'Finalize Retention Terms',
  'ACME向けコミュニケーション文面承認': 'Approve Customer Communication Draft',
  'SAMLフィールドマッピング不一致によりACME社の5名の主要ユーザーがアクセス不能。':
    'SAML field mapping mismatch — 5 ACME key users unable to access.',
  // === UC2: API Gateway Incident ===
  'API Gateway障害の影響範囲確認':   'API Gateway Outage: Assess Impact Scope',
  '緊急ロールバックの判断':          'Emergency Rollback Decision',
  'SLA違反リスクと顧客通知':         'SLA Breach Risk & Customer Notification',
  'APIエラー率が75%に達している。26社に影響。': 'API error rate at 75%. Affecting 26 customers.',
  // === UC3: Enterprise Upsell ===
  'ACMEアップセル提案の最終確認':    'ACME Upsell Proposal: Final Review',
  'PoC条件と契約条件の合意':         'Agree on PoC Terms & Contract Conditions',
  'アップセル金額・タイミングの決定': 'Finalize Upsell Amount & Timeline',
  // === UC4: PMF Feature Pivot ===
  'コア機能の絞り込み方針確定':      'Finalize Core Feature Focus Strategy',
  'SMBターゲットへのピボット判断':   'Decide on SMB Segment Pivot',
  'ロードマップ優先度の見直し':      'Review & Reprioritize Roadmap',
  // === UC5: Beachhead Vertical ===
  '製造業Beachhead戦略の確定':       'Confirm Manufacturing Vertical Beachhead Strategy',
  'パートナーチャネル戦略':          'Partner Channel Strategy',
  '垂直市場集中の意思決定':          'Decision: Focus on Single Vertical',
  // === UC6: Pricing Reform ===
  'Pricing改定方針の決定':           'Finalize Pricing Reform Policy',
  'EMEA拡出タイミングと体制':        'EMEA Expansion Timing & Structure',
  'NRR改善施策の優先順位':           'Prioritize NRR Improvement Initiatives',
  // === 共通ステータス/ラベル ===
  '収束中': 'Converging',
  '合意':   'Aligned',
  '未開始': 'Pending',
  '議論中': 'In Discussion',
  '完了':   'Done',
  '保留中': 'Parked',
  // === GHSカテゴリ ===
  'ACMEチャーンリスク':              'ACME Churn Risk',
  'ACMEリテンションスコア':          'ACME Retention Score',
  'エンタープライズ顧客リテンション全体': 'Enterprise Customer Retention Overall',
  'エンタープライズ拡販機会（ARR $240K→$300K）': 'Enterprise Expansion (ARR $240K→$300K)',
  'SSO障害解決進捗':                 'SSO Fix Progress',
  // === ボイスカード ===
  '顧客企業':                        'Customer Company',
  '現在ACMEのNPSは-12まで下落。SSO障害が発端で、5名の主要ユーザーが利用停止中。':
    'ACME NPS has dropped to -12. The SSO outage caused 5 key users to stop using the service.',
}

/** 文字列を英語に変換する（マップになければそのまま返す） */
export function translateText(text: string): string {
  if (JA_TO_EN[text]) return JA_TO_EN[text]
  // 部分マッチ（長い文は辞書にないことが多いのでそのまま返す）
  return text
}

/** フィクスチャオブジェクトを再帰的に英語化する */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function translateFixture<T extends object>(data: T): T {
  if (Array.isArray(data)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item) => translateFixture(item)) as any
  }
  if (typeof data === 'object' && data !== null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        result[key] = translateText(value)
      } else if (typeof value === 'object' && value !== null) {
        result[key] = translateFixture(value)
      } else {
        result[key] = value
      }
    }
    return result
  }
  return data
}
