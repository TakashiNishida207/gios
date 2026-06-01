// app/admin/sync/page.tsx
// 外部システム同期 — MetricCards + テーブル + 詳細パネル + リトライ

"use client";

import { useState, useEffect, useCallback } from "react";
import type { SyncRecord } from "@/admin/types";
import {
  AdminTable, Column, DetailPanel, StatusBadge, SyncStatusBadge, MetricCard,
  PageHeader, DetailRow, SectionHeader, selectStyle,
} from "@/admin/components";
import { usePreferences } from "@/ui/preferences";
import { useGDIOSStore } from "@/store";

type SyncRow = SyncRecord & { tenant_name?: string };

// ─── Notion 接続テストパネル ────────────────────────────────────────────────

type NotionStatus = {
  ok: boolean;
  notion?: { configured: boolean };
  store?: { inputKeys: string[]; insightKeys: string[]; actionKeys: string[]; learningKeys: string[]; pendingDiff: number };
  error?: string;
};

type SyncResult = {
  ok: boolean;
  direction?: string;
  forward?: number;
  backward?: number;
  synced?: number;
  error?: string;
};

function NotionPanel({ ja }: { ja: boolean }) {
  const [status,     setStatus]     = useState<NotionStatus | null>(null);
  const [checking,   setChecking]   = useState(false);
  const [syncing,    setSyncing]    = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  // Zustand クライアントストアへの書き込みアクション
  const setFlow         = useGDIOSStore((s) => s.setFlow);
  const setIntelligence = useGDIOSStore((s) => s.setIntelligence);
  const consumeDiff     = useGDIOSStore((s) => s.consumeDiff);

  /** サーバーストアのデータをクライアント Zustand ストアに反映 */
  const applyStoreData = useCallback((store: { flow?: Record<string, unknown>; intelligence?: Record<string, unknown> }) => {
    if (store.flow) {
      for (const [phase, data] of Object.entries(store.flow)) {
        if (data && typeof data === "object" && Object.keys(data).length > 0) {
          setFlow(phase as Parameters<typeof setFlow>[0], data as Record<string, unknown>);
        }
      }
    }
    if (store.intelligence) {
      for (const [intel, data] of Object.entries(store.intelligence)) {
        if (data && typeof data === "object" && Object.keys(data).length > 0) {
          setIntelligence(intel as Parameters<typeof setIntelligence>[0], data as Record<string, unknown>);
        }
      }
    }
  }, [setFlow, setIntelligence]);

  const checkStatus = async () => {
    setChecking(true);
    setSyncResult(null);
    try {
      const res  = await fetch("/api/sync");
      const data = await res.json();
      setStatus(data);
      // 既存のサーバーストアデータもクライアントへ反映
      if (data.ok && data.store) applyStoreData(data.store);
    } catch (e) {
      setStatus({ ok: false, error: String(e) });
    }
    setChecking(false);
  };

  const runSync = async (direction: "forward" | "backward" | "full") => {
    setSyncing(direction);
    setSyncResult(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000); // 30秒タイムアウト
    try {
      // backward / full 同期のとき、クライアントの __diff__ をサーバーに渡す
      const clientDiff = (direction === "forward") ? [] : consumeDiff();

      const res  = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction, clientDiff }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await res.json();
      setSyncResult(data);
      // 同期成功 → サーバーストアのデータをクライアント Zustand ストアへ即時反映
      if (data.ok && data.store) applyStoreData(data.store);
      if (data.ok) checkStatus();
    } catch (e) {
      clearTimeout(timer);
      const msg = e instanceof Error && e.name === "AbortError"
        ? "タイムアウト（30秒）：Notion API が応答しませんでした"
        : String(e);
      setSyncResult({ ok: false, error: msg });
    }
    setSyncing(null);
  };

  const dot = (on: boolean | undefined) => (
    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: on ? "var(--green)" : "var(--red)", marginRight: 5, verticalAlign: "middle" }} />
  );

  const btnStyle = (color: string, disabled: boolean): React.CSSProperties => ({
    fontFamily: "var(--mono)", fontSize: 10, fontWeight: 500,
    background: disabled ? "var(--bg3)" : color, color: disabled ? "var(--text-tertiary)" : "var(--bg)",
    border: "none", borderRadius: 5, padding: "5px 14px",
    cursor: disabled ? "not-allowed" : "pointer", letterSpacing: "0.04em",
    transition: "background 0.15s",
  });

  return (
    <div style={{ margin: "0 28px 16px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px" }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {ja ? "Notion 直接同期" : "Notion Direct Sync"}
          </span>
          {status && (
            <span style={{
              fontFamily: "var(--mono)", fontSize: 9,
              color: status.notion?.configured ? "var(--green)" : "var(--red)",
              background: status.notion?.configured ? "var(--green-dim)" : "var(--red-dim)",
              border: `1px solid ${status.notion?.configured ? "rgba(122,170,128,0.3)" : "rgba(181,110,110,0.3)"}`,
              borderRadius: 3, padding: "2px 7px",
            }}>
              {status.notion?.configured ? (ja ? "設定済 ✓" : "Configured ✓") : (ja ? "未設定" : "Not configured")}
            </span>
          )}
        </div>
        <button onClick={checkStatus} disabled={checking} style={btnStyle("var(--teal)", checking)}>
          {checking ? "…" : (ja ? "接続確認" : "Check Status")}
        </button>
      </div>

      {/* ステータス詳細 */}
      {status && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div style={{ background: "var(--bg3)", borderRadius: 7, padding: "10px 14px" }}>
            <p style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.08em" }}>
              {ja ? "接続" : "Connection"}
            </p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: status.ok ? "var(--green)" : "var(--red)", margin: 0 }}>
              {dot(status.ok)}{status.ok ? "OK" : "ERROR"}
            </p>
            {status.error && <p style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--red)", marginTop: 4, wordBreak: "break-all" }}>{status.error}</p>}
          </div>
          {status.store && (
            <div style={{ background: "var(--bg3)", borderRadius: 7, padding: "10px 14px" }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.08em" }}>
                {ja ? "ストア状態" : "Store State"}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {[
                  ["Input",    status.store.inputKeys.length],
                  ["Insight",  status.store.insightKeys.length],
                  ["Action",   status.store.actionKeys.length],
                  ["Learning", status.store.learningKeys.length],
                ].map(([label, count]) => (
                  <div key={label as string} style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 10 }}>
                    <span style={{ color: "var(--text-tertiary)" }}>{label}</span>
                    <span style={{ color: (count as number) > 0 ? "var(--green)" : "var(--text-tertiary)" }}>{count} fields</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 10, marginTop: 2, paddingTop: 4, borderTop: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-tertiary)" }}>Pending diff</span>
                  <span style={{ color: status.store.pendingDiff > 0 ? "var(--amber)" : "var(--text-tertiary)" }}>{status.store.pendingDiff}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 同期ボタン */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", marginRight: 4 }}>
          {ja ? "同期実行:" : "Run:"}
        </span>
        {(["forward", "backward", "full"] as const).map((dir) => (
          <button key={dir} onClick={() => runSync(dir)} disabled={!!syncing} style={btnStyle(
            dir === "forward" ? "var(--teal)" : dir === "backward" ? "var(--purple)" : "var(--amber)",
            !!syncing,
          )}>
            {syncing === dir ? "…" : dir === "forward" ? (ja ? "Notion→GDIOS" : "Notion→GDIOS") : dir === "backward" ? (ja ? "GDIOS→Notion" : "GDIOS→Notion") : (ja ? "双方向" : "Full Sync")}
          </button>
        ))}
      </div>

      {/* 同期結果 */}
      {syncResult && (
        <div style={{
          marginTop: 12, padding: "10px 14px", borderRadius: 7,
          background: syncResult.ok ? "var(--green-dim)" : "var(--red-dim)",
          border: `1px solid ${syncResult.ok ? "rgba(122,170,128,0.3)" : "rgba(181,110,110,0.3)"}`,
          fontFamily: "var(--mono)", fontSize: 11,
          color: syncResult.ok ? "var(--green)" : "var(--red)",
        }}>
          {syncResult.ok ? (
            syncResult.direction === "forward"  ? `✓ Notion → GDIOS: ${syncResult.synced} records synced` :
            syncResult.direction === "backward" ? `✓ GDIOS → Notion: ${syncResult.synced} records updated` :
            `✓ Full sync — Forward: ${syncResult.forward}, Backward: ${syncResult.backward}`
          ) : (
            `✕ ${syncResult.error}`
          )}
        </div>
      )}
    </div>
  );
}

const MOCK_SYNC: SyncRow[] = [
  { id: "sync-0001", tenant_id: "t-11111111-0001", tenant_name: "Acme Corp",   source: "notion", source_entity_type: "Page",     source_id: "notion-page-abc123", target_entity_type: "structured_evidence", target_entity_id: "ev-1001",     status: "synced",  last_synced_at: "2026-03-23T08:15:00Z", error_message: null, correlation_id: "corr-s-001", created_at: "2026-03-01T00:00:00Z", updated_at: "2026-03-23T08:15:00Z" },
  { id: "sync-0002", tenant_id: "t-33333333-0003", tenant_name: "MegaCo",      source: "notion", source_entity_type: "Database", source_id: "notion-db-xyz789",   target_entity_type: "pmf_score",           target_entity_id: "pmf-3001",    status: "synced",  last_synced_at: "2026-03-23T07:00:00Z", error_message: null, correlation_id: "corr-s-002", created_at: "2026-02-10T00:00:00Z", updated_at: "2026-03-23T07:00:00Z" },
  { id: "sync-0003", tenant_id: "t-22222222-0002", tenant_name: "TechStart",   source: "notion", source_entity_type: "Page",     source_id: "notion-page-def456", target_entity_type: "action_item",         target_entity_id: "act-2001",    status: "pending", last_synced_at: "2026-03-22T14:00:00Z", error_message: null, correlation_id: "corr-s-003", created_at: "2026-03-22T12:00:00Z", updated_at: "2026-03-22T14:00:00Z" },
  { id: "sync-0004", tenant_id: "t-44444444-0004", tenant_name: "StudioZ",     source: "notion", source_entity_type: "Page",     source_id: "notion-page-ghi012", target_entity_type: "structured_evidence", target_entity_id: "ev-4001",     status: "pending", last_synced_at: null,                    error_message: null, correlation_id: "corr-s-004", created_at: "2026-03-23T06:30:00Z", updated_at: "2026-03-23T06:30:00Z" },
  { id: "sync-0005", tenant_id: "t-55555555-0005", tenant_name: "InnovateCo",  source: "notion", source_entity_type: "Database", source_id: "notion-db-jkl345",   target_entity_type: "chasm_score",         target_entity_id: "chasm-5001",  status: "failed",  last_synced_at: "2026-03-10T02:58:00Z", error_message: "Notion API rate limit exceeded (429). Retry after 60s.", correlation_id: "corr-s-005", created_at: "2026-03-01T00:00:00Z", updated_at: "2026-03-10T03:02:00Z" },
];

export default function SyncPage() {
  const { lang } = usePreferences();
  const ja = lang === "ja";

  const [records,      setRecords]      = useState<SyncRow[]>(MOCK_SYNC);
  const [selected,     setSelected]     = useState<SyncRow | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [retrying,     setRetrying]     = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const COLUMNS: Column<SyncRow>[] = [
    { key: "tenant_name",        label: ja ? "テナント"     : "Tenant",    width: "18%", render: (r) => <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{r.tenant_name ?? r.tenant_id.slice(0, 8)}</span> },
    { key: "source",             label: ja ? "ソース"       : "Source",    width: "12%", render: (r) => <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--blue)" }}>{r.source}</span> },
    { key: "source_entity_type", label: ja ? "エンティティ" : "Entity",    width: "13%", render: (r) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.source_entity_type}</span> },
    { key: "target_entity_type", label: ja ? "ターゲット"   : "Target",    width: "18%", render: (r) => <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-secondary)" }}>{r.target_entity_type}</span> },
    { key: "status",             label: ja ? "ステータス"   : "Status",    width: "13%", render: (r) => <SyncStatusBadge status={r.status} /> },
    { key: "last_synced_at",     label: ja ? "最終同期"     : "Last Sync", width: "18%", render: (r) => <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)" }}>{r.last_synced_at ? new Date(r.last_synced_at).toLocaleString(ja ? "ja-JP" : "en-US") : (ja ? "未同期" : "Never")}</span> },
    { key: "error_message",      label: ja ? "エラー"       : "Error",     width: "8%",  render: (r) => r.error_message ? <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--red)" }}>✕ error</span> : <span style={{ color: "var(--text-tertiary)" }}>—</span> },
  ];

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
      await fetch("/api/admin/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      setRecords((rs) => rs.map((r) => r.id === id ? { ...r, status: "pending" as const, error_message: null } : r));
      if (selected?.id === id) setSelected((s) => s ? { ...s, status: "pending", error_message: null } : null);
    } finally { setRetrying(null); }
  };

  const filtered     = statusFilter ? records.filter((r) => r.status === statusFilter) : records;
  const syncedCount  = records.filter((r) => r.status === "synced").length;
  const pendingCount = records.filter((r) => r.status === "pending").length;
  const failedCount  = records.filter((r) => r.status === "failed").length;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader
        tag="Admin OS"
        title={ja ? "外部システム同期" : "External Sync"}
        description={ja ? "外部システムとの同期ステータスを監視・管理する" : "Monitor and manage sync status with external systems"}
      />

      {/* Notion 直接同期パネル */}
      <NotionPanel ja={ja} />

      {/* Metric cards */}
      <div style={{ padding: "0 28px 0", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <MetricCard title={ja ? "同期済"  : "Synced"}  value={syncedCount}  subtext={ja ? "同期完了"          : "successfully synced"}      color="var(--green)" />
        <MetricCard title={ja ? "保留中"  : "Pending"} value={pendingCount} subtext={ja ? "同期待ち"          : "awaiting sync"}             color="var(--amber)" />
        <MetricCard title={ja ? "失敗"    : "Failed"}  value={failedCount}  subtext={ja ? "要確認・再同期"    : "require attention / retry"} color={failedCount > 0 ? "var(--red)" : "var(--text-primary)"} />
      </div>

      {/* Status filter */}
      <div style={{ padding: "16px 28px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {ja ? "フィルター" : "Filter"}
        </span>
        <select style={{ ...selectStyle, width: 130 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">{ja ? "すべて" : "All status"}</option>
          <option value="synced">{ja ? "同期済" : "synced"}</option>
          <option value="pending">{ja ? "保留中" : "pending"}</option>
          <option value="failed">{ja ? "失敗" : "failed"}</option>
        </select>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
          {filtered.length} {ja ? "件" : "records"}
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
                    style={{ fontFamily: "var(--mono)", fontSize: 10, background: "var(--amber-dim)", color: "var(--amber)", border: "1px solid var(--amber)", borderRadius: 4, padding: "2px 8px", cursor: retrying === r.id ? "wait" : "pointer", opacity: retrying === r.id ? 0.5 : 1, whiteSpace: "nowrap" }}
                  >
                    {retrying === r.id ? "…" : (ja ? "再同期" : "Retry")}
                  </button>
                ) : null,
              },
            ]}
            rows={filtered}
            selectedId={selected?.id}
            onSelect={setSelected}
            loading={loading}
            emptyMessage={ja ? "同期レコードなし" : "No sync records"}
          />
        </div>

        {selected && (
          <DetailPanel
            title={`${selected.source} → ${selected.target_entity_type}`}
            subtitle={selected.id}
            onClose={() => setSelected(null)}
          >
            <DetailRow label={ja ? "ステータス"   : "Status"}      value={<SyncStatusBadge status={selected.status} />} />
            <DetailRow label={ja ? "テナント"     : "Tenant"}      value={selected.tenant_name ?? selected.tenant_id} />
            <DetailRow label={ja ? "ソース"       : "Source"}      value={<span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--blue)" }}>{selected.source}</span>} />
            <DetailRow label={ja ? "ソース種別"   : "Source Type"} value={selected.source_entity_type} />
            <DetailRow label={ja ? "ソースID"     : "Source ID"}   value={<span style={{ fontFamily: "var(--mono)", fontSize: 10 }}>{selected.source_id}</span>} />
            <DetailRow label={ja ? "ターゲット種別" : "Target Type"} value={selected.target_entity_type} />
            <DetailRow label={ja ? "ターゲットID" : "Target ID"}   value={<span style={{ fontFamily: "var(--mono)", fontSize: 10 }}>{selected.target_entity_id}</span>} />
            <DetailRow label={ja ? "最終同期"     : "Last Synced"} value={selected.last_synced_at ? new Date(selected.last_synced_at).toLocaleString(ja ? "ja-JP" : "en-US") : (ja ? "未同期" : "Never")} />
            <DetailRow label={ja ? "相関ID"       : "Correlation"} value={<span style={{ fontFamily: "var(--mono)", fontSize: 10 }}>{selected.correlation_id ?? "—"}</span>} />

            {selected.error_message && (
              <>
                <SectionHeader title={ja ? "エラー詳細" : "Error"} />
                <pre style={{ margin: 0, fontSize: 11, color: "var(--red)", background: "var(--bg3)", borderRadius: 6, padding: "10px 12px", whiteSpace: "pre-wrap", fontFamily: "var(--mono)", lineHeight: 1.5 }}>
                  {selected.error_message}
                </pre>
              </>
            )}

            {selected.status === "failed" && (
              <div style={{ marginTop: 16 }}>
                <button
                  onClick={() => handleRetry(selected.id)}
                  disabled={retrying === selected.id}
                  style={{ fontFamily: "var(--mono)", fontSize: 11, background: "var(--amber)", color: "var(--bg)", border: "none", borderRadius: 5, padding: "7px 16px", cursor: retrying === selected.id ? "wait" : "pointer", opacity: retrying === selected.id ? 0.5 : 1 }}
                >
                  {retrying === selected.id ? (ja ? "再試行中…" : "Retrying…") : (ja ? "再同期" : "Retry Sync")}
                </button>
              </div>
            )}
          </DetailPanel>
        )}
      </div>
    </div>
  );
}
