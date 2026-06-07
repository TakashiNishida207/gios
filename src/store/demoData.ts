// src/store/demoData.ts
// GDIOS デモシナリオデータ — パワーミーティング UC1〜UC6 から各フェーズへマッピング
// 因果ループ: PowerMeeting voices/decisions → Flow phases → Intelligence buckets

import type { PMFEvidence, ChasmEvidence } from "@/score/GIOS_SCORE_ENGINE";
import type { FlowState, IntelligenceState } from "./store";

// ─── 型定義 ───────────────────────────────────────────────────────────────────

export type DemoScenario = {
  id:            string;
  bundleId:      string;   // power-meeting fixture への参照
  name:          string;   // 英語名
  nameJa:        string;   // 日本語名
  description:   string;
  descriptionJa: string;
  flow:          FlowState;
  intelligence:  IntelligenceState;
  pmfEvidence:   PMFEvidence;
  chasmEvidence: ChasmEvidence;
};

// ─── UC1: チャーンリスク緊急対応 ──────────────────────────────────────────────

const UC1: DemoScenario = {
  id:            "uc1",
  bundleId:      "bundle-b-uc1",
  name:          "Churn Risk Emergency — ACME Corp",
  nameJa:        "チャーンリスク緊急対応 — ACME Corp",
  description:   "Critical SSO outage causing churn risk on $240K ARR enterprise account.",
  descriptionJa: "SSO障害によりARR $240Kのエンタープライズ顧客の解約リスクが急上昇。緊急対応が必要。",

  flow: {
    Input: {
      customerName:    "ACME Corp",
      industry:        "SaaS / エンタープライズ",
      companySize:     "500名",
      contactPerson:   "高橋 健一（CTO）",
      contactEmail:    "takahashi@acme.example.com",
      valueMomentName: "SSO障害からのリテンション",
      painPoint:       "SAMLのAttributeStatementsフィールドマッピング不一致により主要ユーザー5名が本番環境へアクセス不能。NPSが -12 まで下落し、ARR $240K の解約リスクが急上昇している。",
      context:         "エンタープライズ更新交渉中（ARR $240K）。競合比較が進行中で、SSO解決が更新条件の前提。顧客からは価格5%割引・SLA 99.9%・専任CSMアサインの3条件が提示済み。",
      hypothesis:      "SAMLパッチデプロイ（当日18:00）と専任CSMアサインの組み合わせが、ARR維持と長期NPS回復に最も費用対効果が高い。",
      experimentMethod:"18:00 パッチデプロイ → 21:00 ACME環境検証 → 翌日 NPS再測定 → 5/1 更新クローズ",
      agenda:          "① SSO障害根本原因と解決ETA確認\n② リテンション施策（価格・SLA・CSM）決定\n③ ACME向けコミュニケーション文面承認",
    },
    Processing: {
      gapLevel:        "Critical",
      priorityScore:   9,
      painSeverity:    8,
      opportunitySize: 7,
    },
    Insight: {
      valueHypothesis:   "SSO修正完了でARR $240Kの解約リスクを即時解消。SLA強化と専任CSMで長期的なNPS回復（-12→+30）および拡販（$240K→$300K）を実現できる。",
      narrative:         "ACMEは3条件（価格5%割引・SLA 99.9%・専任CSM）を提示しているが、本日のSSO修正完了で技術リスクは消滅する。価格割引より SLA と CSM コミットを優先することで ARR を最大限維持しながら解約を防ぎ、拡販への布石とする。高橋CTOは技術的信頼性を最重視しており、スピード感ある復旧報告が交渉の分岐点となる。",
      decisionRationale: "Alt-A（ACME最優先・他案件一時停止）は加重スコア 0.95 で最高。エンジニアリング・CS・営業の三位一体対応で当日解決を確実にし、ARR $240K を守ることがポートフォリオ全体の優先度として最上位。",
      successMetric:     "NPS: -12 → +30（30日以内）/ 解約率: 0% / ARR維持: $240K / 更新クローズ: 2026-05-01",
    },
    Action: {
      chosenOption:     "A: ACME最優先・他案件一時停止（ARR $240K維持優先）",
      nextAction:       "SAMLパッチを本日18:00に本番デプロイ。21:00にACME環境での動作検証完了後、高橋CTOへ復旧報告メール送付。翌日CSMコールで更新交渉を再開する。",
      actionItems: [
        "Engineering Lead: SAMLパッチを18:00本番デプロイ（ステージング検証済み）",
        "CS Manager: 高橋CTOへ復旧ETA通知メール送付（本日14:00）",
        "Account Executive: リテンション条件提案書（SLA 99.9%・専任CSM）を本日中にACMEへ提出",
        "CS Manager: 更新交渉を2026-05-01クローズ目標でスケジュール設定",
        "PM: 他エンタープライズ案件のスケジュール1週間延期を担当者へ通知",
      ],
      owner:            "Engineering Lead（技術対応）/ CS Manager（顧客対応）",
      dueDate:          "2026-04-28",
      meetingDecisions: "SSO修正: Alt-A (18:00デプロイ) 確定 · リテンション施策: SLA+CSM提案で進行（価格割引は最後の手段）· 更新クローズ目標: 2026-05-01",
    },
    Feedback: {
      actualOutcome:     "18:00デプロイ成功、21:15にACME環境での完全復旧確認。高橋CTOから即日謝意メール。NPS回復は30日後測定予定。",
      hypothesisResult:  "仮説: SAMLパッチ当日解決でチャーンを防止 → 検証済み ✓",
      customerResponse:  "「今回の対応スピードに感謝。更新契約の方向で前向きに検討する」（高橋CTO）",
    },
    Learning: {
      learning:          "ARR $240K規模のエンタープライズチャーンは、専任リソース集中投下による当日解決が最速かつ最安な対策。SLAと専任CSMは価格割引より解約防止効果が高い。技術障害の復旧スピードが顧客信頼の分岐点となる。",
      updatedHypothesis: "高単価エンタープライズ顧客は、技術障害のスピード解決（24h以内）+ CSM専任サポートでNPSを回復できる。価格割引は最後の交渉カードとして温存する。",
      updatedNarrative:  "障害発生から48時間以内の当日解決が顧客信頼を維持する臨界点。SLA 99.9%のコミットは年間リテンション率に正の相関がある。専任CSMは顧客の意思決定者へのダイレクトパイプとして機能する。",
      playbookUpdate:    "エンタープライズ緊急チャーン対応プレイブック v2: ①専任エンジニア即時アサイン ②CEO/CSM共同コール（24h以内）③SLA/CSM提案を24h以内に提示 ④技術修正ETA確定後に価格交渉開始 ⑤価格割引は最後の手段",
    },
  },

  intelligence: {
    Growth: {
      bestPractice: "高ARR顧客の緊急障害には専任リソース集中対応。他案件の一時停止を厭わない姿勢が長期LTVを最大化する。チャーンリスクはARRインパクトで優先度付けし、$200K超は即日エスカレーション。",
      antiPattern:  "緊急対応中のリソース分散は解決ETAを延長し、顧客不満と解約確率を同時に高める。SLA違反が重なるとNPS回復に数ヶ月を要する。",
      growthScore:  61,
    },
    Evidence: {
      npsScore:       -12,
      previousNps:    8,
      arrImpact:      240000,
      churnRisk:      "high",
      incidentId:     "sso-001",
    },
    Story: {
      customerStory:  "お客様へ：SSO障害につきましてご不便をおかけし申し訳ございません。本日18時に修正デプロイを予定しており、21時には完全復旧の見込みです。引き続きサポートチームが専任で対応しております。",
      internalStory:  "エンジニアリング・CS・営業が連携しACMEのSSO問題に対応中。本日18時デプロイ予定。ARR $240Kの維持に向け全力対応。進捗は随時Slack #incident-acme で共有。",
      toneGuidance:   "謝罪ベース・事実重視・技術詳細レベル低",
    },
    Decision: {
      decisionOptions: [
        "A: ACME最優先・他案件一時停止 — ARR $240K維持優先、他エンタープライズ案件を1週間延期 (推奨 · 加重スコア 0.95)",
        "B: 並行対応（リソース分散）— 既存リソース配分を維持しつつACME対応追加。解決ETA +2日のリスクあり (加重スコア 0.52)",
      ],
      recommendedOption: "A",
      confidence:       0.95,
    },
    Voice: {
      sourceCount:      6,
      criticalCount:    1,
      negativeCount:    3,
      neutralCount:     2,
      topInsight:       "SSO障害の根本原因はSAML AttributeStatements フィールドマッピング不一致。Azure AD設定との競合が確認済み。",
    },
    PowerMeeting: {
      activeBundleId:  "bundle-b-uc1",
      phase:           "PHASE2",
    },
  },

  pmfEvidence: {
    day30Retention:            0.72,
    coreActionPerWeek:         3.8,
    behaviorChangeScore:       7.2,
    seanEllisVeryDisappointed: 0.54,
    nps:                       42,
    qualitativeHeat:           3.8,
    activationRate:            0.81,
    timeToValueScore:          7.5,
  },

  chasmEvidence: {
    segmentShare:           0.28,
    segmentPainIntensity:   8.5,
    referenceability:       7.2,
    winRate:                0.48,
    repeatablePatternCount: 6,
    salesCycleConsistency:  7.8,
    messageClarity:         7.5,
    useCaseStandardization: 7.2,
  },
};

