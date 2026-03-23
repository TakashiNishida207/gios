// app/admin/tenants/page.tsx
// テナント管理 — 一覧 + 詳細パネル + 編集ドロワー

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Tenant, AuditLog } from "@/admin/types";
import {
  AdminTable, Column, DetailPanel, EditDrawer, StatusBadge, SyncStatusBadge,
  AuditTimeline, PageHeader, FormField, DetailRow, SectionHeader,
  PrimaryButton, InitialAvatar, IntelligenceDot,
  inputStyle, selectStyle,
} from "@/admin/components";

// ─── Extended row type (display-only fields from join) ─────────────────────
type TenantRow = Tenant & {
  domain?:       string;
  user_count?:   number;
  intel_count?:  number;
  sync_status?:  string;
};

// ─── Mock data — seeded so UI is immediately visible ──────────────────────
const MOCK_TENANTS: TenantRow[] = [
  {
    id: "t-11111111-0001", name: "Acme Corp",    status: "active",    plan: "enterprise",
    domain: "acme.co",          user_count: 42,  intel_count: 7, sync_status: "synced",
    created_at: "2025-08-10T09:00:00Z", updated_at: "2026-03-20T14:22:00Z",
  },
  {
    id: "t-22222222-0002", name: "TechStart",    status: "trial",     plan: "starter",
    domain: "techstart.io",     user_count: 5,   intel_count: 2, sync_status: "pending",
    created_at: "2026-01-15T11:00:00Z", updated_at: "2026-03-22T08:10:00Z",
  },
  {
    id: "t-33333333-0003", name: "MegaCo",       status: "active",    plan: "enterprise",
    domain: "megaco.com",       user_count: 180, intel_count: 8, sync_status: "synced",
    created_at: "2024-11-01T07:00:00Z", updated_at: "2026-03-21T19:45:00Z",
  },
  {
    id: "t-44444444-0004", name: "StudioZ",      status: "active",    plan: "growth",
    domain: "studioz.jp",       user_count: 14,  intel_count: 5, sync_status: "synced",
    created_at: "2025-06-22T10:30:00Z", updated_at: "2026-03-19T12:00:00Z",
  },
  {
    id: "t-55555555-0005", name: "InnovateCo",   status: "suspended", plan: "growth",
    domain: "innovateco.net",   user_count: 8,   intel_count: 3, sync_status: "failed",
    created_at: "2025-03-07T16:00:00Z", updated_at: "2026-02-28T09:30:00Z",
  },
];

const MOCK_AUDIT: AuditLog[] = [
  {
    id: "al-0001", tenant_id: "t-11111111-0001", actor_user_id: "u-admin-001",
    intelligence_code: null, feature_key: null,
    action: "update", entity_type: "tenant", entity_id: "t-11111111-0001",
    before: { status: "trial" }, after: { status: "active" },
    correlation_id: "corr-0001", causal_chain_id: null, sync_status: "synced",
    created_at: "2026-03-20T14:22:00Z",
  },
  {
    id: "al-0002", tenant_id: "t-11111111-0001", actor_user_id: "u-admin-001",
    intelligence_code: "growth", feature_key: null,
    action: "create", entity_type: "intelligence_activation", entity_id: "t-11111111-0001",
    before: null, after: { intelligence_code: "growth", status: "active" },
    correlation_id: "corr-0002", causal_chain_id: null, sync_status: "synced",
    created_at: "2026-03-15T10:00:00Z",
  },
];

const INTEL_CODES_ALL = ["business", "voice", "growth", "decision", "story", "powermeeting", "agent", "evidence"];

// ─── Column definitions ────────────────────────────────────────────────────
type TenantForm = { name: string; status: string; plan: string };
const DEFAULT_FORM: TenantForm = { name: "", status: "trial", plan: "starter" };

