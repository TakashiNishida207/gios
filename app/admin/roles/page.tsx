// app/admin/roles/page.tsx
// ロール管理 — 一覧 + 権限マトリクス + 編集ドロワー

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Role, Permission, AuditLog } from "@/admin/types";
import {
  AdminTable, Column, DetailPanel, EditDrawer, StatusBadge, AuditTimeline,
  PageHeader, FormField, DetailRow, SectionHeader, PrimaryButton,
  PermissionChip,
  inputStyle, selectStyle,
} from "@/admin/components";

// ─── Extended types ────────────────────────────────────────────────────────
type RoleWithPerms = Role & {
  user_count?: number;
  role_permissions?: { permission_id: string; permissions: { code: string; description: string } }[];
};

// ─── Mock data ─────────────────────────────────────────────────────────────
const MOCK_PERMISSIONS: Permission[] = [
  { id: "p-001", code: "tenants:write",      description: "テナント作成・更新・削除",       intelligence_code: null,      created_at: "2024-01-01T00:00:00Z" },
  { id: "p-002", code: "users:write",        description: "ユーザー管理",                   intelligence_code: null,      created_at: "2024-01-01T00:00:00Z" },
  { id: "p-003", code: "roles:write",        description: "ロール・権限管理",               intelligence_code: null,      created_at: "2024-01-01T00:00:00Z" },
  { id: "p-004", code: "intel:activate",     description: "インテリジェンス有効化",         intelligence_code: null,      created_at: "2024-01-01T00:00:00Z" },
  { id: "p-005", code: "audit:read",         description: "監査ログ閲覧",                   intelligence_code: null,      created_at: "2024-01-01T00:00:00Z" },
  { id: "p-006", code: "sync:write",         description: "同期設定・リトライ",             intelligence_code: null,      created_at: "2024-01-01T00:00:00Z" },
  { id: "p-007", code: "feature_flags:write",description: "フィーチャーフラグ管理",        intelligence_code: null,      created_at: "2024-01-01T00:00:00Z" },
];

const MOCK_ROLES: RoleWithPerms[] = [
  {
    id: "r-001", tenant_id: null, name: "SuperAdmin", scope: "system",
    description: "全権限を持つシステム管理者", user_count: 1,
    role_permissions: MOCK_PERMISSIONS.map((p) => ({ permission_id: p.id, permissions: { code: p.code, description: p.description } })),
    created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "r-002", tenant_id: null, name: "OrgAdmin", scope: "tenant",
    description: "テナント内のユーザー・インテリジェンスを管理", user_count: 5,
    role_permissions: [
      { permission_id: "p-002", permissions: { code: "users:write",    description: "ユーザー管理" } },
      { permission_id: "p-004", permissions: { code: "intel:activate", description: "インテリジェンス有効化" } },
      { permission_id: "p-005", permissions: { code: "audit:read",     description: "監査ログ閲覧" } },
    ],
    created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "r-003", tenant_id: null, name: "Operator", scope: "tenant",
    description: "日常運用・データ入力・レポート参照", user_count: 23,
    role_permissions: [
      { permission_id: "p-005", permissions: { code: "audit:read", description: "監査ログ閲覧" } },
    ],
    created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "r-004", tenant_id: null, name: "ReadOnly", scope: "tenant",
    description: "閲覧のみ — 変更権限なし", user_count: 12,
    role_permissions: [
      { permission_id: "p-005", permissions: { code: "audit:read", description: "監査ログ閲覧" } },
    ],
    created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z",
  },
];

const MOCK_AUDIT: AuditLog[] = [
  {
    id: "al-r-0001", tenant_id: null, actor_user_id: "u-11111111-0001",
    intelligence_code: null, feature_key: null,
    action: "update", entity_type: "role", entity_id: "r-002",
    before: { name: "OrgAdmin", permissions: 2 }, after: { name: "OrgAdmin", permissions: 3 },
    correlation_id: "corr-r-001", causal_chain_id: null, sync_status: "synced",
    created_at: "2026-03-12T10:00:00Z",
  },
];

// ─── Column definitions ────────────────────────────────────────────────────
const SCOPE_COLORS: Record<string, { color: string; bg: string }> = {
  system: { color: "var(--purple)", bg: "var(--purple-dim)" },
  tenant: { color: "var(--teal)",   bg: "var(--teal-dim)"   },
};

type RoleForm = { name: string; description: string; scope: string; permission_ids: string[] };
const DEFAULT_FORM: RoleForm = { name: "", description: "", scope: "tenant", permission_ids: [] };

