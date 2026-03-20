# skills/intelligence_flow.md
# Intelligence Flow Skill — GIOS 専用

## 因果ループ

```
Input → Processing → Insight → Action → Feedback → Learning → (次のInput)
```

## 各フェーズの責務

| Phase      | 役割                         | 方向                |
|------------|------------------------------|---------------------|
| Input      | 現実世界の事実を取り込む      | Notion → GIOS       |
| Processing | 構造化・分析・スコアリング    | GIOS 内部           |
| Insight    | 意味づけ・仮説生成            | GIOS 内部           |
| Action     | 意思決定・実行タスク生成      | GIOS → Notion       |
| Feedback   | 結果の観測・シグナル取得      | Notion → GIOS       |
| Learning   | 学習・OS 更新・次サイクルへ   | GIOS → Notion       |

## Intelligence の責務

| Intelligence  | 担当変数（主）                            |
|---------------|-------------------------------------------|
| Growth        | painPoint, gapLevel, valueHypothesis      |
| Evidence      | hypothesis, experimentResult, confidenceLevel |
| Story         | narrative, customerStory, updatedNarrative|
| Decision      | decisionOptions, chosenOption, rationale  |
| PowerMeeting  | agenda, actionItems, meetingDecisions     |

## 禁止事項

- Flow のフェーズを飛ばす（例: Input → Action）
- Intelligence の誤分類
- 因果ループを破壊する実装
