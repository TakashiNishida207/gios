// app/admin/audit/page.tsx
// 監査ログ — フィルタバー + テーブル + diff ビューア

"use client";

import { useState, useEffect, useCallback } from "react";
import type { AuditLog } from "@/admin/types";
import { AdminTable, Column, DetailPanel, ActionBadge, PageHeader, DetailRow, SectionHeader, inputStyle, selectStyle } from "@/admin/components";

const COLUMNS: Column<AuditLog>[] = [
  { key: "action",      label: "Action",      render: (r) => <ActionBadge action={r.action} />,             width: "10%" },
  { key: "entity_type", label: "Entity",      render: (r) => r.entity_type,                                 width: "15%" },
  { key: "entity_id",   label: "Entity ID",   render: (r) => <span style={{ fontFamily: "var(--mono)", fontSize: 9 }}>{r.entity_id.slice(0, 8)}…</span>, width: "12%" },
  { key: "actor_user_id", label: "Actor",     render: (r) => r.actor_user_id ? r.actor_user_id.slice(0, 8) + "…" : "system", width: "15%" },
  { key: "intelligence_code", label: "Intel", render: (r) => r.intelligence_code ?? "—",                    width: "12%" },
  { key: "sync_status", label: "Sync",        render: (r) => r.sync_status ?? "—",                          width: "10%" },
  { key: "created_at",  label: "Time",        render: (r) => new Date(r.created_at).toLocaleString(),        width: "26%" },
];

type Filters = { action: string; entity_type: string; intelligence_code: string; tenant_id: string };
const DEFAULT_FILTERS: Filters = { action: "", entity_type: "", intelligence_code: "", tenant_id: "" };

export default function AuditPage() {
  const [logs,     setLogs]     = useState<AuditLog[]>([]);
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [filters,  setFilters]  = useState<Filters>(DEFAULT_FILTERS);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (filters.action)           params.set("action",           filters.action);
    if (filters.entity_type)      params.set("entity_type",      filters.entity_type);
    if (filters.intelligence_code) params.set("intelligence_code", filters.intelligence_code);
    if (filters.tenant_id)        params.set("tenant_id",        filters.tenant_id);

    const res  = await fetch(`/api/admin/audit?${params}`);
    const data = await res.json();
    setLogs(data.logs ?? []);
    setLoading(false);
  }, [filters]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader
        tag="Admin OS"
        title="Audit Log"
        description="すべてのミューテーションと因果連鎖を追跡する"
      />

      {/* Filter bar */}
      <div style={{
        padding: "12px 28px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "var(--bg2)",
      }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>
          Filter
        </span>
        <select style={{ ...selectStyle, width: 100 }} value={filters.action} onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}>
          <option value="">All actions</option>
          <option value="create">create</option>
          <option value="update">update</option>
          <option value="delete">delete</option>
        </select>
        <select style={{ ...selectStyle, width: 120 }} value={filters.entity_type} onChange={(e) => setFilters((f) => ({ ...f, entity_type: e.target.value }))}>
          <option value="">All entities</option>
          <option value="tenant">tenant</option>
          <option value="user">user</option>
          <option value="role">role</option>
          <option value="intelligence_activation">intelligence</option>
          <option value="sync_record">sync</option>
        </select>
        <input
          style={{ ...inputStyle, width: 120 }}
          placeholder="intelligence code"
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
          style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", background: "transparent", border: "none", cursor: "pointer" }}
        >
          Clear
        </button>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
          {logs.length} records
        </span>
      </div>

      {/* Table + Diff Viewer */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: selected ? "55% 45%" : "1fr", overflow: "hidden" }}>
        <div style={{ overflowY: "auto" }}>
          <AdminTable columns={COLUMNS} rows={logs} selectedId={selected?.id} onSelect={setSelected} loading={loading} emptyMessage="No audit records" />
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
            <DetailRow label="Actor"       value={selected.actor_user_id ?? "system"} />
            <DetailRow label="Intelligence" value={selected.intelligence_code ?? "—"} />
            <DetailRow label="Feature Key" value={selected.feature_key ?? "—"} />
            <DetailRow label="Correlation" value={selected.correlation_id ?? "—"} />
            <DetailRow label="Sync Status" value={selected.sync_status ?? "—"} />

            {selected.before != null && (
              <>
                <SectionHeader title="Before" />
                <pre style={{
                  margin: 0, fontSize: 10, color: "var(--red)",
                  background: "var(--bg3)", borderRadius: 6,
                  padding: "10px 12px", overflowX: "auto",
                  fontFamily: "var(--mono)", lineHeight: 1.5, whiteSpace: "pre-wrap",
                }}>
                  {JSON.stringify(selected.before, null, 2)}
                </pre>
              </>
            )}

            {selected.after != null && (
              <>
                <SectionHeader title="After" />
                <pre style={{
                  margin: 0, fontSize: 10, color: "var(--green)",
                  background: "var(--bg3)", borderRadius: 6,
                  padding: "10px 12px", overflowX: "auto",
                  fontFamily: "var(--mono)", lineHeight: 1.5, whiteSpace: "pre-wrap",
                }}>
                  {JSON.stringify(selected.after, null, 2)}
                </pre>
              </>
            )}
          </DetailPanel>
        )}
      </div>
    </div>
  );
}