const COLUMNS: Column<RoleWithPerms>[] = [
  {
    key: "name", label: "Role", width: "20%",
    render: (r) => <span style={{ fontWeight: 500, fontSize: 14, color: "var(--text-primary)" }}>{r.name}</span>,
  },
  {
    key: "description", label: "Description", width: "38%",
    render: (r) => <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{r.description}</span>,
  },
  {
    key: "user_count", label: "Users", width: "12%",
    render: (r) => (
      <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-secondary)" }}>
        {r.user_count ?? 0}
      </span>
    ),
  },
  {
    key: "scope", label: "Scope", width: "14%",
    render: (r) => {
      const c = SCOPE_COLORS[r.scope] ?? { color: "var(--text-secondary)", bg: "var(--bg3)" };
      return (
        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 20, fontFamily: "var(--mono)", fontSize: 11, color: c.color, background: c.bg }}>
          {r.scope}
        </span>
      );
    },
  },
  {
    key: "role_permissions", label: "Perms", width: "16%",
    render: (r) => (
      <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-tertiary)" }}>
        {r.role_permissions?.length ?? 0} permissions
      </span>
    ),
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────
export default function RolesPage() {
  const [roles,       setRoles]       = useState<RoleWithPerms[]>(MOCK_ROLES);
  const [permissions, setPermissions] = useState<Permission[]>(MOCK_PERMISSIONS);
  const [selected,    setSelected]    = useState<RoleWithPerms | null>(null);
  const [auditLogs,   setAuditLogs]   = useState<AuditLog[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [drawer,      setDrawer]      = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [form,        setForm]        = useState<RoleForm>(DEFAULT_FORM);
  const [isNew,       setIsNew]       = useState(false);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/roles");
      const data = await res.json();
      if (data.roles?.length)       setRoles(data.roles);
      if (data.permissions?.length) setPermissions(data.permissions);
    } catch { /* keep mock */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const loadAuditLogs = async (roleId: string) => {
    try {
      const res  = await fetch(`/api/admin/audit?entity_type=role&limit=10`);
      const data = await res.json();
      const filtered = (data.logs ?? []).filter((l: AuditLog) => l.entity_id === roleId);
      setAuditLogs(filtered.length ? filtered : MOCK_AUDIT.filter((l) => l.entity_id === roleId));
    } catch { setAuditLogs(MOCK_AUDIT.filter((l) => l.entity_id === roleId)); }
  };

  const handleSelect = (r: RoleWithPerms) => { setSelected(r); loadAuditLogs(r.id); };
  const openNew  = () => { setIsNew(true);  setForm(DEFAULT_FORM); setDrawer(true); };
  const openEdit = () => {
    if (!selected) return;
    setIsNew(false);
    const permIds = (selected.role_permissions ?? []).map((rp) => rp.permission_id);
    setForm({ name: selected.name, description: selected.description, scope: selected.scope, permission_ids: permIds });
    setDrawer(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew) {
        await fetch("/api/admin/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else if (selected) {
        await fetch(`/api/admin/roles/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      setDrawer(false);
      await loadRoles();
    } finally { setSaving(false); }
  };

  const togglePerm = (pid: string) =>
    setForm((f) => ({
      ...f,
      permission_ids: f.permission_ids.includes(pid)
        ? f.permission_ids.filter((id) => id !== pid)
        : [...f.permission_ids, pid],
    }));

  const selectedPermCodes = selected?.role_permissions?.map((rp) => rp.permissions.code) ?? [];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader
        tag="Admin OS"
        title="Roles & Permissions"
        description="ロールと権限マトリクスを管理する"
        action={<PrimaryButton onClick={openNew}>+ New Role</PrimaryButton>}
      />

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: selected ? "1fr 420px" : "1fr", overflow: "hidden" }}>
        <div style={{ overflowY: "auto" }}>
          <AdminTable columns={COLUMNS} rows={roles} selectedId={selected?.id} onSelect={handleSelect} loading={loading} emptyMessage="No roles yet" />
        </div>

        {selected && (
          <DetailPanel
            title={selected.name}
            subtitle={`scope: ${selected.scope} · ${selected.role_permissions?.length ?? 0} permissions · ${selected.user_count ?? 0} users`}
            onClose={() => setSelected(null)}
            onEdit={openEdit}
          >
            <DetailRow label="Name"        value={selected.name} />
            <DetailRow label="Scope"       value={<StatusBadge status={selected.scope} />} />
            <DetailRow label="Description" value={selected.description} />
            <DetailRow label="Users"       value={selected.user_count ?? 0} />

            <SectionHeader title="Permissions" />
            {selectedPermCodes.length === 0 ? (
              <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>No permissions assigned</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {selectedPermCodes.map((code) => <PermissionChip key={code} code={code} />)}
              </div>
            )}

            <SectionHeader title="Audit Timeline" />
            <AuditTimeline logs={auditLogs} />
          </DetailPanel>
        )}
      </div>

      <EditDrawer title={isNew ? "New Role" : "Edit Role"} open={drawer} onClose={() => setDrawer(false)} onSave={handleSave} saving={saving}>
        <FormField label="Name">
          <input style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="OrgAdmin" />
        </FormField>
        <FormField label="Description">
          <input style={inputStyle} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Role description" />
        </FormField>
        <FormField label="Scope">
          <select style={selectStyle} value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}>
            <option value="tenant">tenant</option>
            <option value="system">system</option>
          </select>
        </FormField>
        <FormField label="Permissions">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {permissions.map((p) => (
              <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={form.permission_ids.includes(p.id)} onChange={() => togglePerm(p.id)} style={{ accentColor: "var(--green)" }} />
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--teal)" }}>{p.code}</span>
                <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{p.description}</span>
              </label>
            ))}
          </div>
        </FormField>
      </EditDrawer>
    </div>
  );
}
