// app/admin/audit/page.tsx
// 監査ログ — フィルタバー + テーブル + diff ビューア

"use client";

import { useState, useEffect, useCallback } from "react";
import type { AuditLog } from "@/admin/types";
import {
  AdminTable, Column, DetailPanel, ActionBadge, DiffViewer,
  PageHeader, DetailRow, SectionHeader,
  inputStyle, selectStyle,
} from "@/admin/components";

// ─── Mock data ─────────────────────────────────────────────────────────────
const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: "al-0001", tenant_id: "t-11111111-0001", actor_user_id: "u-11111111-0001",
    intelligence_code: null, feature_key: null,
    action: "update", entity_type: "tenant", entity_id: "t-11111111-0001",
    before: { status: "trial", plan: "starter" },
    after:  { status: "active", plan: "enterprise" },
    correlation_id: "corr-0001", causal_chain_id: null, sync_status: "synced",
    created_at: "2026-03-20T14:22:00Z",
  },
  {
    id: "al-0002", tenant_id: "t-11111111-0001", actor_user_id: "u-11111111-0001",
    intelligence_code: "growth", feature_key: null,
    action: "create", entity_type: "intelligence_activation", entity_id: "act-007",
    before: null,
    after:  { tenant_id: "t-11111111-0001", intelligence_code: "growth", status: "active" },
    correlation_id: "corr-0002", causal_chain_id: null, sync_status: "synced",
    created_at: "2026-03-15T10:00:00Z",
  },
  {
    id: "al-0003", tenant_id: "t-22222222-0002", actor_user_id: "u-33333333-0003",
    intelligence_code: null, feature_key: null,
    action: "create", entity_type: "user", entity_id: "u-33333333-0003",
    before: null,
    after:  { email: "kenji@techstart.io", name: "Kenji Mori", status: "active" },
    correlation_id: "corr-0003", causal_chain_id: null, sync_status: "synced",
    created_at: "2026-03-14T09:15:00Z",
  },
  {
    id: "al-0004", tenant_id: "t-33333333-0003", actor_user_id: "u-44444444-0004",
    intelligence_code: "decision", feature_key: "decision_ai_v2",
    action: "update", entity_type: "feature_flag", entity_id: "ff-0042",
    before: { value: false },
    after:  { value: true },
    correlation_id: "corr-0004", causal_chain_id: null, sync_status: "synced",
    created_at: "2026-03-12T16:45:00Z",
  },
  {
    id: "al-0005", tenant_id: "t-55555555-0005", actor_user_id: null,
    intelligence_code: null, feature_key: null,
    action: "update", entity_type: "sync_record", entity_id: "sync-081",
    before: { status: "pending" },
    after:  { status: "failed", error_message: "Notion API rate limit exceeded" },
    correlation_id: "corr-0005", causal_chain_id: null, sync_status: "failed",
    created_at: "2026-03-10T03:02:00Z",
  },
];

// ─── Columns ───────────────────────────────────────────────────────────────
const COLUMNS: Column<AuditLog>[] = [
  {
    key: "action", label: "Action", width: "10%",
    render: (r) => <ActionBadge action={r.action} />,
  },
  {
    key: "entity_type", label: "Entity", width: "18%",
    render: (r) => <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{r.entity_type}</span>,
  },
  {
    key: "entity_id", label: "ID", width: "14%",
    render: (r) => <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>{r.entity_id.slice(0, 10)}…</span>,
  },
  {
    key: "actor_user_id", label: "Actor", width: "18%",
    render: (r) => (
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-secondary)" }}>
        {r.actor_user_id ? r.actor_user_id.slice(0, 12) + "…" : "system"}
      </span>
    ),
  },
  {
    key: "intelligence_code", label: "Intel", width: "12%",
    render: (r) => r.intelligence_code
      ? <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--amber)" }}>{r.intelligence_code}</span>
      : <span style={{ color: "var(--text-tertiary)" }}>—</span>,
  },
  {
    key: "sync_status", label: "Sync", width: "10%",
    render: (r) => r.sync_status
      ? <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: r.sync_status === "failed" ? "var(--red)" : r.sync_status === "pending" ? "var(--amber)" : "var(--green)" }}>{r.sync_status}</span>
      : <span style={{ color: "var(--text-tertiary)" }}>—</span>,
  },
  {
    key: "created_at", label: "Time", width: "18%",
    render: (r) => <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)" }}>{new Date(r.created_at).toLocaleString()}</span>,
  },
];

type Filters = { action: string; entity_type: string; intelligence_code: string; tenant_id: string };
const DEFAULT_FILTERS: Filters = { action: "", entity_type: "", intelligence_code: "", tenant_id: "" };

