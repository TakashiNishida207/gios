-- supabase/migrations/002_admin_os.sql
-- GIOS Admin OS — マルチテナント管理基盤
-- 因果ループ: Tenant → User → Role → Permission → Intelligence → AuditLog

-- ─── 1. tenants ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  status      text        NOT NULL DEFAULT 'trial' CHECK (status IN ('active', 'suspended', 'trial')),
  plan        text        NOT NULL DEFAULT 'starter',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── 2. users ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        REFERENCES tenants(id) ON DELETE CASCADE,
  email           text        NOT NULL UNIQUE,
  name            text        NOT NULL,
  status          text        NOT NULL DEFAULT 'active',
  is_super_admin  boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 3. roles ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = system role
  name        text        NOT NULL,
  description text        NOT NULL DEFAULT '',
  scope       text        NOT NULL DEFAULT 'tenant' CHECK (scope IN ('system', 'tenant')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── 4. permissions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permissions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code              text        NOT NULL UNIQUE,
  description       text        NOT NULL DEFAULT '',
  intelligence_code text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── 5. role_permissions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS role_permissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id       uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE (role_id, permission_id)
);

-- ─── 6. user_roles ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE (user_id, role_id)
);

-- ─── 7. intelligences ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS intelligences (
  code        text        PRIMARY KEY,
  name        text        NOT NULL,
  description text        NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── 8. tenant_intelligence_activation ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_intelligence_activation (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  intelligence_code  text        NOT NULL REFERENCES intelligences(code) ON DELETE CASCADE,
  status             text        NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
  config             jsonb       NOT NULL DEFAULT '{}',
  activated_at       timestamptz,
  deactivated_at     timestamptz,
  UNIQUE (tenant_id, intelligence_code)
);

-- ─── 9. feature_flags ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_flags (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid        REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = global
  intelligence_code text        REFERENCES intelligences(code) ON DELETE SET NULL,  -- NULL = applies to all
  key               text        NOT NULL,
  value             jsonb       NOT NULL DEFAULT 'null',
  description       text        NOT NULL DEFAULT '',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key)
);

-- ─── 10. audit_logs ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid        REFERENCES tenants(id) ON DELETE SET NULL,
  actor_user_id     uuid        REFERENCES users(id) ON DELETE SET NULL,
  intelligence_code text,
  feature_key       text,
  action            text        NOT NULL,
  entity_type       text        NOT NULL,
  entity_id         text        NOT NULL,
  before            jsonb,
  after             jsonb,
  correlation_id    uuid,
  causal_chain_id   uuid,
  sync_status       text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── 11. sync_records ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_records (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source              text        NOT NULL,
  source_entity_type  text        NOT NULL,
  source_id           text        NOT NULL,
  target_entity_type  text        NOT NULL,
  target_entity_id    text        NOT NULL,
  status              text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'failed')),
  last_synced_at      timestamptz,
  error_message       text,
  correlation_id      uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_tenant_id       ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_tenant_id       ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id  ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_records_status   ON sync_records(status);
CREATE INDEX IF NOT EXISTS idx_tia_tenant_id         ON tenant_intelligence_activation(tenant_id);

-- ─── Seed: intelligences ──────────────────────────────────────────────────────
INSERT INTO intelligences (code, name, description) VALUES
  ('business',     'Business Intelligence',     'ビジネス構造と因果関係を分析・可視化する'),
  ('voice',        'Voice Intelligence',        '顧客の声をリアルタイムで収集・構造化する'),
  ('growth',       'Growth Intelligence',       '成長ドライバーを特定し戦略的施策を生成する'),
  ('decision',     'Decision Intelligence',     '意思決定の質を高めるフレームワークを提供する'),
  ('story',        'Story Intelligence',        'ビジネスの物語を構造化し伝達力を最大化する'),
  ('powermeeting', 'PowerMeeting Intelligence', '会議の生産性と意思決定速度を最大化する'),
  ('agent',        'AI Agent Intelligence',     '自律的なAIエージェントでビジネスを加速する'),
  ('evidence',     'Evidence Intelligence',     'エビデンスを収集・検証し意思決定を支援する')
ON CONFLICT (code) DO NOTHING;

-- ─── Seed: permissions ────────────────────────────────────────────────────────
INSERT INTO permissions (code, description) VALUES
  ('tenant.manage',       'テナントの作成・編集・削除'),
  ('user.manage',         'ユーザーの作成・編集・削除'),
  ('role.manage',         'ロールと権限の管理'),
  ('settings.manage',     'グローバル設定・フィーチャーフラグの管理'),
  ('audit.view',          '監査ログの参照'),
  ('intelligence.manage', 'インテリジェンスの有効化・無効化'),
  ('sync.manage',         '同期レコードの管理・リトライ')
ON CONFLICT (code) DO NOTHING;

-- ─── Seed: system roles ───────────────────────────────────────────────────────
INSERT INTO roles (name, description, scope) VALUES
  ('SuperAdmin', 'すべてのテナント・モジュールにアクセス可能', 'system'),
  ('OrgAdmin',   '自組織テナントのみ管理可能',                  'system'),
  ('Operator',   '限定的な書き込み権限を持つ',                   'system'),
  ('ReadOnly',   '読み取り専用（書き込み不可）',                  'system')
ON CONFLICT DO NOTHING;