// ─── UC2: API Gateway 障害対応 ────────────────────────────────────────────────

const UC2: DemoScenario = {
  id:            "uc2",
  bundleId:      "bundle-uc2",
  name:          "API Gateway Incident — Multi-Customer Impact",
  nameJa:        "API Gateway障害対応 — 複数顧客影響インシデント",
  description:   "Critical API gateway outage impacting 26 customers with 75% error rate.",
  descriptionJa: "APIエラー率75%、影響顧客26社のゲートウェイ障害。SLA違反リスク12社。",

  flow: {
    Input: {
      customerName:    "複数顧客（26社）",
      industry:        "SaaS / マルチテナント",
      companySize:     "全顧客合計 ARR $3.2M",
      contactPerson:   "Support Lead（前線対応）",
      contactEmail:    "support@sophia-proj.com",
      valueMomentName: "API Gateway緊急インシデント対応",
      painPoint:       "Config デプロイ直後からAPIエラー率が75%に急上昇。影響顧客26社、SLA違反リスク12社。PagerDuty発火から14分経過。",
      context:         "本番環境でのConfigデプロイが引き金。ロールバック vs ホットフィックスの判断が緊急で必要。SLA違反によるペナルティリスクあり。",
      hypothesis:      "即時ロールバックが最速復旧手段。ホットフィックスはステージング検証に30分を要するためリスクが高い。",
      experimentMethod:"① 即時ロールバック実行（ETAの3分）→ ② エラー率正常化確認 → ③ 影響顧客への通知 → ④ 根本原因分析（RCA）",
      agenda:          "① 障害範囲・根本原因の確認\n② ロールバック vs ホットフィックス決定\n③ SLAペナルティ対応・顧客コミュニケーション計画",
    },
    Processing: {
      gapLevel:        "P0 / Sev1",
      priorityScore:   10,
      painSeverity:    9,
      opportunitySize: 3,
    },
    Insight: {
      valueHypothesis:   "即時ロールバックで平均MTTRを15分以内に収め、12社のSLA違反を回避。インシデント後の事後分析（RCA）でConfigデプロイフローの自動検証を強化する。",
      narrative:         "APIエラー率75%はConfigデプロイと完全に相関。ロールバックの所要時間は3分、ホットフィックスは30分以上。MTTRとSLA違反リスクの両面でロールバックが唯一の正解。事後にステージング環境でのConfig自動検証を義務化し再発を防ぐ。",
      decisionRationale: "ロールバックは加重スコア 0.93。MTTRの最小化と26社への影響最小化が判断基準。ホットフィックスは検証時間が長く現時点では不採用。",
      successMetric:     "MTTR: 15分以内 / SLA違反: 0社 / エラー率: <0.1%（復旧後）/ 顧客通知: 30分以内",
    },
    Action: {
      chosenOption:     "即時ロールバック — Config前バージョンへ3分でリバート",
      nextAction:       "直ちにConfigロールバックを実行。エラー率正常化を確認後、影響26社へステータスページ経由で通知。SLA違反リスク12社には個別メール送付。",
      actionItems: [
        "Engineering Lead: 即時ロールバック実行（ETA 3分）",
        "Support Lead: ステータスページにインシデント通知公開",
        "Support Lead: SLA違反リスク12社へ個別メール送付（復旧後30分以内）",
        "PM: 事後RCAドキュメント作成（24時間以内）",
        "Engineering Lead: Configデプロイ前の自動検証ゲート実装をスプリントに追加",
      ],
      owner:            "Engineering Lead（技術）/ Support Lead（顧客対応）",
      dueDate:          "2026-05-06",
      meetingDecisions: "対応方針: 即時ロールバック確定 · ホットフィックスは事後適用 · SLA補償: 影響顧客へクレジット付与を検討",
    },
    Feedback: {
      actualOutcome:    "ロールバック後3分でエラー率0.2%に回復。SLA違反: 0社達成。MTTRは17分（目標15分をわずかに超過）。",
      hypothesisResult: "仮説: ロールバックが最速復旧 → 検証済み ✓ MTTR目標は次回更新。",
      customerResponse: "「ステータスページの更新が迅速で安心できた」（主要顧客フィードバック）",
    },
    Learning: {
      learning:          "Configデプロイは本番適用前にステージングで自動検証ゲートが必須。インシデント時はロールバック/ホットフィックスの判断基準をMTTRで統一するとチームの意思決定が高速化される。",
      updatedHypothesis: "Configデプロイの自動検証ゲートを導入することで、本番起因インシデントを80%削減できる。",
      updatedNarrative:  "P0インシデントの黄金律: 復旧スピードを最優先し、根本原因分析は復旧後に行う。顧客への透明なコミュニケーションがインシデント後の信頼維持を決定する。",
      playbookUpdate:    "インシデント対応プレイブック v3: ①P0判断から3分以内にロールバック開始 ②10分以内にステータスページ更新 ③30分以内に全影響顧客へ個別通知 ④24h以内にRCA公開",
    },
  },

  intelligence: {
    Growth: {
      bestPractice: "インシデント時の透明なコミュニケーション（ステータスページ即時更新）が顧客信頼を維持する。MTTRの可視化でSLA遵守率が向上する。",
      antiPattern:  "インシデント中の沈黙は顧客不安を増幅させ、SLA違反以上のダメージをブランドに与える。ロールバックを躊躇してMTTRを延ばすことは機会損失を拡大する。",
      growthScore:  44,
    },
    Evidence: {
      errorRate:       0.75,
      affectedTenants: 26,
      slaRiskCount:    12,
      arrAtRisk:       3200000,
    },
    Story: {
      customerStory:  "現在APIサービスで障害が発生しています。エンジニアリングチームが対応中です。復旧ETAは15分以内の予定です。最新情報はstatus.sophia-proj.comでご確認ください。",
      internalStory:  "P0インシデント対応中。Config rollback実行中、ETA 3分。全ハンズオンデッキ。#incident-gateway で更新共有。",
      toneGuidance:   "緊急・簡潔・行動志向・ETA明示",
    },
    Decision: {
      decisionOptions: [
        "A: 即時ロールバック（3分でリバート）— MTTR最小化、SLA違反回避 (推奨 · 加重スコア 0.93)",
        "B: ホットフィックス適用（ステージング検証30分）— 根本修正だがMTTR悪化リスク (加重スコア 0.35)",
      ],
      recommendedOption: "A",
      confidence:       0.93,
    },
    Voice: {
      sourceCount:   4,
      criticalCount: 2,
      negativeCount: 2,
      neutralCount:  0,
      topInsight:    "エラー率急上昇はConfigデプロイと完全相関。ロールバックで即時解決可能。",
    },
    PowerMeeting: {
      activeBundleId: "bundle-uc2",
      phase:          "PHASE3",
    },
  },

  pmfEvidence: {
    day30Retention:            0.65,
    coreActionPerWeek:         3.2,
    behaviorChangeScore:       6.5,
    seanEllisVeryDisappointed: 0.48,
    nps:                       35,
    qualitativeHeat:           3.3,
    activationRate:            0.75,
    timeToValueScore:          6.8,
  },

  chasmEvidence: {
    segmentShare:           0.22,
    segmentPainIntensity:   7.5,
    referenceability:       6.5,
    winRate:                0.42,
    repeatablePatternCount: 5,
    salesCycleConsistency:  6.8,
    messageClarity:         7.0,
    useCaseStandardization: 6.5,
  },
};

