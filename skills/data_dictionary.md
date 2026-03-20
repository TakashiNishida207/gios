# skills/data_dictionary.md
# GIOS Data Dictionary（変数意味論）
# Business-first Growth Intelligence OS — Quiet × Clean × Causal Loop Intelligence

## Purpose

この Data Dictionary は GIOS のすべての変数の
**意味論・Intelligence Flow（Input → Learning）・Intelligence・Notion 同期フィールド**を定義する。

Claude Code はこの辞書を **OS の憲法** として扱い、以下を保証する。

- 変数の意味論を誤らない
- Flow（Input → Learning）を正しく割り当てる
- Intelligence を正しく配布する
- Sync Layer のマッピングを自律生成する
- 新機能追加時も世界観を壊さない

---

## Flow の方向性ルール

- **Input フェーズ** → Notion → GIOS（正同期）
- **Insight / Action / Learning フェーズ** → GIOS → Notion（逆同期）
- **Processing フェーズ** → GIOS 内部生成（同期しない）

---

## 1. Input（現実世界の事実）

### Customer（顧客）
```
customerId:       string  | [Growth, Story, Decision]  | 顧客ID
customerName:     string  | [Growth, Story]             | 顧客名
industry:         string  | [Growth]                   | 業種
companySize:      string  | [Growth]                   | 規模
contactPerson:    string  | [Voice, Story]             | 担当者
contactEmail:     string  | [Voice]                    | メール
```

### Value Moment（価値瞬間）
```
valueMomentId:    string  | [Growth, Story]  | Value Moment ID
valueMomentName:  string  | [Growth, Story]  | Value Moment
painPoint:        string  | [Growth, Evidence] | 課題
context:          string  | [Story, Growth]  | 文脈
```

### Experiment（実験）
```
experimentId:     string  | [Evidence]          | Experiment ID
hypothesis:       string  | [Evidence, Growth]  | 仮説
experimentMethod: string  | [Evidence]          | 実験方法
```

### PowerMeeting（会議）
```
agenda:           string   | [PowerMeeting]        | アジェンダ
participants:     string[] | [Voice, PowerMeeting] | 参加者
```

---

## 2. Processing（構造化・分析）

```
gapLevel:         number  | [Growth, Decision]  | Gap Level
priorityScore:    number  | [Growth]            | Priority
painSeverity:     number  | [Growth]            | Pain Severity
opportunitySize:  number  | [Growth]            | Opportunity Size
```

---

## 3. Insight（洞察）

```
successMetric:    string   | [Evidence]           | KPI
decisionRationale:string   | [Decision, Story]    | 選択理由
narrative:        string   | [Story]              | ストーリー
valueHypothesis:  string   | [Growth]             | 価値仮説
decisionOptions:  string[] | [Decision]           | 選択肢
```

---

## 4. Action（実行）

```
chosenOption:     string   | [Decision, PowerMeeting] | 決定内容
nextAction:       string   | [Decision, PowerMeeting] | 次のアクション
actionItems:      string[] | [PowerMeeting]            | アクションアイテム
owner:            string   | [PowerMeeting]            | Owner
dueDate:          date     | [PowerMeeting, Decision]  | 期限
meetingDecisions: string   | [PowerMeeting, Decision]  | 決定事項
meetingNotes:     string   | [PowerMeeting, Story]     | 議事録
```

---

## 5. Feedback（結果）

```
experimentResult: string  | [Evidence]        | 結果
customerFeedback: string  | [Story, Growth]   | 顧客反応
resultSignal:     string  | [Evidence]        | シグナル
```

---

## 6. Learning（学習）

```
learning:          string  | [Evidence, Story]    | 学び
updatedHypothesis: string  | [Evidence, Growth]   | 更新仮説
updatedNarrative:  string  | [Story]              | 更新ストーリー
playbookUpdate:    string  | [Growth, Evidence]   | プレイブック更新
bestPractice:      string  | [Growth]             | Best Practice
antiPattern:       string  | [Growth]             | Anti Pattern
```

---

## Notes（Claude Code への指針）

- `canonical` 名は絶対に変更しない
- 新しい変数を追加する場合は必ずこの辞書に登録する
- `flowPhase` を誤ると Intelligence Flow が破壊される
- `notionField` は Sync Layer の AutoMapper が自動参照する
- `intelligence` は各 Intelligence Module の処理対象を決める
