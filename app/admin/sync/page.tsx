// app/admin/sync/page.tsx
// 同期レコード — MetricCards + テーブル + 詳細パネル + リトライ

"use client";

import { useState, useEffect, useCallback } from "react";
import type { SyncRecord } from "@/admin/types";
import {
  AdminTable, Column, DetailPanel, StatusBadge, SyncStatusBadge, MetricCard,
  PageHeader, DetailRow, SectionHeader, selectStyle,
} from "@/admin/components";

type SyncRow = SyncRecord & { tenant_name?: string };

// ─── Mock data ─────────────────────────────────────────────────────────────
const MOCK_SYNC: SyncRow[] = [
  {
    id: "sync-0001", tenant_id: "t-11111111-0001", tenant_name: "Acme Corp",
    source: "notion", source_entity_type: "Page", source_id: "notion-page-abc123",
    target_entity_type: "structured_evidence", target_entity_id: "ev-1001",
    status: "synced", last_synced_at: "2026-03-23T08:15:00Z",
    error_message: null, correlation_id: "corr-s-001",
    created_at: "2026-03-01T00:00:00Z", updated_at: "2026-03-23T08:15:00Z",
  },
  {
    id: "sync-0002", tenant_id: "t-33333333-0003", tenant_name: "MegaCo",
    source: "notion", source_entity_type: "Database", source_id: "notion-db-xyz789",
    target_entity_type: "pmf_score", target_entity_id: "pmf-3001",
    status: "synced", last_synced_at: "2026-03-23T07:00:00Z",
    error_message: null, correlation_id: "corr-s-002",
    created_at: "2026-02-10T00:00:00Z", updated_at: "2026-03-23T07:00:00Z",
  },
  {
    id: "sync-0003", tenant_id: "t-22222222-0002", tenant_name: "TechStart",
    source: "notion", source_entity_type: "Page", source_id: "notion-page-def456",
    target_entity_type: "action_item", target_entity_id: "act-2001",
    status: "pending", last_synced_at: "2026-03-22T14:00:00Z",
    error_message: null, correlation_id: "corr-s-003",
    created_at: "2026-03-22T12:00:00Z", updated_at: "2026-03-22T14:00:00Z",
  },
  {
    id: "sync-0004", tenant_id: "t-44444444-0004", tenant_name: "StudioZ",
    source: "notion", source_entity_type: "Page", source_id: "notion-page-ghi012",
    target_entity_type: "structured_evidence", target_entity_id: "ev-4001",
    status: "pending", last_synced_at: null,
    error_message: null, correlation_id: "corr-s-004",
    created_at: "2026-03-23T06:30:00Z", updated_at: "2026-03-23T06:30:00Z",
  },
  {
    id: "sync-0005", tenant_id: "t-55555555-0005", tenant_name: "InnovateCo",
    source: "notion", source_entity_type: "Database", source_id: "notion-db-jkl345",
    target_entity_type: "chasm_score", target_entity_id: "chasm-5001",
    status: "failed", last_synced_at: "2026-03-10T02:58:00Z",
    error_message: "Notion API rate limit exceeded (429). Retry after 60s.",
    correlation_id: "corr-s-005",
    created_at: "2026-03-01T00:00:00Z", updated_at: "2026-03-10T03:02:00Z",
  },
];