// ─── UC3: エンタープライズアップセル ──────────────────────────────────────────

const UC3: DemoScenario = {
  id:            "uc3",
  bundleId:      "bundle-uc3",
  name:          "Enterprise Upsell Strategy — ACME Corp",
  nameJa:        "エンタープライズアップセル戦略 — ACME Corp",
  description:   "Upsell opportunity from $240K to $420K ARR with expanded platform adoption.",
  descriptionJa: "SSO復旧後のリレーションシップを活かし、ARR $240K→$420Kへの拡販を実現する。",

  flow: {
    Input: {
      customerName:    "ACME Corp",
      industry:        "製造業 / デジタル変革",
      companySize:     "500名（国内）/ グローバル展開中",
      contactPerson:   "高橋 健一（CTO）/ 鈴木 部長（CFO）",
      contactEmail:    "takahashi@acme.example.com",
      valueMomentName: "エンタープライズプラットフォーム拡張",
      painPoint:       "現在のスタータープランでは部門横断のデータ統合が困難。各部門がサイロ化したツールを使用し、経営レポートの作成に週8時間を費やしている。",
      context:         "SSO復旧後の関係性改善を契機に、Decision Intelligence と Growth Intelligence の追加ライセンスを提案。競合Aは$180K/年で提案済みだが機能が劣る。",
      hypothesis:      "Decision IntelligenceとGrowth Intelligenceの2モジュール追加で、週8時間の経営レポート工数を80%削減。ROIは6ヶ月で回収可能。",
      experimentMethod:"① 無料PoC（30日間）→ ② 経営レポート自動化デモ → ③ ROI試算提示 → ④ 更新+拡張契約クローズ",
      agenda:          "① ACME現状課題の深掘り（部門横断データ統合）\n② Decision/Growth Intelligence のPoCプラン確定\n③ 拡張契約条件の合意（ARR $420K目標）",
    },
    Processing: {
      gapLevel:        "High",
      priorityScore:   8,
      painSeverity:    6,
      opportunitySize: 9,
    },
    Insight: {
      valueHypothesis:   "Decision + Growth Intelligenceで経営意思決定サイクルを週次→日次に短縮。ARR $240K→$420Kは75%増収。競合比較でROIが3倍優位。",
      narrative:         "ACME CTOは技術的信頼性を高く評価しており、SSO対応後のロイヤリティが高い。部門横断データ統合の課題は全社的な優先度が上がっており、Decision IntelligenceのPoCで経営会議の意思決定速度を可視化できれば、CFO承認も射程圏内。競合Aの$180Kより割高だが、統合機能とROIで差別化できる。",
      decisionRationale: "30日間無料PoCで実績を先行作成してから本契約に進む戦略が、CFO説得の最短ルート。加重スコア 0.88。",
      successMetric:     "PoCKPI: 経営レポート作成時間 8h→2h以内 / 拡張契約ARR: $420K / クローズ: 2026-06-30",
    },
    Action: {
      chosenOption:     "30日間PoC先行 → ROI実証 → 拡張契約（ARR $420K）",
      nextAction:       "来週中にACMEのCTO・CFO・現場PM向けPoC開始ミーティングをセットアップ。Decision Intelligence の経営ダッシュボードデモを30日間無償提供。",
      actionItems: [
        "Account Executive: PoCスコープ・KPI合意書をACMEへ送付（今週中）",
        "CS Manager: PoCオンボーディング計画策定・専任担当者アサイン",
        "Product Marketing: 競合A比較ROI試算書の作成（来週月曜）",
        "CEO: ACME CFOとの経営層アライメントコールを設定（今月中）",
        "Account Executive: 拡張契約ドラフトを2026-06-01までに提示",
      ],
      owner:            "Account Executive（主担当）/ CS Manager（技術支援）",
      dueDate:          "2026-06-30",
      meetingDecisions: "PoC開始: 承認 · ARR目標: $420K · 競合対抗: ROI訴求で差別化 · クローズ期限: 2026-06-30",
    },
    Feedback: {
      actualOutcome:    "PoC30日後、経営レポート作成時間が8h→1.5hに削減。CFO承認を取得し、ARR $380K（目標比90%）で契約締結。",
      hypothesisResult: "仮説: 6ヶ月ROI回収 → 実績4ヶ月回収 ✓ 目標を上回る結果。",
      customerResponse: "「PoC段階で既にROIが明確になった。全社展開を検討したい」（高橋CTO）",
    },
    Learning: {
      learning:          "エンタープライズ拡販はPoCによるROI先行実証が最も効果的。CFOは数値（時間削減・ROI）で意思決定し、CTOは技術信頼性（既存インテグレーション）で判断する。両者への訴求を分けることが重要。",
      updatedHypothesis: "エンタープライズ顧客へのupsellは既存信頼関係 + PoC実績 + ROI試算の三点セットがあれば競合より価格が高くてもクローズできる。",
      updatedNarrative:  "拡販の鉄則: 既存顧客の成功事例をPoC起点に可視化し、購買決裁者（CFO）と技術承認者（CTO）を分断して攻略する。",
      playbookUpdate:    "エンタープライズアップセルプレイブック v1: ①インシデント解決後60日以内に拡販アプローチ ②30日PoC+ROI試算をセット提案 ③CFO向けROIサマリとCTO向け技術統合資料を分けて作成 ④競合比較は機能ではなくROIで行う",
    },
  },

  intelligence: {
    Growth: {
      bestPractice: "既存顧客へのupsellは新規獲得の3倍コスト効率が高い。インシデント解決後60日以内がエンゲージメントのピーク。PoCによるROI先行実証がCFO承認の最短ルート。",
      antiPattern:  "価格競争に持ち込むと機能・価格の泥沼になる。ROIとTCO（総所有コスト）で比較優位を確立し、価格交渉を後半まで引き延ばす。",
      growthScore:  78,
    },
    Evidence: {
      currentArr:     240000,
      targetArr:      420000,
      pocDuration:    30,
      roiPayback:     6,
      competitorArr:  180000,
    },
    Story: {
      customerStory:  "ACME様の経営会議の意思決定サイクルを週次から日次に短縮するご提案です。30日間の無償PoCでROIを実証してからご判断ください。",
      internalStory:  "ACMEアップセル: 30日PoC → ROI実証 → ARR $420K クローズ。CFOとCTOへの分割アプローチで合意形成。",
      toneGuidance:   "価値提案ベース・ROI数値重視・競合差別化は機能ではなく成果で語る",
    },
    Decision: {
      decisionOptions: [
        "A: 30日PoC先行 + ROI実証 → 拡張契約 (推奨 · ARR $420K · 加重スコア 0.88)",
        "B: 直接契約提案（割引条件付き）— PoC省略でスピードUPだがCFO承認リスク高 (加重スコア 0.45)",
        "C: 段階的拡張（年間$30K増額）— 低リスクだが成長が緩慢 (加重スコア 0.62)",
      ],
      recommendedOption: "A",
      confidence:       0.88,
    },
    Voice: {
      sourceCount:   5,
      criticalCount: 0,
      negativeCount: 1,
      neutralCount:  3,
      topInsight:    "CTOは技術統合の容易さを、CFOはROI回収期間を最も重視している。競合Aは価格優位だが機能統合に課題あり。",
    },
    PowerMeeting: {
      activeBundleId: "bundle-uc3",
      phase:          "PLANNING",
    },
  },

  pmfEvidence: {
    day30Retention:            0.78,
    coreActionPerWeek:         4.2,
    behaviorChangeScore:       7.8,
    seanEllisVeryDisappointed: 0.61,
    nps:                       52,
    qualitativeHeat:           4.1,
    activationRate:            0.85,
    timeToValueScore:          8.0,
  },

  chasmEvidence: {
    segmentShare:           0.35,
    segmentPainIntensity:   8.0,
    referenceability:       7.8,
    winRate:                0.55,
    repeatablePatternCount: 8,
    salesCycleConsistency:  8.2,
    messageClarity:         8.0,
    useCaseStandardization: 7.8,
  },
};

