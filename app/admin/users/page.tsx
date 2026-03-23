// app/admin/users/page.tsx
// ユーザー管理 — 一覧 + 詳細パネル + 編集ドロワー

"use client";

import { useState, useEffect, useCallback } from "react";
import type { User, AuditLog } from "@/admin/types";
import {
  AdminTable, Column, DetailPanel, EditDrawer, StatusBadge, AuditTimeline,
  PageHeader, FormField, DetailRow, SectionHeader, PrimaryButton,
  InitialAvatar, PermissionChip,
  inputStyle, selectStyle,
} from "@/admin/components";

// ─── Extended row ──────────────────────────────────────────────────────────
type UserRow = User & {
  role_name?:   string;
  tenant_name?: string;
};

// ─── Mock data ─────────────────────────────────────────────────────────────
const MOCK_USERS: UserRow[] = [
  {
    id: "u-11111111-0001", tenant_id: "t-11111111-0001", email: "takashi@acme.co",
    name: "Takashi Nishida", status: "active", is_super_admin: true,
    role_name: "SuperAdmin", tenant_name: "Acme Corp",
    created_at: "2025-08-10T09:00:00Z", updated_at: "2026-03-20T14:22:00Z",
  },
  {
    id: "u-22222222-0002", tenant_id: "t-11111111-0001", email: "yuki@acme.co",
    name: "Yuki Tanaka", status: "active", is_super_admin: false,
    role_name: "OrgAdmin", tenant_name: "Acme Corp",
    created_at: "2025-09-01T10:00:00Z", updated_at: "2026-03-18T09:00:00Z",
  },
  {
    id: "u-33333333-0003", tenant_id: "t-22222222-0002", email: "kenji@techstart.io",
    name: "Kenji Mori", status: "active", is_super_admin: false,
    role_name: "OrgAdmin", tenant_name: "TechStart",
    created_at: "2026-01-15T11:00:00Z", updated_at: "2026-03-22T08:10:00Z",
  },
  {
    id: "u-44444444-0004", tenant_id: "t-33333333-0003", email: "sarah@megaco.com",
    name: "Sarah Chen", status: "active", is_super_admin: false,
    role_name: "Operator", tenant_name: "MegaCo",
    created_at: "2024-11-05T07:00:00Z", updated_at: "2026-03-10T14:00:00Z",
  },
  {
    id: "u-55555555-0005", tenant_id: "t-55555555-0005", email: "alex@innovateco.net",
    name: "Alex Kim", status: "inactive", is_super_admin: false,
    role_name: "ReadOnly", tenant_name: "InnovateCo",
    created_at: "2025-03-07T16:00:00Z", updated_at: "2026-02-28T09:30:00Z",
  },
];

const MOCK_AUDIT: AuditLog[] = [
  {
    id: "al-u-0001", tenant_id: "t-11111111-0001", actor_user_id: "u-11111111-0001",
    intelligence_code: null, feature_key: null,
    action: "update", entity_type: "user", entity_id: "u-22222222-0002",
    before: { role_name: "Operator" }, after: { role_name: "OrgAdmin" },
    correlation_id: "corr-u-001", causal_chain_id: null, sync_status: "synced",
    created_at: "2026-03-18T09:00:00Z",
  },
];

// ─── Role color map ────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  SuperAdmin: "var(--purple)",
  OrgAdmin:   "var(--blue)",
  Operator:   "var(--teal)",
  ReadOnly:   "var(--text-secondary)",
};

type UserForm = { name: string; email: string; status: string; is_super_admin: boolean; tenant_id: string };
const DEFAULT_FORM: UserForm = { name: "", email: "", status: "active", is_super_admin: false, tenant_id: "" };

