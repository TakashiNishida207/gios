// app/admin/intelligence/page.tsx
// インテリジェンス管理 — 8インテリジェンス × テナント有効化マトリクス

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Intelligence, Tenant, TenantIntelligenceActivation } from "@/admin/types";
import { PageHeader, StatusBadge } from "@/admin/components";

type IntelState = {
  intelligences: Intelligence[];
  activations:   TenantIntelligenceActivation[];
  tenants:       Tenant[];
};

const INTEL_ICONS: Record<string, string> = {
  business:     "B",
  voice:        "V",
  growth:       "G",
  decision:     "D",
  story:        "S",
  powermeeting: "P",
  agent:        "A",
  evidence:     "E",
};

export default function IntelligencePage() {
  const [state,   setState]   = useState<IntelState>({ intelligences: [], activations: [], tenants: [] });
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null); // "tenantId:code"

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/admin/intelligence");
    const data = await res.json();
    setState({ intelligences: data.intelligences ?? [], activations: data.activations ?? [], tenants: data.tenants ?? [] });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const getActivation = (tenantId: string, code: string): TenantIntelligenceActivation | undefined =>
    state.activations.find((a) => a.tenant_id === tenantId && a.intelligence_code === code);

  const toggle = async (tenantId: string, code: string) => {
    const key = `${tenantId}:${code}`;
    setToggling(key);
    const current = getActivation(tenantId, code);
    const newStatus = current?.status === "active" ? "inactive" : "active";
    await fetch(`/api/admin/intelligence/${code}/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId, status: newStatus }),
    });
    await load();
    setToggling(null);
  };

  const activeCounts = state.intelligences.map((intel) => ({
    code:  intel.code,
    count: state.activations.filter((a) => a.intelligence_code === intel.code && a.status === "active").length,
  }));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader
        tag="Admin OS"
        title="Intelligence"
        description="8つのインテリジェンスをテナント単位で有効化・無効化する"
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        {loading ? (
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)" }}>Loading…</p>
        ) : (
          <>
            {/* Intelligence cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
              {state.intelligences.map((intel) => {
                const count = activeCounts.find((c) => c.code === intel.code)?.count ?? 0;
                return (
                  <div key={intel.code} style={{
                    background: "var(--bg2)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "16px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: "var(--teal-dim)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--mono)", fontSize: 13, color: "var(--teal)", fontWeight: 600,
                      }}>
                        {INTEL_ICONS[intel.code] ?? "?"}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{intel.name}</div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)" }}>{intel.code}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 10, minHeight: 32 }}>
                      {intel.description}
                    </p>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: count > 0 ? "var(--green)" : "var(--text-tertiary)" }}>
                      {count} / {state.tenants.length} tenants active
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Activation matrix */}
            {state.tenants.length > 0 && (
              <>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 12 }}>
                  Activation Matrix
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", borderBottom: "1px solid var(--border)", background: "var(--bg2)", minWidth: 160 }}>
                          Tenant
                        </th>
                        {state.intelligences.map((intel) => (
                          <th key={intel.code} style={{ padding: "8px 10px", textAlign: "center", fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", borderBottom: "1px solid var(--border)", background: "var(--bg2)", minWidth: 80 }}>
                            {INTEL_ICONS[intel.code]}
                            <br />
                            <span style={{ fontSize: 8 }}>{intel.code}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {state.tenants.map((tenant) => (
                        <tr key={tenant.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--text-primary)" }}>
                            <div>{tenant.name}</div>
                            <StatusBadge status={tenant.status} />
                          </td>
                          {state.intelligences.map((intel) => {
                            const activation = getActivation(tenant.id, intel.code);
                            const isActive   = activation?.status === "active";
                            const key        = `${tenant.id}:${intel.code}`;
                            const isToggling = toggling === key;
                            return (
                              <td key={intel.code} style={{ padding: "10px", textAlign: "center" }}>
                                <button
                                  onClick={() => toggle(tenant.id, intel.code)}
                                  disabled={isToggling}
                                  style={{
                                    width: 36, height: 20,
                                    borderRadius: 10,
                                    border: "none",
                                    background: isActive ? "var(--green)" : "var(--bg3)",
                                    cursor: isToggling ? "wait" : "pointer",
                                    transition: "background 0.2s",
                                    opacity: isToggling ? 0.5 : 1,
                                    position: "relative",
                                  }}
                                  title={isActive ? "Deactivate" : "Activate"}
                                >
                                  <div style={{
                                    position: "absolute",
                                    top: 3, left: isActive ? 18 : 3,
                                    width: 14, height: 14,
                                    borderRadius: "50%",
                                    background: "var(--bg)",
                                    transition: "left 0.2s",
                                  }} />
                                </button>
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

            {state.tenants.length === 0 && (
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
                No tenants found. Create tenants first to manage intelligence activation.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