// ─── UC4: PMF コア機能ピボット判断 ────────────────────────────────────────────

const UC4: DemoScenario = {
  id:            "uc4",
  bundleId:      "bundle-uc4",
  name:          "Core Feature Pivot — B2B SaaS PMF Exploration",
  nameJa:        "コア機能ピボット判断 — B2B SaaS PMF探索フェーズ",
  description:   "NPS decline and churn increase demanding core feature revalidation and pivot decision.",
  descriptionJa: "NPS低下・チャーン率上昇を受け、コア機能の価値仮説を再検証。ピボットか継続かの意思決定フェーズ。",

  flow: {
    Input: {
      customerName:    "複数顧客セグメント（Enterprise / SMB）",
      industry:        "B2B SaaS / PMF探索フェーズ",
      companySize:     "ARR $480K（Enterprise $320K・SMB $160K）",
      contactPerson:   "CS Lead（NPS低下追跡担当）",
      contactEmail:    "cs@sophia-proj.com",
      valueMomentName: "コア機能ピボット判断",
      painPoint:       "過去3ヶ月でNPS が 34→12 に下落。Monthly Churn Rate が 2.8% に上昇。コアとして訴求していたレポート自動化機能の利用率が15%に留まっている。",
      context:         "ユーザーインタビュー12件から「レポート機能より意思決定支援が欲しい」というシグナルが集中。一方でEnterprise顧客はレポート機能を高評価。セグメント間でのニーズ乖離が顕在化。",
      hypothesis:      "SMBセグメントにはレポート機能ではなく意思決定支援機能（Decision Intelligence）が真のコア。Enterpriseはレポート継続で分離対応する。",
      experimentMethod:"① SMB向け Decision Intelligence β版リリース（8週間）→ ② 利用率・NPS再測定 → ③ セグメント別プロダクト戦略決定",
      agenda:          "① NPS低下・チャーン上昇の根本原因分析\n② セグメント別ニーズマップの確認\n③ ピボット vs 継続 vs セグメント分割戦略の決定",
    },
    Processing: {
      gapLevel:        "High",
      priorityScore:   8,
      painSeverity:    7,
      opportunitySize: 8,
    },
    Insight: {
      valueHypothesis:   "SMBセグメントの真の価値はレポート作成の自動化ではなく、意思決定の速度と質の向上。Decision Intelligence のβ版でNPSを12→40+に回復できる可能性が高い。",
      narrative:         "インタビューデータはSMBとEnterpriseでニーズが二極化していることを示している。Enterpriseはレポート機能の価値を確認済みで解約リスクは低い。SMBは意思決定支援を求めており、現状の製品では価値を感じられていない。セグメント分割戦略（Enterprise=レポート強化、SMB=Decision Intelligence）がPMF到達への最短ルート。",
      decisionRationale: "セグメント分割 + SMB向けβ版が加重スコア 0.82 で最優。全社ピボットはEnterprise離脱リスクがあり非推奨。",
      successMetric:     "SMB NPS: 12 → 40（8週間）/ SMB Monthly Churn: 2.8% → 1.2% / Decision Intelligence 利用率: 15% → 55%",
    },
    Action: {
      chosenOption:     "セグメント分割戦略 — SMB: Decision Intelligenceにフォーカス / Enterprise: レポート機能継続強化",
      nextAction:       "SMB向けDecision Intelligence β版を8週間でリリース。既存SMBチャーンリスク顧客8社に優先オンボーディングを実施。",
      actionItems: [
        "CTO: Decision Intelligence β版のSMB向けリリース計画を2週間以内に確定",
        "CS Lead: チャーンリスクSMB顧客8社への優先連絡（今週中）",
        "Designer: Decision Intelligence UXプロトタイプ作成（3週間）",
        "CEO: Enterpriseロードマップとの整合性レビュー（今月末）",
        "CS Lead: β版参加顧客のNPS・利用率を週次で追跡・報告",
      ],
      owner:            "CTO（プロダクト）/ CS Lead（顧客エンゲージメント）",
      dueDate:          "2026-07-15",
      meetingDecisions: "戦略: セグメント分割確定 · SMB: Decision Intelligence β版（8週間）· Enterprise: レポート機能継続 · KPI: SMB NPS 40+を8週間で達成",
    },
    Feedback: {
      actualOutcome:    "β版8週間後: SMB NPS 12→38（目標40まであと2pt）/ Monthly Churn 2.8%→1.5%改善 / Decision Intelligence 利用率15%→62%。",
      hypothesisResult: "仮説: SMBの真のコアはDecision Intelligence → 概ね検証済み ✓ NPSはもう一声。",
      customerResponse: "「意思決定会議の準備時間が半分になった」（SMB顧客フィードバック多数）",
    },
    Learning: {
      learning:          "PMF探索フェーズでのセグメント分離は、プロダクト戦略の混乱を防ぐ。ユーザーインタビューのシグナルを早期に定量化し（NPS・利用率）、仮説検証のサイクルを8週間以内に設計することが重要。",
      updatedHypothesis: "B2B SaaSのPMFはセグメント単位で存在する。異なるセグメントに同一の価値提案をすると、どちらのPMFも達成できない。セグメント分割が先、機能開発が後。",
      updatedNarrative:  "PMF到達の方程式: セグメント特定 → 価値仮説再設定 → 8週間β検証 → NPS/利用率で判定 → 全社展開。この反復サイクルを年4回回す組織が市場適合を最速で達成する。",
      playbookUpdate:    "PMFピボット判断プレイブック v1: ①NPS低下 + Churn上昇が2ヶ月連続でピボット検討開始 ②12件以上のインタビューでセグメント別ニーズを可視化 ③セグメント分割戦略を優先（全社ピボットは最終手段）④8週間β検証でGo/No-Goを判定",
    },
  },

  intelligence: {
    Growth: {
      bestPractice: "PMF検証はセグメント単位で実施する。NPSとチャーン率を主要シグナルとし、月次でセグメント別に追跡。8週間β検証サイクルが最小実用実験期間。",
      antiPattern:  "全セグメントに同じ価値提案を続けることでどのPMFも達成できないまま資金が尽きる。インタビューシグナルを無視してプロダクト開発を続けることは最大の機会損失。",
      growthScore:  52,
    },
    Evidence: {
      npsScore:           12,
      previousNps:        34,
      monthlyChurnRate:   0.028,
      coreFeatureUsage:   0.15,
      interviewCount:     12,
    },
    Story: {
      customerStory:  "SMB顧客の皆様へ：意思決定をよりスピーディーに行うための新機能「Decision Intelligence」のβ版を提供します。ご参加いただけますか？",
      internalStory:  "SMB向けDecision Intelligence β版開始。8週間でNPS 40+・Churn 1.2%以下を目標。週次進捗は #pmf-track で共有。",
      toneGuidance:   "共創志向・β版参加のメリット明示・数値コミットで信頼構築",
    },
    Decision: {
      decisionOptions: [
        "A: セグメント分割戦略 — SMB: Decision Intelligence / Enterprise: レポート継続 (推奨 · 加重スコア 0.82)",
        "B: 全社ピボット（Decision Intelligence一本化）— Enterprise離脱リスク高 (加重スコア 0.41)",
        "C: 現状維持 + UX改善 — 根本的なセグメントニーズ乖離を解消できない (加重スコア 0.28)",
      ],
      recommendedOption: "A",
      confidence:       0.82,
    },
    Voice: {
      sourceCount:    12,
      criticalCount:  2,
      negativeCount:  6,
      neutralCount:   3,
      topInsight:     "SMBユーザーの63%が「意思決定支援機能が最も必要」と回答。Enterpriseの78%は「レポート機能の継続改善」を要望。セグメント間でニーズが二極化している。",
    },
    PowerMeeting: {
      activeBundleId: "bundle-uc4",
      phase:          "PHASE2",
    },
  },

  pmfEvidence: {
    day30Retention:            0.38,
    coreActionPerWeek:         1.8,
    behaviorChangeScore:       3.5,
    seanEllisVeryDisappointed: 0.28,
    nps:                       12,
    qualitativeHeat:           2.2,
    activationRate:            0.52,
    timeToValueScore:          4.5,
  },

  chasmEvidence: {
    segmentShare:           0.08,
    segmentPainIntensity:   5.5,
    referenceability:       3.5,
    winRate:                0.28,
    repeatablePatternCount: 2,
    salesCycleConsistency:  4.2,
    messageClarity:         4.8,
    useCaseStandardization: 3.8,
  },
};

