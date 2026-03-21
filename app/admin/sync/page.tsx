// app/admin/sync/page.tsx
// 同期レコード — ステータス管理 + リトライ

"use client";

import { useState, useEffect, useCallback } from "react";
import type { SyncRecord } from "@/admin/types";
import { AdminTable, Column, DetailPanel, StatusBadge, PageHeader, DetailRow, SectionHeader, selectStyle } from "@/admin/components";

type SyncRow = SyncRecord & { tenants?: { name: string } };

const COLUMNS: Column<SyncRow>[] = [
  { key: "source",             label: "Source",  render: (r) => r.source,                                   width: "15%" },
  { key: "source_entity_type", label: "Entity",  render: (r) => r.source_entity_type,                       width: "15%" },
  { key: "source_id",          label: "ID",      render: (r) => <span style={{ fontFamily: "var(--mono)", fontSize: 9 }}>{r.source_id.slice(0, 10)}…</span>, width: "15%" },
  { key: "status",             label: "Status",  render: (r) => <StatusBadge status={r.status} />,          width: "12%" },
  { key: "last_synced_at",     label: "Synced",  render: (r) => r.last_synced_at ? new Date(r.last_synced_at).toLocaleString() : "—", width: "23%" },
  { key: "error_message",      label: "Error",   render: (r) => <span style={{ color: "var(--red)", fontSize: 10 }}>{r.error_message ?? "—"}</span>, width: "20%" },
];

export default function SyncPage() {
  const [records,  setRecords]  = useState<SyncRow[]>([]);
  const [selected, setSelected] = useState<SyncRow | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const loadRecords = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const res  = await fetch(`/api/admin/sync?${params}`);
    const data = await res.json();
    setRecords(data.records ?? []);
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
      await loadRecords();
    } finally {
      setRetrying(null);
    }
  };

  const failedCount  = records.filter((r) => r.status === "failed").length;
  const pendingCount = records.filter((r) => r.status === "pending").length;
  const syncedCount  = records.filter((r) => r.status === "synced").length;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader
        tag="Admin OS"
        title="Sync Records"
        description="外部システムとの同期ステータスを監視・管理する"
      />

      {/* Stats row */}
      <div style={{ padding: "16px 28px", borderBottom: "1px solid var(--border)", display: "flex", gap: 24, background: "var(--bg2)" }}>
        {[
          { label: "Synced",  count: syncedCount,  color: "var(--green)" },
          { label: "Pending", count: pendingCount, color: "var(--amber)" },
          { label: "Failed",  count: failedCount,  color: "var(--red)"   },
        ].map(({ label, count, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 300, color }}>{count}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <select style={{ ...selectStyle, width: 120 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All status</option>
            <option value="synced">synced</option>
            <option value="pending">pending</option>
            <option value="failed">failed</option>
          </select>
        </div>
      </div>

      {/* Table + Detail */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: selected ? "58% 42%" : "1fr", overflow: "hidden" }}>
        <div style={{ overflowY: "auto" }}>
          <AdminTable
            columns={[
              ...COLUMNS,
              {
                key: "retry",
                label: "",
                render: (r) => r.status === "failed" ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRetry(r.id); }}
                    disabled={retrying === r.id}
                    style={{
                      fontFamily: "var(--mono)", fontSize: 10,
                      background: "var(--amber-dim)", color: "var(--amber)",
                      border: "1px solid var(--amber)", borderRadius: 4,
                      padding: "2px 8px", cursor: retrying === r.id ? "wait" : "pointer",
                      opacity: retrying === r.id ? 0.5 : 1,
                    }}
                  >
                    {retrying === r.id ? "…" : "Retry"}
                  </button>
                ) : null,
                width: "10%",
              },
            ]}
            rows={records}
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
            <DetailRow label="Status"      value={<StatusBadge status={selected.status} />} />
            <DetailRow label="Source"      value={selected.source} />
            <DetailRow label="Source Type" value={selected.source_entity_type} />
            <DetailRow label="Source ID"   value={<span style={{ fontFamily: "var(--mono)", fontSize: 10 }}>{selected.source_id}</span>} />
            <DetailRow label="Target Type" value={selected.target_entity_type} />
            <DetailRow label="Target ID"   value={<span style={{ fontFamily: "var(--mono)", fontSize: 10 }}>{selected.target_entity_id}</span>} />
            <DetailRow label="Last Synced" value={selected.last_synced_at ? new Date(selected.last_synced_at).toLocaleString() : "Never"} />
            <DetailRow label="Correlation" value={selected.correlation_id ?? "—"} />

            {selected.error_message && (
              <>
                <SectionHeader title="Error" />
                <pre style={{ margin: 0, fontSize: 10, color: "var(--red)", background: "var(--bg3)", borderRadius: 6, padding: "10px 12px", whiteSpace: "pre-wrap", fontFamily: "var(--mono)" }}>
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