// ─── Columns ───────────────────────────────────────────────────────────────
const COLUMNS: Column<SyncRow>[] = [
  {
    key: "tenant_name", label: "Tenant", width: "18%",
    render: (r) => <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{r.tenant_name ?? r.tenant_id.slice(0, 8)}</span>,
  },
  {
    key: "source", label: "Source", width: "12%",
    render: (r) => <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--blue)" }}>{r.source}</span>,
  },
  {
    key: "source_entity_type", label: "Entity", width: "13%",
    render: (r) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.source_entity_type}</span>,
  },
  {
    key: "target_entity_type", label: "Target", width: "18%",
    render: (r) => <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-secondary)" }}>{r.target_entity_type}</span>,
  },
  {
    key: "status", label: "Status", width: "13%",
    render: (r) => <SyncStatusBadge status={r.status} />,
  },
  {
    key: "last_synced_at", label: "Last Sync", width: "18%",
    render: (r) => (
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
        {r.last_synced_at ? new Date(r.last_synced_at).toLocaleString() : "Never"}
      </span>
    ),
  },
  {
    key: "error_message", label: "Error", width: "8%",
    render: (r) => r.error_message
      ? <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--red)" }}>✕ error</span>
      : <span style={{ color: "var(--text-tertiary)" }}>—</span>,
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────
export default function SyncPage() {
  const [records,      setRecords]     = useState<SyncRow[]>(MOCK_SYNC);
  const [selected,     setSelected]    = useState<SyncRow | null>(null);
  const [loading,      setLoading]     = useState(false);
  const [retrying,     setRetrying]    = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res  = await fetch(`/api/admin/sync?${params}`);
      const data = await res.json();
      if (data.records?.length) setRecords(data.records);
    } catch { /* keep mock */ }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const handleRetry = async (id: string) => {
    setRetrying(id);
    try {
      await fetch("/api/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      // Optimistic: mark as pending
      setRecords((rs) => rs.map((r) => r.id === id ? { ...r, status: "pending" as const, error_message: null } : r));
      if (selected?.id === id) setSelected((s) => s ? { ...s, status: "pending", error_message: null } : null);
    } finally { setRetrying(null); }
  };

  const filtered      = statusFilter ? records.filter((r) => r.status === statusFilter) : records;
  const syncedCount   = records.filter((r) => r.status === "synced").length;
  const pendingCount  = records.filter((r) => r.status === "pending").length;
  const failedCount   = records.filter((r) => r.status === "failed").length;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader
        tag="Admin OS"
        title="Sync Records"
        description="外部システムとの同期ステータスを監視・管理する"
      />

      {/* Metric cards */}
      <div style={{ padding: "20px 28px 0", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <MetricCard title="Synced"  value={syncedCount}  subtext="successfully synced"       color="var(--green)" />
        <MetricCard title="Pending" value={pendingCount} subtext="awaiting sync"              color="var(--amber)" />
        <MetricCard title="Failed"  value={failedCount}  subtext="require attention / retry"  color={failedCount > 0 ? "var(--red)" : "var(--text-primary)"} />
      </div>

      {/* Status filter */}
      <div style={{ padding: "16px 28px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Filter</span>
        <select style={{ ...selectStyle, width: 130 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All status</option>
          <option value="synced">synced</option>
          <option value="pending">pending</option>
          <option value="failed">failed</option>
        </select>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
          {filtered.length} records
        </span>
      </div>

      {/* Table + Detail */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: selected ? "1fr 420px" : "1fr", overflow: "hidden" }}>
        <div style={{ overflowY: "auto" }}>
          <AdminTable
            columns={[
              ...COLUMNS,
              {
                key: "retry", label: "", width: "8%",
                render: (r) => r.status === "failed" ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRetry(r.id); }}
                    disabled={retrying === r.id}
                    style={{
                      fontFamily: "var(--mono)", fontSize: 10,
                      background: "var(--amber-dim)", color: "var(--amber)",
                      border: "1px solid var(--amber)", borderRadius: 4,
                      padding: "2px 8px", cursor: retrying === r.id ? "wait" : "pointer",
                      opacity: retrying === r.id ? 0.5 : 1, whiteSpace: "nowrap",
                    }}
                  >
                    {retrying === r.id ? "…" : "Retry"}
                  </button>
                ) : null,
              },
            ]}
            rows={filtered}
            selectedId={selected?.id}
            onSelect={setSelected}
            loading={loading}
            emptyMessage="No sync records"
          />
        </div>

        {selected && (
          <DetailPanel
            title={`${selected.source} → ${selected.target_entity_type}`}
            subtitle={selected.id}
            onClose={() => setSelected(null)}
          >
            <DetailRow label="Status"      value={<SyncStatusBadge status={selected.status} />} />
            <DetailRow label="Tenant"      value={selected.tenant_name ?? selected.tenant_id} />
            <DetailRow label="Source"      value={<span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--blue)" }}>{selected.source}</span>} />
            <DetailRow label="Source Type" value={selected.source_entity_type} />
            <DetailRow label="Source ID"   value={<span style={{ fontFamily: "var(--mono)", fontSize: 10 }}>{selected.source_id}</span>} />
            <DetailRow label="Target Type" value={selected.target_entity_type} />
            <DetailRow label="Target ID"   value={<span style={{ fontFamily: "var(--mono)", fontSize: 10 }}>{selected.target_entity_id}</span>} />
            <DetailRow label="Last Synced" value={selected.last_synced_at ? new Date(selected.last_synced_at).toLocaleString() : "Never"} />
            <DetailRow label="Correlation" value={<span style={{ fontFamily: "var(--mono)", fontSize: 10 }}>{selected.correlation_id ?? "—"}</span>} />

            {selected.error_message && (
              <>
                <SectionHeader title="Error" />
                <pre style={{
                  margin: 0, fontSize: 11, color: "var(--red)",
                  background: "var(--bg3)", borderRadius: 6,
                  padding: "10px 12px", whiteSpace: "pre-wrap",
                  fontFamily: "var(--mono)", lineHeight: 1.5,
                }}>
                  {selected.error_message}
                </pre>
              </>
            )}

            {selected.status === "failed" && (
              <div style={{ marginTop: 16 }}>
                <button
                  onClick={() => handleRetry(selected.id)}
                  disabled={retrying === selected.id}
                  style={{
                    fontFamily: "var(--mono)", fontSize: 11,
                    background: "var(--amber)", color: "var(--bg)",
                    border: "none", borderRadius: 5,
                    padding: "7px 16px", cursor: retrying === selected.id ? "wait" : "pointer",
                    opacity: retrying === selected.id ? 0.5 : 1,
                  }}
                >
                  {retrying === selected.id ? "Retrying…" : "Retry Sync"}
                </button>
              </div>
            )}
          </DetailPanel>
        )}
      </div>
    </div>
  );
}