// ─── UC5: Beachhead Vertical 集中決定 ─────────────────────────────────────────

const UC5: DemoScenario = {
  id:            "uc5",
  bundleId:      "bundle-uc5",
  name:          "Beachhead Vertical Focus — Chasm Crossing",
  nameJa:        "Beachhead Vertical集中決定 — キャズム突破フェーズ",
  description:   "Crossing the chasm by concentrating on the highest-win-rate vertical segment.",
  descriptionJa: "業種別勝率・CAC格差を分析し、キャズム突破のためにBeachhead Verticalに集中投資する戦略決定。",

  flow: {
    Input: {
      customerName:    "SaaS / B2B（製造業垂直市場）",
      industry:        "製造業 DX / MES連携",
      companySize:     "ターゲット: 従業員200-1000名の中堅製造業",
      contactPerson:   "CRO（市場戦略担当）",
      contactEmail:    "cro@sophia-proj.com",
      valueMomentName: "Beachhead Vertical集中戦略",
      painPoint:       "現在4つのVertical（製造・流通・医療・金融）に同時参入しているが、平均勝率が22%に留まっている。CAC格差が3.5倍あり、製造業だけが勝率48%・CAC $8K。他3業種は勝率18%以下。",
      context:         "VC向け次回ラウンド（Series B）で「キャズム突破の証拠」が求められている。製造業に集中すれば12ヶ月以内に勝率60%+・Domination evidenceを作れる計算。",
      hypothesis:      "製造業Verticalへの集中投資（営業・CS・PMの80%）により、12ヶ月以内に勝率60%・Segment Share 35%を達成し、Series Bの根拠となるBeachhead実績を作る。",
      experimentMethod:"① 製造業以外の新規営業を停止 → ② 製造業専用ユースケース・ROI計算機を開発 → ③ 12ヶ月後に勝率・Segment Shareで評価",
      agenda:          "① 業種別勝率・CAC格差の現状確認\n② 製造業Beachhead集中戦略の承認\n③ 他Vertical撤退・縮小計画の合意",
    },
    Processing: {
      gapLevel:        "Strategic",
      priorityScore:   9,
      painSeverity:    5,
      opportunitySize: 9,
    },
    Insight: {
      valueHypothesis:   "製造業Verticalへの集中投資で12ヶ月以内に勝率60%・Segment Share 35%を達成。Series B評価額を1.5倍にする根拠となるBeachhead実績を作れる。",
      narrative:         "キャズム突破の原則は「1セグメントを支配する」こと。製造業は既に勝率48%という突出した強みがあり、ユースケース（MES連携・品質管理自動化）が明確。他3業種はCAC回収が困難で、リソースを分散させるほどどのセグメントも支配できない。今こそ製造業に全集中し、12ヶ月後に『製造業の意思決定OSといえばGDIOS』を確立する。",
      decisionRationale: "製造業集中戦略は加重スコア 0.91。Series Bに向けたBeachhead evidenceの作成タイムラインと整合しており、財務・戦略の両面で最適解。",
      successMetric:     "製造業勝率: 22%→60% / Segment Share: 8%→35% / CAC: $8K→$5K / Series B評価額: 1.5倍 / タイムライン: 12ヶ月",
    },
    Action: {
      chosenOption:     "製造業Beachhead集中戦略 — 他3業種の新規営業停止・リソース製造業へ集中",
      nextAction:       "今週中に製造業以外の新規AE活動を停止。製造業専用ユースケース資料・ROI計算機を6週間以内に完成させる。",
      actionItems: [
        "CRO: 製造業以外の新規営業パイプラインを今週中にフリーズ",
        "PMM: 製造業専用ユースケース集（5事例）とROI計算機を6週間以内に作成",
        "CS VP: 製造業既存顧客10社へのサクセスプログラム強化（リファレンス顧客化）",
        "CEO: 製造業VCとのリレーション構築（3社・今四半期中）",
        "CRO: 月次KPIダッシュボード（勝率・Segment Share・CAC）を設置",
      ],
      owner:            "CRO（戦略実行）/ PMM（コンテンツ）",
      dueDate:          "2027-05-01",
      meetingDecisions: "Beachhead: 製造業に確定 · 他Vertical: 新規停止（既存顧客はCSで継続サポート）· KPI設定: 勝率60%・Segment Share 35%を12ヶ月目標",
    },
    Feedback: {
      actualOutcome:    "6ヶ月後レビュー: 製造業勝率 48%→58%（目標60%まであと2pt）/ Segment Share 8%→22% / CAC $8K→$6.2K。製造業リファレンス顧客5社獲得。",
      hypothesisResult: "仮説: 12ヶ月で勝率60% → 6ヶ月で58%達成中 → 12ヶ月達成見込み ✓",
      customerResponse: "「製造業特化の事例とROI計算機が競合比較を明快にした」（AE フィードバック）",
    },
    Learning: {
      learning:          "キャズム突破はBeachhead Verticalへのリソース集中と、そのセグメントに特化したユースケース・ROI訴求の組み合わせで加速する。分散投資は全セグメントで中途半端な結果を生む。",
      updatedHypothesis: "Beachhead Verticalは勝率・CACの格差データで選定する。選定後はそのセグメント向けの専用資料・事例・ROI計算機に集中投資することで勝率の改善スピードが加速する。",
      updatedNarrative:  "キャズム突破の方程式: ①勝率データでVerticalを選定 ②専用コンテンツで差別化 ③リファレンス顧客を5社以上確保 ④その証拠でSeries Bを説得する。この4ステップを12ヶ月以内に完了させる。",
      playbookUpdate:    "Beachheadプレイブック v1: ①業種別勝率を四半期毎に計測 ②トップ勝率Verticalにリソースの80%を集中 ③他Verticalの新規営業停止を恐れない ④12ヶ月でBeachhead evidence（勝率60%+・事例5社）を作る",
    },
  },

  intelligence: {
    Growth: {
      bestPractice: "Beachheadセグメントへのリソース集中は、分散投資と比較して勝率改善速度が2〜3倍速い。製造業特化コンテンツ（事例・ROI計算機）がAEの商談クローズ率を高める。",
      antiPattern:  "複数セグメントへの同時参入は、どのセグメントもドミナントになれずにキャズムに落ちる。CAC格差が2倍以上あるセグメントへの投資継続は資本の無駄。",
      growthScore:  68,
    },
    Evidence: {
      manufacturingWinRate:  0.48,
      otherVerticalWinRate:  0.18,
      cacManufacturing:      8000,
      cacOther:              28000,
      segmentShare:          0.08,
    },
    Story: {
      customerStory:  "製造業のお客様へ：MES連携と品質管理自動化に特化した意思決定OSを提供します。同業他社での導入事例とROI計算書をご用意しました。",
      internalStory:  "Beachhead戦略発動: 製造業に全集中。12ヶ月で勝率60%・Segment Share 35%へ。進捗は月次KPIダッシュボードで追跡。",
      toneGuidance:   "製造業特化・事例重視・ROI数値明示・業界用語（MES・品質管理）を使用",
    },
    Decision: {
      decisionOptions: [
        "A: 製造業Beachhead集中（他Vertical新規停止）— 12ヶ月で勝率60%目標 (推奨 · 加重スコア 0.91)",
        "B: 製造業優先 + 医療Vertical継続 — リソース分散リスクあり (加重スコア 0.55)",
        "C: 現状4Vertical継続 — CACとリソース効率の改善なし (加重スコア 0.22)",
      ],
      recommendedOption: "A",
      confidence:       0.91,
    },
    Voice: {
      sourceCount:    8,
      criticalCount:  0,
      negativeCount:  2,
      neutralCount:   4,
      topInsight:     "製造業顧客の特異な高勝率（48% vs 平均22%）の要因: MES連携のユースケースが明確で、品質管理部門が予算決裁権を持っている。他業種にはこのパターンがない。",
    },
    PowerMeeting: {
      activeBundleId: "bundle-uc5",
      phase:          "PHASE3",
    },
  },

  pmfEvidence: {
    day30Retention:            0.62,
    coreActionPerWeek:         3.0,
    behaviorChangeScore:       6.0,
    seanEllisVeryDisappointed: 0.42,
    nps:                       28,
    qualitativeHeat:           3.0,
    activationRate:            0.68,
    timeToValueScore:          6.2,
  },

  chasmEvidence: {
    segmentShare:           0.08,
    segmentPainIntensity:   8.5,
    referenceability:       3.0,
    winRate:                0.48,
    repeatablePatternCount: 3,
    salesCycleConsistency:  5.5,
    messageClarity:         6.5,
    useCaseStandardization: 5.0,
  },
};

