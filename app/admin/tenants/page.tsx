// app/admin/tenants/page.tsx
// テナント管理 — 一覧 + 詳細パネル + 編集ドロワー

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Tenant, AuditLog } from "@/admin/types";
import {
  AdminTable, Column, DetailPanel, EditDrawer, StatusBadge, AuditTimeline,
  PageHeader, FormField, DetailRow, SectionHeader, PrimaryButton,
  inputStyle, selectStyle,
} from "@/admin/components";

type TenantForm = { name: string; status: string; plan: string };
const DEFAULT_FORM: TenantForm = { name: "", status: "trial", plan: "starter" };

const COLUMNS: Column<Tenant>[] = [
  { key: "name",       label: "Name",    render: (r) => r.name,              width: "35%" },
  { key: "status",     label: "Status",  render: (r) => <StatusBadge status={r.status} />, width: "15%" },
  { key: "plan",       label: "Plan",    render: (r) => r.plan,              width: "20%" },
  { key: "created_at", label: "Created", render: (r) => new Date(r.created_at).toLocaleDateString(), width: "30%" },
];

export default function TenantsPage() {
  const [tenants,  setTenants]  = useState<Tenant[]>([]);
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [drawer,   setDrawer]   = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState<TenantForm>(DEFAULT_FORM);
  const [isNew,    setIsNew]    = useState(false);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/admin/tenants");
    const data = await res.json();
    setTenants(data.tenants ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadTenants(); }, [loadTenants]);

  const loadAuditLogs = async (tenantId: string) => {
    const res  = await fetch(`/api/admin/audit?entity_type=tenant&tenant_id=${tenantId}&limit=10`);
    const data = await res.json();
    setAuditLogs(data.logs ?? []);
  };

  const handleSelect = (t: Tenant) => {
    setSelected(t);
    loadAuditLogs(t.id);
  };

  const openNew = () => {
    setIsNew(true);
    setForm(DEFAULT_FORM);
    setDrawer(true);
  };

  const openEdit = () => {
    if (!selected) return;
    setIsNew(false);
    setForm({ name: selected.name, status: selected.status, plan: selected.plan });
    setDrawer(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew) {
        await fetch("/api/admin/tenants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else if (selected) {
        await fetch(`/api/admin/tenants/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      setDrawer(false);
      await loadTenants();
    } finally {
      setSaving(false);
    }
  };

  const hasDetail = !!selected;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader
        tag="Admin OS"
        title="Tenants"
        description="テナントのライフサイクルとプランを管理する"
        action={<PrimaryButton onClick={openNew}>+ New Tenant</PrimaryButton>}
      />

      {/* Two-column body */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: hasDetail ? "60% 40%" : "1fr", overflow: "hidden" }}>
        {/* Table */}
        <div style={{ overflowY: "auto" }}>
          <AdminTable
            columns={COLUMNS}
            rows={tenants}
            selectedId={selected?.id}
            onSelect={handleSelect}
            loading={loading}
            emptyMessage="No tenants yet"
          />
        </div>

        {/* Detail Panel */}
        {selected && (
          <DetailPanel
            title={selected.name}
            subtitle={selected.id}
            onClose={() => setSelected(null)}
            onEdit={openEdit}
          >
            <DetailRow label="Status" value={<StatusBadge status={selected.status} />} />
            <DetailRow label="Plan"   value={selected.plan} />
            <DetailRow label="Created" value={new Date(selected.created_at).toLocaleString()} />
            <DetailRow label="Updated" value={new Date(selected.updated_at).toLocaleString()} />

            <SectionHeader title="Audit Timeline" />
            <AuditTimeline logs={auditLogs} />
          </DetailPanel>
        )}
      </div>

      {/* Edit Drawer */}
      <EditDrawer
        title={isNew ? "New Tenant" : "Edit Tenant"}
        open={drawer}
        onClose={() => setDrawer(false)}
        onSave={handleSave}
        saving={saving}
      >
        <FormField label="Name">
          <input style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Acme Corp" />
        </FormField>
        <FormField label="Status">
          <select style={selectStyle} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="trial">trial</option>
            <option value="active">active</option>
            <option value="suspended">suspended</option>
          </select>
        </FormField>
        <FormField label="Plan">
          <select style={selectStyle} value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}>
            <option value="starter">starter</option>
            <option value="growth">growth</option>
            <option value="enterprise">enterprise</option>
          </select>
        </FormField>
      </EditDrawer>
    </div>
  );
}
