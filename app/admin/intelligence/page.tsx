// app/admin/intelligence/page.tsx
// インテリジェンス管理 — 8インテリジェンス × テナント有効化マトリクス

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Intelligence, Tenant, TenantIntelligenceActivation } from "@/admin/types";
import { PageHeader, StatusBadge, Toggle, IntelligenceDot, MetricCard } from "@/admin/components";

// ─── Mock data ─────────────────────────────────────────────────────────────
const MOCK_INTELLIGENCES: Intelligence[] = [
  { code: "business",     name: "Business Intel",     description: "ビジネス構造・KPIの因果分析", created_at: "2024-01-01T00:00:00Z" },
  { code: "voice",        name: "Voice of Customer",  description: "顧客インサイトの自動抽出",   created_at: "2024-01-01T00:00:00Z" },
  { code: "growth",       name: "Growth Intel",       description: "成長ループの設計と追跡",     created_at: "2024-01-01T00:00:00Z" },
  { code: "decision",     name: "Decision Intel",     description: "意思決定フレームワーク",     created_at: "2024-01-01T00:00:00Z" },
  { code: "story",        name: "Story Intel",        description: "ナラティブ構造の最適化",     created_at: "2024-01-01T00:00:00Z" },
  { code: "powermeeting", name: "Power Meeting",      description: "会議の因果ループ設計",       created_at: "2024-01-01T00:00:00Z" },
  { code: "agent",        name: "Agent Intel",        description: "AI エージェント統合基盤",   created_at: "2024-01-01T00:00:00Z" },
  { code: "evidence",     name: "Evidence Intel",     description: "エビデンス収集・検証",       created_at: "2024-01-01T00:00:00Z" },
];

const MOCK_TENANTS: Tenant[] = [
  { id: "t-11111111-0001", name: "Acme Corp",  status: "active",    plan: "enterprise", created_at: "2025-08-10T09:00:00Z", updated_at: "2026-03-20T14:22:00Z" },
  { id: "t-22222222-0002", name: "TechStart",  status: "trial",     plan: "starter",    created_at: "2026-01-15T11:00:00Z", updated_at: "2026-03-22T08:10:00Z" },
  { id: "t-33333333-0003", name: "MegaCo",     status: "active",    plan: "enterprise", created_at: "2024-11-01T07:00:00Z", updated_at: "2026-03-21T19:45:00Z" },
  { id: "t-44444444-0004", name: "StudioZ",    status: "active",    plan: "growth",     created_at: "2025-06-22T10:30:00Z", updated_at: "2026-03-19T12:00:00Z" },
];

const ACTIVE_PAIRS = [
  ["t-11111111-0001", "business"],
  ["t-11111111-0001", "voice"],
  ["t-11111111-0001", "growth"],
  ["t-11111111-0001", "decision"],
  ["t-11111111-0001", "story"],
  ["t-11111111-0001", "powermeeting"],
  ["t-11111111-0001", "agent"],
  ["t-22222222-0002", "business"],
  ["t-22222222-0002", "growth"],
  ["t-33333333-0003", "business"],
  ["t-33333333-0003", "voice"],
  ["t-33333333-0003", "growth"],
  ["t-33333333-0003", "decision"],
  ["t-33333333-0003", "story"],
  ["t-33333333-0003", "powermeeting"],
  ["t-33333333-0003", "agent"],
  ["t-33333333-0003", "evidence"],
  ["t-44444444-0004", "business"],
  ["t-44444444-0004", "growth"],
  ["t-44444444-0004", "decision"],
  ["t-44444444-0004", "story"],
  ["t-44444444-0004", "powermeeting"],
];

function makeMockActivations(): TenantIntelligenceActivation[] {
  return ACTIVE_PAIRS.map(([tenant_id, code], i) => ({
    id: `act-${String(i).padStart(3, "0")}`,
    tenant_id,
    intelligence_code: code,
    status: "active" as const,
    config: {},
    activated_at: "2026-01-01T00:00:00Z",
    deactivated_at: null,
  }));
}

const MOCK_ACTIVATIONS = makeMockActivations();

// ─── Feature flag counts per intelligence (mock) ──────────────────────────
const FEATURE_FLAG_COUNTS: Record<string, number> = {
  business: 4, voice: 2, growth: 6, decision: 3,
  story: 2, powermeeting: 3, agent: 5, evidence: 1,
};

type IntelState = {
  intelligences: Intelligence[];
  activations:   TenantIntelligenceActivation[];
  tenants:       Tenant[];
};

