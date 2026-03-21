# PMF Data Dictionary

## structured_evidence variables (Notion sync対象)

| canonical | type | meaning |
|-----------|------|---------|
| segment | string | セグメント識別子 |
| retention_rate | float | 継続率（0-1） |
| behavior_change_score | float | 行動変容スコア（0-1） |
| time_to_value | float | 価値実感までの時間（日数）|
| segment_dominance | float | セグメント支配率（0-1） |
| sean_ellis_vd_ratio | float | Sean Ellis 非常に残念スコア（0-1） |
| value_moment_frequency | float | Value Moment 発生頻度（0-1） |
| emotional_dependency_score | float | 感情的依存スコア（0-1） |
| willingness_to_pay | float | 支払意欲（0-1） |
| ltv | float | LTV（正規化済み 0-1） |
| cac | float | CAC（正規化済み 0-1） |
| churn_sensitivity | float | 解約感度（0-1） |

## pmf_score variables (GIOS内部のみ)

| canonical | type | meaning |
|-----------|------|---------|
| behavioral_score | float | 行動スコア（0-1） |
| emotional_score | float | 感情スコア（0-1） |
| economic_score | float | 経済スコア（0-1） |
| pmf_score | float | 統合PMFスコア（0-100） |

## phase_judgment variables (GIOS内部のみ)

| canonical | type | meaning |
|-----------|------|---------|
| phase | enum | "Pre-PMF" \| "PMF" \| "Chasm" \| "Scale" |
| evidence_snapshot | jsonb | 判定時点のエビデンス全量 |