const COLUMNS: Column<TenantRow>[] = [
  {
    key: "name", label: "Tenant", width: "28%",
    render: (r) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <InitialAvatar name={r.name} color="var(--teal)" />
        <div>
          <div style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: 14 }}>{r.name}</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>{r.domain ?? "—"}</div>
        </div>
      </div>
    ),
  },
  {
    key: "status", label: "Status", width: "13%",
    render: (r) => <StatusBadge status={r.status} />,
  },
  {
    key: "user_count", label: "Users", width: "10%",
    render: (r) => (
      <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-secondary)" }}>
        {r.user_count ?? 0}
      </span>
    ),
  },
  {
    key: "intel_count", label: "Intel Coverage", width: "22%",
    render: (r) => {
      const count = r.intel_count ?? 0;
      const pct   = Math.round((count / 8) * 100);
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 4, background: "var(--bg3)", borderRadius: 2, overflow: "hidden", maxWidth: 80 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: pct >= 75 ? "var(--green)" : pct >= 40 ? "var(--amber)" : "var(--text-tertiary)", borderRadius: 2, transition: "width 0.4s" }} />
          </div>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>{count}/8</span>
        </div>
      );
    },
  },
  {
    key: "sync_status", label: "Sync", width: "13%",
    render: (r) => <SyncStatusBadge status={r.sync_status ?? "pending"} />,
  },
  {
    key: "plan", label: "Plan", width: "14%",
    render: (r) => <StatusBadge status={r.plan} />,
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────
export default function TenantsPage() {
  const [tenants,   setTenants]   = useState<TenantRow[]>(MOCK_TENANTS);
  const [selected,  setSelected]  = useState<TenantRow | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [drawer,    setDrawer]    = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState<TenantForm>(DEFAULT_FORM);
  const [isNew,     setIsNew]     = useState(false);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/tenants");
      const data = await res.json();
      if (data.tenants?.length) setTenants(data.tenants);
    } catch { /* keep mock data */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadTenants(); }, [loadTenants]);

  const loadAuditLogs = async (tenantId: string) => {
    try {
      const res  = await fetch(`/api/admin/audit?entity_type=tenant&tenant_id=${tenantId}&limit=10`);
      const data = await res.json();
      if (data.logs?.length) setAuditLogs(data.logs);
      else setAuditLogs(MOCK_AUDIT.filter((l) => l.tenant_id === tenantId));
    } catch { setAuditLogs(MOCK_AUDIT.filter((l) => l.tenant_id === tenantId)); }
  };

  const handleSelect = (t: TenantRow) => {
    setSelected(t);
    loadAuditLogs(t.id);
  };

  const openNew = () => { setIsNew(true); setForm(DEFAULT_FORM); setDrawer(true); };
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
    } finally { setSaving(false); }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader
        tag="Admin OS"
        title="Tenants"
        description="テナントのライフサイクルとプランを管理する"
        action={<PrimaryButton onClick={openNew}>+ New Tenant</PrimaryButton>}
      />

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: selected ? "1fr 420px" : "1fr", overflow: "hidden" }}>
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

        {selected && (
          <DetailPanel
            title={selected.name}
            subtitle={selected.domain ?? selected.id}
            onClose={() => setSelected(null)}
            onEdit={openEdit}
          >
            <DetailRow label="Status"  value={<StatusBadge status={selected.status} />} />
            <DetailRow label="Plan"    value={<StatusBadge status={selected.plan} />} />
            <DetailRow label="Users"   value={selected.user_count ?? "—"} />
            <DetailRow label="Domain"  value={selected.domain ?? "—"} />
            <DetailRow label="Created" value={new Date(selected.created_at).toLocaleDateString()} />
            <DetailRow label="Updated" value={new Date(selected.updated_at).toLocaleDateString()} />
            <DetailRow label="Sync"    value={<SyncStatusBadge status={selected.sync_status ?? "pending"} />} />

            <SectionHeader title="Intelligence Activation" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
              {INTEL_CODES_ALL.map((code) => {
                const active = (selected.intel_count ?? 0) > INTEL_CODES_ALL.indexOf(code) * 1.1;
                return (
                  <div key={code} style={{ display: "flex", alignItems: "center", gap: 4, opacity: active ? 1 : 0.3 }}>
                    <IntelligenceDot code={code} />
                    <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)" }}>{code}</span>
                  </div>
                );
              })}
            </div>

            <SectionHeader title="Audit Timeline" />
            <AuditTimeline logs={auditLogs} />
          </DetailPanel>
        )}
      </div>

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
