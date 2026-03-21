// app/admin/users/page.tsx
// ユーザー管理 — 一覧 + 詳細パネル + 編集ドロワー

"use client";

import { useState, useEffect, useCallback } from "react";
import type { User, AuditLog } from "@/admin/types";
import {
  AdminTable, Column, DetailPanel, EditDrawer, StatusBadge, AuditTimeline,
  PageHeader, FormField, DetailRow, SectionHeader, PrimaryButton,
  inputStyle, selectStyle,
} from "@/admin/components";

type UserRow = User & { tenants?: { name: string } };
type UserForm = { name: string; email: string; status: string; is_super_admin: boolean; tenant_id: string };
const DEFAULT_FORM: UserForm = { name: "", email: "", status: "active", is_super_admin: false, tenant_id: "" };

const COLUMNS: Column<UserRow>[] = [
  { key: "email",          label: "Email",      render: (r) => r.email,                          width: "35%" },
  { key: "name",           label: "Name",       render: (r) => r.name,                           width: "20%" },
  { key: "status",         label: "Status",     render: (r) => <StatusBadge status={r.status} />, width: "15%" },
  { key: "is_super_admin", label: "SuperAdmin", render: (r) => r.is_super_admin ? "✓" : "—",     width: "15%" },
  { key: "created_at",     label: "Created",    render: (r) => new Date(r.created_at).toLocaleDateString(), width: "15%" },
];

export default function UsersPage() {
  const [users,    setUsers]    = useState<UserRow[]>([]);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [drawer,   setDrawer]   = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState<UserForm>(DEFAULT_FORM);
  const [isNew,    setIsNew]    = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const loadAuditLogs = async (userId: string) => {
    const res  = await fetch(`/api/admin/audit?entity_type=user&limit=10`);
    const data = await res.json();
    // filter client-side by entity_id
    setAuditLogs((data.logs ?? []).filter((l: AuditLog) => l.entity_id === userId));
  };

  const handleSelect = (u: UserRow) => {
    setSelected(u);
    loadAuditLogs(u.id);
  };

  const openNew = () => {
    setIsNew(true);
    setForm(DEFAULT_FORM);
    setDrawer(true);
  };

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
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader
        tag="Admin OS"
        title="Users"
        description="ユーザーアカウントとロール割り当てを管理する"
        action={<PrimaryButton onClick={openNew}>+ New User</PrimaryButton>}
      />

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: selected ? "60% 40%" : "1fr", overflow: "hidden" }}>
        <div style={{ overflowY: "auto" }}>
          <AdminTable columns={COLUMNS} rows={users} selectedId={selected?.id} onSelect={handleSelect} loading={loading} emptyMessage="No users yet" />
        </div>

        {selected && (
          <DetailPanel title={selected.name || selected.email} subtitle={selected.email} onClose={() => setSelected(null)} onEdit={openEdit}>
            <DetailRow label="Name"       value={selected.name} />
            <DetailRow label="Email"      value={selected.email} />
            <DetailRow label="Status"     value={<StatusBadge status={selected.status} />} />
            <DetailRow label="SuperAdmin" value={selected.is_super_admin ? "Yes" : "No"} />
            <DetailRow label="Tenant"     value={selected.tenant_id ?? "—"} />
            <DetailRow label="Created"    value={new Date(selected.created_at).toLocaleString()} />

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
