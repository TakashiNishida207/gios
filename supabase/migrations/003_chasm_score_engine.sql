-- supabase/migrations/003_chasm_score_engine.sql
-- Chasm Breakthrough Phase Score Engine — DB スキーマ
-- 因果ループ: structured_chasm_evidence → chasm_score → chasm_phase_judgment
-- 重要: chasm_score は GIOS 内部指標。Notion に同期しない。
-- 重要: structured_chasm_evidence の変数は Notion に同期する。

-- ─── 1. structured_chasm_evidence ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS structured_chasm_evidence (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  segment                     text        NOT NULL UNIQUE,
  -- 支配次元
  win_rate                    float8      NOT NULL DEFAULT 0,  -- 0-1
  deal_velocity               float8      NOT NULL DEFAULT 1,  -- 日数 (> 0)
  renewal_rate                float8      NOT NULL DEFAULT 0,  -- 0-1
  multi_threading_score       float8      NOT NULL DEFAULT 0,  -- 0-1
  -- リファレンス次元
  reference_count             float8      NOT NULL DEFAULT 0,  -- 0-1 正規化済み
  reference_strength          float8      NOT NULL DEFAULT 0,  -- 0-1
  before_after_clarity        float8      NOT NULL DEFAULT 0,  -- 0-1
  industry_reference_density  float8      NOT NULL DEFAULT 0,  -- 0-1
  -- 拡張次元
  adjacent_segment_fit        float8      NOT NULL DEFAULT 0,  -- 0-1
  adoption_barrier            float8      NOT NULL DEFAULT 1,  -- > 0（逆数使用）
  price_sensitivity           float8      NOT NULL DEFAULT 1,  -- > 0（逆数使用）
  expansion_success_rate      float8      NOT NULL DEFAULT 0,  -- 0-1
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

-- ─── 2. chasm_score ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chasm_score (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  segment          text        NOT NULL,
  dominance_score  float8      NOT NULL,  -- 0-1
  reference_score  float8      NOT NULL,  -- 0-1
  expansion_score  float8      NOT NULL,  -- 0-1
  chasm_score      float8      NOT NULL,  -- 0-1 正規化済み（UI 表示時は × 100）
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── 3. chasm_phase_judgment ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chasm_phase_judgment (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  segment           text        NOT NULL,
  chasm_phase       text        NOT NULL CHECK (chasm_phase IN ('Pre-Chasm', 'Chasm', 'Breakthrough')),
  evidence_snapshot jsonb       NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_chasm_score_segment    ON chasm_score(segment);
CREATE INDEX IF NOT EXISTS idx_chasm_score_created_at ON chasm_score(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chasm_phase_segment    ON chasm_phase_judgment(segment);