// ─── Page ──────────────────────────────────────────────────────────────────
export default function AuditPage() {
  const [logs,     setLogs]     = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [filters,  setFilters]  = useState<Filters>(DEFAULT_FILTERS);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filters.action)            params.set("action",            filters.action);
      if (filters.entity_type)       params.set("entity_type",       filters.entity_type);
      if (filters.intelligence_code) params.set("intelligence_code", filters.intelligence_code);
      if (filters.tenant_id)         params.set("tenant_id",         filters.tenant_id);

      const res  = await fetch(`/api/admin/audit?${params}`);
      const data = await res.json();
      if (data.logs?.length) setLogs(data.logs);
    } catch { /* keep mock */ }
    setLoading(false);
  }, [filters]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  // Client-side filter on mock data when no API
  const filteredLogs = logs.filter((l) => {
    if (filters.action           && l.action           !== filters.action)           return false;
    if (filters.entity_type      && l.entity_type      !== filters.entity_type)      return false;
    if (filters.intelligence_code && l.intelligence_code !== filters.intelligence_code) return false;
    if (filters.tenant_id        && l.tenant_id        !== filters.tenant_id)        return false;
    return true;
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader
        tag="Admin OS"
        title="Audit Log"
        description="すべてのミューテーションと因果連鎖を追跡する"
      />

      {/* Filter bar */}
      <div style={{
        padding: "10px 24px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "var(--bg2)",
        flexWrap: "wrap",
      }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>
          Filter
        </span>
        <select style={{ ...selectStyle, width: 110 }} value={filters.action} onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}>
          <option value="">All actions</option>
          <option value="create">create</option>
          <option value="update">update</option>
          <option value="delete">delete</option>
        </select>
        <select style={{ ...selectStyle, width: 140 }} value={filters.entity_type} onChange={(e) => setFilters((f) => ({ ...f, entity_type: e.target.value }))}>
          <option value="">All entities</option>
          <option value="tenant">tenant</option>
          <option value="user">user</option>
          <option value="role">role</option>
          <option value="intelligence_activation">intelligence</option>
          <option value="feature_flag">feature_flag</option>
          <option value="sync_record">sync</option>
        </select>
        <input
          style={{ ...inputStyle, width: 130 }}
          placeholder="intel code"
          value={filters.intelligence_code}
          onChange={(e) => setFilters((f) => ({ ...f, intelligence_code: e.target.value }))}
        />
        <input
          style={{ ...inputStyle, width: 140 }}
          placeholder="tenant_id"
          value={filters.tenant_id}
          onChange={(e) => setFilters((f) => ({ ...f, tenant_id: e.target.value }))}
        />
        <button
          onClick={() => setFilters(DEFAULT_FILTERS)}
          style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", background: "transparent", border: "none", cursor: "pointer", padding: "4px 8px" }}
        >
          Clear
        </button>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
          {filteredLogs.length} records
        </span>
      </div>

      {/* Table + Diff Viewer */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: selected ? "1fr 420px" : "1fr", overflow: "hidden" }}>
        <div style={{ overflowY: "auto" }}>
          <AdminTable
            columns={COLUMNS}
            rows={filteredLogs}
            selectedId={selected?.id}
            onSelect={setSelected}
            loading={loading}
            emptyMessage="No audit records"
          />
        </div>

        {selected && (
          <DetailPanel
            title={`${selected.action} ${selected.entity_type}`}
            subtitle={new Date(selected.created_at).toLocaleString()}
            onClose={() => setSelected(null)}
          >
            <DetailRow label="Action"      value={<ActionBadge action={selected.action} />} />
            <DetailRow label="Entity Type" value={selected.entity_type} />
            <DetailRow label="Entity ID"   value={<span style={{ fontFamily: "var(--mono)", fontSize: 10 }}>{selected.entity_id}</span>} />
            <DetailRow label="Actor"       value={<span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{selected.actor_user_id ?? "system"}</span>} />
            <DetailRow label="Intelligence" value={selected.intelligence_code ?? "—"} />
            <DetailRow label="Feature Key" value={selected.feature_key ?? "—"} />
            <DetailRow label="Correlation" value={<span style={{ fontFamily: "var(--mono)", fontSize: 10 }}>{selected.correlation_id ?? "—"}</span>} />
            <DetailRow label="Sync Status" value={selected.sync_status ?? "—"} />

            {(selected.before != null || selected.after != null) && (
              <>
                <SectionHeader title="Diff" />
                <DiffViewer before={selected.before} after={selected.after} />
              </>
            )}
          </DetailPanel>
        )}
      </div>
    </div>
  );
}
