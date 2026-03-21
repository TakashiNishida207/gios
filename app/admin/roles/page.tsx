// app/admin/roles/page.tsx
// ロール管理 — 一覧 + 権限マトリクス + 編集ドロワー

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Role, Permission, AuditLog } from "@/admin/types";
import {
  AdminTable, Column, DetailPanel, EditDrawer, StatusBadge, AuditTimeline,
  PageHeader, FormField, DetailRow, SectionHeader, PrimaryButton,
  inputStyle, selectStyle,
} from "@/admin/components";

type RoleWithPerms = Role & {
  role_permissions?: { permission_id: string; permissions: { code: string; description: string } }[];
};
type RoleForm = { name: string; description: string; scope: string; permission_ids: string[] };
const DEFAULT_FORM: RoleForm = { name: "", description: "", scope: "tenant", permission_ids: [] };

const COLUMNS: Column<RoleWithPerms>[] = [
  { key: "name",        label: "Name",        render: (r) => r.name,                                    width: "30%" },
  { key: "scope",       label: "Scope",       render: (r) => <StatusBadge status={r.scope} />,          width: "15%" },
  { key: "description", label: "Description", render: (r) => r.description,                             width: "40%" },
  { key: "created_at",  label: "Created",     render: (r) => new Date(r.created_at).toLocaleDateString(), width: "15%" },
];

export default function RolesPage() {
  const [roles,       setRoles]       = useState<RoleWithPerms[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selected,    setSelected]    = useState<RoleWithPerms | null>(null);
  const [auditLogs,   setAuditLogs]   = useState<AuditLog[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [drawer,      setDrawer]      = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [form,        setForm]        = useState<RoleForm>(DEFAULT_FORM);
  const [isNew,       setIsNew]       = useState(false);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/admin/roles");
    const data = await res.json();
    setRoles(data.roles ?? []);
    setPermissions(data.permissions ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const loadAuditLogs = async (roleId: string) => {
    const res  = await fetch(`/api/admin/audit?entity_type=role&limit=10`);
    const data = await res.json();
    setAuditLogs((data.logs ?? []).filter((l: AuditLog) => l.entity_id === roleId));
  };

  const handleSelect = (r: RoleWithPerms) => {
    setSelected(r);
    loadAuditLogs(r.id);
  };

  const openNew = () => {
    setIsNew(true);
    setForm(DEFAULT_FORM);
    setDrawer(true);
  };

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
    } finally {
      setSaving(false);
    }
  };

  const togglePerm = (pid: string) => {
    setForm((f) => ({
      ...f,
      permission_ids: f.permission_ids.includes(pid) ? f.permission_ids.filter((id) => id !== pid) : [...f.permission_ids, pid],
    }));
  };

  const selectedPerms = selected?.role_permissions?.map((rp) => rp.permissions.code) ?? [];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader
        tag="Admin OS"
        title="Roles & Permissions"
        description="ロールと権限マトリクスを管理する"
        action={<PrimaryButton onClick={openNew}>+ New Role</PrimaryButton>}
      />

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: selected ? "58% 42%" : "1fr", overflow: "hidden" }}>
        <div style={{ overflowY: "auto" }}>
          <AdminTable columns={COLUMNS} rows={roles} selectedId={selected?.id} onSelect={handleSelect} loading={loading} emptyMessage="No roles yet" />
        </div>

        {selected && (
          <DetailPanel title={selected.name} subtitle={`scope: ${selected.scope}`} onClose={() => setSelected(null)} onEdit={openEdit}>
            <DetailRow label="Name"        value={selected.name} />
            <DetailRow label="Scope"       value={<StatusBadge status={selected.scope} />} />
            <DetailRow label="Description" value={selected.description} />

            <SectionHeader title="Permissions" />
            {selectedPerms.length === 0 ? (
              <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>No permissions assigned</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {selectedPerms.map((code) => (
                  <span key={code} style={{ fontFamily: "var(--mono)", fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "var(--teal-dim)", color: "var(--teal)" }}>
                    {code}
                  </span>
                ))}
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {permissions.map((p) => (
              <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.permission_ids.includes(p.id)}
                  onChange={() => togglePerm(p.id)}
                  style={{ accentColor: "var(--green)" }}
                />
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-primary)" }}>{p.code}</span>
                <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{p.description}</span>
              </label>
            ))}
          </div>
        </FormField>
      </EditDrawer>
    </div>
  );
}