const COLUMNS: Column<UserRow>[] = [
  {
    key: "name", label: "Name", width: "28%",
    render: (r) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <InitialAvatar name={r.name || r.email} color={ROLE_COLORS[r.role_name ?? ""] ?? "var(--blue)"} />
        <div>
          <div style={{ fontWeight: 500, fontSize: 14, color: "var(--text-primary)" }}>{r.name || "—"}</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>{r.tenant_name ?? "—"}</div>
        </div>
      </div>
    ),
  },
  {
    key: "email", label: "Email", width: "28%",
    render: (r) => <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-secondary)" }}>{r.email}</span>,
  },
  {
    key: "role_name", label: "Role", width: "16%",
    render: (r) => {
      const color = ROLE_COLORS[r.role_name ?? ""] ?? "var(--text-secondary)";
      const bg    = color.replace(")", "-dim)").replace("var(--", "var(--");
      return r.role_name ? (
        <span style={{
          display: "inline-block", padding: "2px 8px", borderRadius: 20,
          fontFamily: "var(--mono)", fontSize: 11,
          color, background: color === "var(--purple)" ? "var(--purple-dim)" : color === "var(--blue)" ? "var(--blue-dim)" : color === "var(--teal)" ? "var(--teal-dim)" : "var(--bg3)",
          whiteSpace: "nowrap",
        }}>
          {r.role_name}
        </span>
      ) : <span style={{ color: "var(--text-tertiary)" }}>—</span>;
    },
  },
  {
    key: "status", label: "Status", width: "14%",
    render: (r) => <StatusBadge status={r.status} />,
  },
  {
    key: "is_super_admin", label: "SA", width: "14%",
    render: (r) => r.is_super_admin
      ? <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--purple)" }}>✓ super</span>
      : <span style={{ color: "var(--text-tertiary)" }}>—</span>,
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users,     setUsers]     = useState<UserRow[]>(MOCK_USERS);
  const [selected,  setSelected]  = useState<UserRow | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [drawer,    setDrawer]    = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState<UserForm>(DEFAULT_FORM);
  const [isNew,     setIsNew]     = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.users?.length) setUsers(data.users);
    } catch { /* keep mock */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const loadAuditLogs = async (userId: string) => {
    try {
      const res  = await fetch(`/api/admin/audit?entity_type=user&limit=10`);
      const data = await res.json();
      const filtered = (data.logs ?? []).filter((l: AuditLog) => l.entity_id === userId);
      setAuditLogs(filtered.length ? filtered : MOCK_AUDIT.filter((l) => l.entity_id === userId));
    } catch { setAuditLogs(MOCK_AUDIT.filter((l) => l.entity_id === userId)); }
  };

  const handleSelect = (u: UserRow) => { setSelected(u); loadAuditLogs(u.id); };
  const openNew  = () => { setIsNew(true);  setForm(DEFAULT_FORM); setDrawer(true); };
  const openEdit = () => {
    if (!selected) return;
    setIsNew(false);
    setForm({ name: selected.name, email: selected.email, status: selected.status, is_super_admin: selected.is_super_admin, tenant_id: selected.tenant_id ?? "" });
    setDrawer(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, tenant_id: form.tenant_id || null };
      if (isNew) {
        await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else if (selected) {
        await fetch(`/api/admin/users/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      setDrawer(false);
      await loadUsers();
    } finally { setSaving(false); }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader
        tag="Admin OS"
        title="Users"
        description="ユーザーアカウントとロール割り当てを管理する"
        action={<PrimaryButton onClick={openNew}>+ New User</PrimaryButton>}
      />

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: selected ? "1fr 420px" : "1fr", overflow: "hidden" }}>
        <div style={{ overflowY: "auto" }}>
          <AdminTable columns={COLUMNS} rows={users} selectedId={selected?.id} onSelect={handleSelect} loading={loading} emptyMessage="No users yet" />
        </div>

        {selected && (
          <DetailPanel
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <InitialAvatar name={selected.name || selected.email} color={ROLE_COLORS[selected.role_name ?? ""] ?? "var(--blue)"} />
                {selected.name || selected.email}
              </div>
            }
            subtitle={selected.email}
            onClose={() => setSelected(null)}
            onEdit={openEdit}
          >
            <DetailRow label="Email"     value={<span style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{selected.email}</span>} />
            <DetailRow label="Status"    value={<StatusBadge status={selected.status} />} />
            <DetailRow label="Role"      value={selected.role_name ?? "—"} />
            <DetailRow label="Tenant"    value={selected.tenant_name ?? selected.tenant_id ?? "—"} />
            <DetailRow label="SuperAdmin" value={selected.is_super_admin ? "Yes" : "No"} />
            <DetailRow label="Created"   value={new Date(selected.created_at).toLocaleDateString()} />

            {selected.role_name && (
              <>
                <SectionHeader title="Role Permissions" />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {selected.role_name === "SuperAdmin" && ["tenants:write","users:write","roles:write","intel:activate","audit:read","sync:write","feature_flags:write"].map((c) => <PermissionChip key={c} code={c} />)}
                  {selected.role_name === "OrgAdmin"   && ["users:write","roles:read","intel:activate","audit:read","sync:read"].map((c) => <PermissionChip key={c} code={c} />)}
                  {selected.role_name === "Operator"   && ["users:read","intel:read","audit:read"].map((c) => <PermissionChip key={c} code={c} />)}
                  {selected.role_name === "ReadOnly"   && ["audit:read"].map((c) => <PermissionChip key={c} code={c} />)}
                </div>
              </>
            )}

            <SectionHeader title="Audit Timeline" />
            <AuditTimeline logs={auditLogs} />
          </DetailPanel>
        )}
      </div>

      <EditDrawer title={isNew ? "New User" : "Edit User"} open={drawer} onClose={() => setDrawer(false)} onSave={handleSave} saving={saving}>
        <FormField label="Name">
          <input style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Takashi Nishida" />
        </FormField>
        <FormField label="Email">
          <input style={inputStyle} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="user@example.com" />
        </FormField>
        <FormField label="Status">
          <select style={selectStyle} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="suspended">suspended</option>
          </select>
        </FormField>
        <FormField label="Tenant ID (optional)">
          <input style={inputStyle} value={form.tenant_id} onChange={(e) => setForm((f) => ({ ...f, tenant_id: e.target.value }))} placeholder="uuid" />
        </FormField>
        <FormField label="Super Admin">
          <select style={selectStyle} value={String(form.is_super_admin)} onChange={(e) => setForm((f) => ({ ...f, is_super_admin: e.target.value === "true" }))}>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </FormField>
      </EditDrawer>
    </div>
  );
}