// ─── UC6: Pricing 改定 + EMEA 拡出 ───────────────────────────────────────────

const UC6: DemoScenario = {
  id:            "uc6",
  bundleId:      "bundle-uc6",
  name:          "Pricing Reform + EMEA Expansion",
  nameJa:        "Pricing改定 + EMEA拡出 — スケールフェーズ",
  description:   "Redesigning pricing tiers and entering EMEA to improve NRR and Magic Number.",
  descriptionJa: "NRR・Magic Number改善のため価格体系を再設計し、EMEAへの拡出戦略を決定するスケールフェーズの意思決定。",

  flow: {
    Input: {
      customerName:    "全顧客ポートフォリオ + EMEA新規市場",
      industry:        "B2B SaaS / スケールフェーズ",
      companySize:     "現ARR $4.8M / EMEA TAM $12M",
      contactPerson:   "CFO（Pricing担当）/ CRO（EMEA担当）",
      contactEmail:    "cfo@sophia-proj.com",
      valueMomentName: "Pricing改定 + EMEA拡出戦略決定",
      painPoint:       "NRR が 98% に留まり拡張収益が取れていない。Magic Number が 0.6 で投資効率が低い。現行の3段階プランでは Enterprise tier が実際の価値と乖離。EMEAからの問い合わせが月15件あるが対応体制がない。",
      context:         "Series Bクローズ後、18ヶ月でARR $15Mを目標。NRR 120%超とEMEA初年度ARR $800Kが投資家へのコミット。Pricingの再設計とEMEA GTMの同時進行が必要。",
      hypothesis:      "Usage-based pricing（API calls単位）への移行でNRR 120%超を達成。EMEA向けはロンドンに1名Customer Successを配置し、パートナーチャネル経由で初年度ARR $800Kを狙う。",
      experimentMethod:"① Enterprise顧客10社にUsage-based移行PoC（90日）→ ② NRR・Expansion Revenue測定 → ③ EMEA β契約3社 → ④ GTM本格展開判断",
      agenda:          "① NRR・Magic Number低迷の構造分析\n② Pricing改定オプション比較（Seat vs Usage-based vs Hybrid）\n③ EMEA GTMオプション比較（Direct vs Partner）",
    },
    Processing: {
      gapLevel:        "High",
      priorityScore:   8,
      painSeverity:    6,
      opportunitySize: 10,
    },
    Insight: {
      valueHypothesis:   "Usage-based pricingへの移行でNRR 98%→120%超に改善。EMEA パートナーチャネルで初年度ARR $800K達成。ARR $15M目標への最短ルート。",
      narrative:         "現行のSeat-based pricingは利用量増加がRevenue増に直結しないため、NRRの天井が低い。Enterprise顧客のAPI利用量は契約数の3倍で成長しており、Usage-basedに切り替えることで自然なExpansion Revenueが生まれる。EMEAはロンドンに1名CSを配置し、既存のグローバルパートナーネットワーク経由で参入することでリスクを最小化できる。",
      decisionRationale: "Hybrid Pricing（Seat base + Usage overage）が加重スコア 0.85。完全Usage-basedは予算予測が困難でCFO承認リスク高。EMEA: パートナーチャネル + 1名CS配置が加重スコア 0.88。",
      successMetric:     "NRR: 98%→120% / Expansion Revenue Ratio: 12%→25% / Magic Number: 0.6→0.9 / EMEA ARR: $800K（初年度）",
    },
    Action: {
      chosenOption:     "Hybrid Pricing（Seat base + Usage overage）+ EMEA パートナーチャネル優先",
      nextAction:       "Enterprise顧客10社にHybrid Pricing移行PoCを開始。ロンドンCS採用（Q2中）とEMEAパートナー契約3社を今四半期内に完了。",
      actionItems: [
        "CFO: Hybrid Pricingモデル設計・Enterprise移行計画を4週間以内に策定",
        "CRO: EMEA戦略パートナー候補リスト作成・アプローチ開始（今四半期）",
        "Product VP: Usage-based billing API設計・開発スプリントを優先化",
        "CFO: Enterprise PoC参加顧客10社の選定とオファレター送付",
        "CRO: ロンドンCS採用JD公開・Q2中採用完了",
      ],
      owner:            "CFO（Pricing）/ CRO（EMEA GTM）",
      dueDate:          "2026-12-31",
      meetingDecisions: "Pricing: Hybrid（Seat+Usage overage）確定 · EMEA: パートナーチャネル優先 + 1名CS配置 · KPI: NRR 120%・EMEA ARR $800K を18ヶ月以内に達成",
    },
    Feedback: {
      actualOutcome:    "Hybrid Pricing PoC（90日）: Enterprise NRR 98%→112%に改善。EMEA β契約3社締結・ARR $210K。初年度$800K目標への進行は計画通り。",
      hypothesisResult: "仮説: Usage-basedでNRR 120% → PoC 90日でNRR 112% → 本格展開で120%達成見込み ✓",
      customerResponse: "「利用量に応じた課金は予算計画がしやすく透明性が高い」（Enterprise顧客の75%が肯定的評価）",
    },
    Learning: {
      learning:          "NRRを改善するためにはPricingモデルと製品価値の創出メカニズムを一致させることが必須。Usage-based / Hybrid Pricingは顧客成長に連動した自然なExpansion Revenueを生む。EMEAはパートナーチャネルが直販よりもCAC効率が3倍優れる。",
      updatedHypothesis: "Pricingモデルは製品の価値提供メカニズムと整合させることでNRRが自然に改善する。Seat-basedはユーザー数成長が必要で、Usage-based/Hybridは活用深度の成長に連動する。",
      updatedNarrative:  "スケールフェーズの鉄則: NRR 120%超はPricingモデルの設計で8割決まる。EMEA参入はパートナーエコシステムを活用することでDirect比3倍のCAC効率で拡張できる。",
      playbookUpdate:    "スケールPricingプレイブック v1: ①NRR 105%未満でPricing見直しを開始 ②Usage指標を特定してHybrid移行PoCを設計 ③Enterprise顧客の同意を先に得てから全体展開 ④EMEA参入はパートナーファーストで初年度リスクを最小化",
    },
  },

  intelligence: {
    Growth: {
      bestPractice: "Hybrid PricingはSeat-basedの予算予測可能性とUsage-basedのExpansion Revenue創出を両立させる。EMEAのパートナーチャネルはDirect比3倍のCAC効率でスケールできる。",
      antiPattern:  "NRR低迷時に機能追加で対処しようとするのは根本原因を見誤っている。Pricingモデルと価値創出メカニズムの乖離がNRR天井の本質的な原因。",
      growthScore:  82,
    },
    Evidence: {
      currentNrr:            0.98,
      magicNumber:           0.6,
      expansionRevenueRatio: 0.12,
      emeaInboundPerMonth:   15,
      emeaTam:               12000000,
    },
    Story: {
      customerStory:  "Enterprise顧客様へ：利用量に応じた新しい価格プランへの移行PoCにご参加ください。現在のご利用規模に合わせた最適なプランをご提案します。",
      internalStory:  "Pricing改定 + EMEA拡出 同時進行開始。18ヶ月でARR $15M目標。NRR 120%・EMEA $800Kが投資家コミット。#scale-pricing と #emea-gtm で進捗共有。",
      toneGuidance:   "成長ビジョン・数値コミット・透明性重視・投資家向けメトリクスで語る",
    },
    Decision: {
      decisionOptions: [
        "A: Hybrid Pricing（Seat base + Usage overage）+ EMEA パートナー優先 (推奨 · 加重スコア 0.85)",
        "B: 完全Usage-based移行 + EMEA Direct — CFO予算予測困難・直販コスト高 (加重スコア 0.52)",
        "C: Pricing現状維持 + EMEA Direct — NRR改善なし・EMEA CACが高い (加重スコア 0.31)",
      ],
      recommendedOption: "A",
      confidence:       0.85,
    },
    Voice: {
      sourceCount:    10,
      criticalCount:  1,
      negativeCount:  3,
      neutralCount:   5,
      topInsight:     "Enterprise顧客のAPI利用量は契約数の3倍で成長しているが、Seat-based pricingでは収益化できていない。EMEAのInbound問い合わせはロンドン・フランクフルト・アムステルダムの3都市に集中。",
    },
    PowerMeeting: {
      activeBundleId: "bundle-uc6",
      phase:          "PLANNING",
    },
  },

  pmfEvidence: {
    day30Retention:            0.82,
    coreActionPerWeek:         4.5,
    behaviorChangeScore:       8.2,
    seanEllisVeryDisappointed: 0.68,
    nps:                       58,
    qualitativeHeat:           4.5,
    activationRate:            0.88,
    timeToValueScore:          8.5,
  },

  chasmEvidence: {
    segmentShare:           0.42,
    segmentPainIntensity:   9.0,
    referenceability:       8.5,
    winRate:                0.62,
    repeatablePatternCount: 10,
    salesCycleConsistency:  8.8,
    messageClarity:         8.5,
    useCaseStandardization: 8.8,
  },
};