// ─── Page ──────────────────────────────────────────────────────────────────
export default function IntelligencePage() {
  const [state,    setState]    = useState<IntelState>({
    intelligences: MOCK_INTELLIGENCES,
    activations:   MOCK_ACTIVATIONS,
    tenants:       MOCK_TENANTS,
  });
  const [loading,  setLoading]  = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/intelligence");
      const data = await res.json();
      if (data.intelligences?.length) {
        setState({ intelligences: data.intelligences ?? [], activations: data.activations ?? [], tenants: data.tenants ?? [] });
      }
    } catch { /* keep mock */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const getActivation = (tenantId: string, code: string) =>
    state.activations.find((a) => a.tenant_id === tenantId && a.intelligence_code === code);

  const toggle = async (tenantId: string, code: string) => {
    const key     = `${tenantId}:${code}`;
    setToggling(key);
    const current   = getActivation(tenantId, code);
    const newStatus = current?.status === "active" ? "inactive" : "active";

    // Optimistic UI update
    setState((s) => {
      const exists = s.activations.find((a) => a.tenant_id === tenantId && a.intelligence_code === code);
      if (exists) {
        return { ...s, activations: s.activations.map((a) => a.tenant_id === tenantId && a.intelligence_code === code ? { ...a, status: newStatus } : a) };
      }
      return {
        ...s,
        activations: [...s.activations, {
          id: `act-new-${Date.now()}`, tenant_id: tenantId, intelligence_code: code,
          status: newStatus, config: {}, activated_at: new Date().toISOString(), deactivated_at: null,
        }],
      };
    });

    try {
      await fetch(`/api/admin/intelligence/${code}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, status: newStatus }),
      });
    } catch { /* optimistic update stays */ }
    setToggling(null);
  };

  const totalActive   = state.activations.filter((a) => a.status === "active").length;
  const totalPossible = state.intelligences.length * state.tenants.length;
  const coveragePct   = totalPossible > 0 ? Math.round((totalActive / totalPossible) * 100) : 0;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader
        tag="Admin OS"
        title="Intelligence"
        description="8つのインテリジェンスをテナント単位で有効化・無効化する"
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        {/* Summary metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
          <MetricCard title="Active Activations" value={totalActive}    subtext={`/ ${totalPossible} possible`} color="var(--green)" />
          <MetricCard title="Coverage"           value={`${coveragePct}%`} subtext={`${state.tenants.length} tenants × ${state.intelligences.length} intelligences`} color={coveragePct >= 60 ? "var(--green)" : "var(--amber)"} />
          <MetricCard title="Feature Flags"      value={Object.values(FEATURE_FLAG_COUNTS).reduce((a, b) => a + b, 0)} subtext="across all intelligences" color="var(--blue)" />
        </div>

        {loading ? (
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)" }}>Loading…</p>
        ) : (
          <>
            {/* Intelligence cards */}
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 12 }}>
              Intelligences
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 32 }}>
              {state.intelligences.map((intel) => {
                const activeCount = state.activations.filter((a) => a.intelligence_code === intel.code && a.status === "active").length;
                const flagCount   = FEATURE_FLAG_COUNTS[intel.code] ?? 0;
                return (
                  <div key={intel.code} style={{
                    background: "var(--bg2)", border: "1px solid var(--border)",
                    borderRadius: 10, padding: "14px 16px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <IntelligenceDot code={intel.code} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{intel.name}</div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)" }}>{intel.code}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 10, minHeight: 28, lineHeight: "16px" }}>
                      {intel.description}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: activeCount > 0 ? "var(--green)" : "var(--text-tertiary)" }}>
                        {activeCount}/{state.tenants.length} active
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
                        {flagCount} flags
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Activation Matrix */}
            {state.tenants.length > 0 && (
              <>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 12 }}>
                  Activation Matrix
                </div>
                <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
                  <table style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "10px 16px", textAlign: "left", fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", borderBottom: "1px solid var(--border)", background: "var(--bg2)", minWidth: 160, whiteSpace: "nowrap" }}>
                          Tenant
                        </th>
                        {state.intelligences.map((intel) => (
                          <th key={intel.code} style={{ padding: "10px 8px", textAlign: "center", borderBottom: "1px solid var(--border)", background: "var(--bg2)", minWidth: 72 }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                              <IntelligenceDot code={intel.code} />
                              <span style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                {intel.code.slice(0, 5)}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {state.tenants.map((tenant, ti) => (
                        <tr key={tenant.id} style={{ borderBottom: ti < state.tenants.length - 1 ? "1px solid var(--border)" : "none" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 3 }}>{tenant.name}</div>
                            <StatusBadge status={tenant.status} />
                          </td>
                          {state.intelligences.map((intel) => {
                            const activation = getActivation(tenant.id, intel.code);
                            const isActive   = activation?.status === "active";
                            const key        = `${tenant.id}:${intel.code}`;
                            return (
                              <td key={intel.code} style={{ padding: "12px 8px", textAlign: "center" }}>
                                <Toggle
                                  on={isActive}
                                  disabled={toggling === key}
                                  onChange={() => toggle(tenant.id, intel.code)}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
