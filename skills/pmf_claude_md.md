# PMF Score Engine — CLAUDE.md Extension

## Philosophy
PMF Score はビジネスの「現実」を数値化する唯一の軸。
感情・行動・経済の3次元を統合し、段階判定（PMF / Chasm / Scale / Pre-PMF）を行う。

## 絶対ルール
- PMF Score は Notion に同期しない（GIOS 内部指標）
- Evidence 変数は Notion と双方向同期する
- 計算は必ず segment 単位で行う
- 変数名は Data Dictionary に完全準拠（snake_case）

## 因果ループにおける位置
Input（Notion evidence） → Processing（score_engine） → PMF Score → Phase Judgment → Action

## Phase Thresholds
- Pre-PMF : pmf_score < 60
- PMF     : pmf_score >= 60
- Chasm   : pmf_score >= 70 AND segment_dominance >= 0.6
- Scale   : pmf_score >= 75 AND growth_channels >= 2