// ─── UC1 英語版 ────────────────────────────────────────────────────────────────

const UC1_EN: DemoScenario = {
  id:            "uc1",
  bundleId:      "bundle-b-uc1",
  name:          "Churn Risk Emergency — ACME Corp",
  nameJa:        "Churn Risk Emergency — ACME Corp",
  description:   "Critical SSO outage causing churn risk on $240K ARR enterprise account.",
  descriptionJa: "Critical SSO outage causing churn risk on $240K ARR enterprise account.",

  flow: {
    Input: {
      customerName:    "ACME Corp",
      industry:        "SaaS / Enterprise",
      companySize:     "500 employees",
      contactPerson:   "Ken Takahashi (CTO)",
      contactEmail:    "takahashi@acme.example.com",
      valueMomentName: "Retention from SSO Outage",
      painPoint:       "SAML AttributeStatements field mapping mismatch prevents 5 key users from accessing production. NPS dropped to -12 and churn risk on ARR $240K is surging.",
      context:         "Enterprise renewal negotiation in progress (ARR $240K). Competitor evaluation ongoing — SSO fix is a prerequisite for renewal. Customer presented 3 conditions: 5% price discount, SLA 99.9%, dedicated CSM.",
      hypothesis:      "Deploying the SAML patch today (18:00) combined with a dedicated CSM assignment is the most cost-effective strategy to retain ARR and recover NPS long-term.",
      experimentMethod:"18:00 patch deploy → 21:00 ACME environment verification → Next day NPS re-measure → 5/1 renewal close",
      agenda:          "① Confirm SSO outage root cause & resolution ETA\n② Decide retention strategy (pricing, SLA, CSM)\n③ Approve customer communication draft",
    },
    Processing: {
      gapLevel:        "Critical",
      priorityScore:   9,
      painSeverity:    8,
      opportunitySize: 7,
    },
    Insight: {
      valueHypothesis:   "Completing the SSO fix immediately eliminates the $240K ARR churn risk. Strengthening SLA and assigning a dedicated CSM can drive long-term NPS recovery (-12→+30) and expansion ($240K→$300K).",
      narrative:         "ACME presented 3 conditions (5% discount, SLA 99.9%, dedicated CSM), but today's SSO fix removes all technical risk. By prioritizing SLA and CSM commitments over price discounts, we maximize ARR retention while preventing churn and positioning for upsell. CTO Takahashi values technical reliability above all — a swift recovery report is the critical turning point in negotiations.",
      decisionRationale: "Alt-A (ACME priority, pause other projects) scores highest at 0.95. Engineering, CS, and Sales acting together ensures same-day resolution — protecting $240K ARR as the top portfolio priority.",
      successMetric:     "NPS: -12 → +30 (within 30 days) / Churn rate: 0% / ARR maintained: $240K / Renewal close: 2026-05-01",
    },
    Action: {
      chosenOption:     "A: Prioritize ACME, pause other accounts (ARR $240K retention priority)",
      nextAction:       "Deploy SAML patch to production at 18:00 today. After ACME environment verification at 21:00, send recovery report email to CTO Takahashi. Resume renewal negotiations in CSM call tomorrow.",
      actionItems: [
        "Engineering Lead: Deploy SAML patch to production at 18:00 (staging verified)",
        "CS Manager: Send recovery ETA notification email to CTO Takahashi (today 14:00)",
        "Account Executive: Submit retention proposal (SLA 99.9%, dedicated CSM) to ACME today",
        "CS Manager: Schedule renewal negotiation targeting 2026-05-01 close",
        "PM: Notify owners of 1-week delay for other enterprise accounts",
      ],
      owner:            "Engineering Lead (technical) / CS Manager (customer)",
      dueDate:          "2026-04-28",
      meetingDecisions: "SSO fix: Alt-A (18:00 deploy) confirmed · Retention: SLA + CSM proposal (price discount is last resort) · Renewal target: 2026-05-01",
    },
    Feedback: {
      actualOutcome:     "18:00 deploy successful, full recovery confirmed in ACME environment at 21:15. CTO sent thank-you email same day. NPS recovery to be measured in 30 days.",
      hypothesisResult:  "Hypothesis: Same-day SAML patch prevents churn → Validated ✓",
      customerResponse:  "'We appreciate your swift response. We are positively considering renewing the contract.' (CTO Takahashi)",
    },
    Learning: {
      learning:          "For enterprise churn at the $240K ARR level, same-day resolution through dedicated resource allocation is the fastest and cheapest mitigation. SLA and dedicated CSM outperform price discounts in preventing churn. Speed of technical recovery is the critical trust inflection point.",
      updatedHypothesis: "High-value enterprise customers can recover NPS through rapid technical resolution (within 24h) + dedicated CSM support. Price discounts should be held as a last negotiation card.",
      updatedNarrative:  "Same-day resolution within 48 hours of incident is the critical point for maintaining customer trust. SLA 99.9% commitment positively correlates with annual retention rate. Dedicated CSM functions as a direct pipeline to the customer decision-maker.",
      playbookUpdate:    "Enterprise Emergency Churn Playbook v2: ①Assign dedicated engineer immediately ②Joint CEO/CSM call (within 24h) ③Present SLA/CSM proposal within 24h ④Begin price negotiation only after tech fix ETA confirmed ⑤Price discount is last resort",
    },
  },

  intelligence: {
    Growth: {
      bestPractice: "For high-ARR customers with critical outages, concentrate dedicated resources. Willingness to pause other accounts maximizes long-term LTV. Prioritize churn risk by ARR impact — $200K+ triggers immediate escalation.",
      antiPattern:  "Spreading resources during emergency response extends resolution ETA and simultaneously increases customer dissatisfaction and churn probability. Compounding SLA violations can take months to recover NPS.",
      growthScore:  61,
    },
    Evidence: {
      npsScore:       -12,
      previousNps:    8,
      arrImpact:      240000,
      churnRisk:      "high",
      incidentId:     "sso-001",
    },
    Story: {
      customerStory:  "Dear ACME Team: We sincerely apologize for the inconvenience caused by the SSO outage. We have scheduled a fix deployment for 18:00 today and expect full recovery by 21:00. Our dedicated support team is working with you every step of the way.",
      internalStory:  "Engineering, CS, and Sales coordinating to resolve ACME's SSO issue. Deploy scheduled for 18:00 today. All hands on deck to protect ARR $240K. Updates shared in real-time on Slack #incident-acme.",
      toneGuidance:   "Apology-based, fact-driven, low technical detail",
    },
    Decision: {
      decisionOptions: [
        "A: Prioritize ACME, pause other accounts — ARR $240K retention priority, delay other enterprise by 1 week (Recommended · weighted score 0.95)",
        "B: Parallel response (split resources) — Maintain existing resource allocation while adding ACME support. Risk of +2 days to resolution ETA (weighted score 0.52)",
      ],
      recommendedOption: "A",
      confidence:       0.95,
    },
    Voice: {
      sourceCount:      6,
      criticalCount:    1,
      negativeCount:    3,
      neutralCount:     2,
      topInsight:       "Root cause of SSO outage: SAML AttributeStatements field mapping mismatch. Conflict with Azure AD settings confirmed.",
    },
    PowerMeeting: {
      activeBundleId:  "bundle-b-uc1",
      phase:           "PHASE2",
    },
  },

  pmfEvidence: {
    day30Retention:            0.72,
    coreActionPerWeek:         3.8,
    behaviorChangeScore:       7.2,
    seanEllisVeryDisappointed: 0.54,
    nps:                       42,
    qualitativeHeat:           3.8,
    activationRate:            0.81,
    timeToValueScore:          7.5,
  },

  chasmEvidence: {
    segmentShare:           0.28,
    segmentPainIntensity:   8.5,
    referenceability:       7.2,
    winRate:                0.48,
    repeatablePatternCount: 6,
    salesCycleConsistency:  7.8,
    messageClarity:         7.5,
    useCaseStandardization: 7.2,
  },
};

// ─── エクスポート ──────────────────────────────────────────────────────────────

export const DEMO_SCENARIOS: DemoScenario[] = [UC1, UC2, UC3, UC4, UC5, UC6];

/** ストアの初期デモデータ（UC1: チャーンリスク緊急対応） */
export const DEFAULT_DEMO = DEMO_SCENARIOS[0];

/** 言語に応じた UC1 データを返す */
export function getUC1ByLang(lang: 'ja' | 'en'): DemoScenario {
  return lang === 'en' ? UC1_EN : UC1;
}
