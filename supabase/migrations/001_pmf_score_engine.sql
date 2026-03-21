-- PMF Score Engine — DB Migration
-- 因果ループ: Notion evidence → structured_evidence → pmf_score → phase_judgment

-- 1. structured_evidence — Notion から同期されるエビデンス変数
CREATE TABLE IF NOT EXISTS structured_evidence (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  segment                   text        NOT NULL,
  retention_rate            float,
  behavior_change_score     float,
  time_to_value             float,
  segment_dominance         float,
  sean_ellis_vd_ratio       float,
  value_moment_frequency    float,
  emotional_dependency_score float,
  willingness_to_pay        float,
  ltv                       float,
  cac                       float,
  churn_sensitivity         float,
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS structured_evidence_segment_idx
  ON structured_evidence (segment);

-- 2. pmf_score — GIOS 内部計算結果（Notion 同期なし）
CREATE TABLE IF NOT EXISTS pmf_score (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  segment           text        NOT NULL,
  behavioral_score  float       NOT NULL,
  emotional_score   float       NOT NULL,
  economic_score    float       NOT NULL,
  pmf_score         float       NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pmf_score_segment_idx ON pmf_score (segment);
CREATE INDEX IF NOT EXISTS pmf_score_created_idx ON pmf_score (created_at DESC);

-- 3. phase_judgment — フェーズ判定履歴（GIOS 内部）
CREATE TABLE IF NOT EXISTS phase_judgment (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  segment           text        NOT NULL,
  phase             text        NOT NULL CHECK (phase IN ('Pre-PMF', 'PMF', 'Chasm', 'Scale')),
  evidence_snapshot jsonb       NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS phase_judgment_segment_idx ON phase_judgment (segment);
CREATE INDEX IF NOT EXISTS phase_judgment_created_idx ON phase_judgment (created_at DESC);
