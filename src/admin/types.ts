// src/admin/types.ts
// Admin OS 型定義 — マルチテナント管理基盤のデータ構造
// 因果ループ: Tenant → User → Role → Permission → Intelligence → AuditLog

export type TenantStatus     = "active" | "suspended" | "trial";
export type SyncStatus       = "pending" | "synced" | "failed";
export type RoleScope        = "system" | "tenant";
export type ActivationStatus = "active" | "inactive";

export type Tenant = {
  id:         string;
  name:       string;
  status:     TenantStatus;
  plan:       string;
  created_at: string;
  updated_at: string;
};

export type User = {
  id:             string;
  tenant_id:      string | null;
  email:          string;
  name:           string;
  status:         string;
  is_super_admin: boolean;
  created_at:     string;
  updated_at:     string;
};

export type Role = {
  id:          string;
  tenant_id:   string | null;
  name:        string;
  description: string;
  scope:       RoleScope;
  created_at:  string;
  updated_at:  string;
};

export type Permission = {
  id:                string;
  code:              string;
  description:       string;
  intelligence_code: string | null;
  created_at:        string;
};

export type Intelligence = {
  code:        string;
  name:        string;
  description: string;
  created_at:  string;
};

export type TenantIntelligenceActivation = {
  id:                string;
  tenant_id:         string;
  intelligence_code: string;
  status:            ActivationStatus;
  config:            Record<string, unknown>;
  activated_at:      string | null;
  deactivated_at:    string | null;
};

export type FeatureFlag = {
  id:                string;
  tenant_id:         string | null;
  intelligence_code: string | null;
  key:               string;
  value:             unknown;
  description:       string;
  created_at:        string;
  updated_at:        string;
};

export type AuditLog = {
  id:                string;
  tenant_id:         string | null;
  actor_user_id:     string | null;
  intelligence_code: string | null;
  feature_key:       string | null;
  action:            string;
  entity_type:       string;
  entity_id:         string;
  before:            unknown;
  after:             unknown;
  correlation_id:    string | null;
  causal_chain_id:   string | null;
  sync_status:       string | null;
  created_at:        string;
};

export type SyncRecord = {
  id:                 string;
  tenant_id:          string;
  source:             string;
  source_entity_type: string;
  source_id:          string;
  target_entity_type: string;
  target_entity_id:   string;
  status:             SyncStatus;
  last_synced_at:     string | null;
  error_message:      string | null;
  correlation_id:     string | null;
  created_at:         string;
  updated_at:         string;
};
