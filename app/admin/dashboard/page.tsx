// app/admin/dashboard/page.tsx
// Admin OS ダッシュボード — System Health × Intelligence Status × Tenant Health × Monitor
// 因果ループ: Tenant → User/Role → Intelligence → Sync → Audit

"use client";

import {
  MetricCard, PageHeader, StatusBadge, SyncStatusBadge,
  ActionBadge, IntelligenceDot,
} from "@/admin/components";

// ─── Mock data ─────────────────────────────────────────────────────────────

const MOCK_TENANTS = [
  { id: "t-001", name: "Acme Corp",   status: "active",    plan: "enterprise", users: 42,  intelCount: 7, syncStatus: "synced"  },
  { id: "t-002", name: "TechStart",   status: "trial",     plan: "starter",    users: 5,   intelCount: 2, syncStatus: "pending" },
  { id: "t-003", name: "MegaCo",      status: "active",    plan: "enterprise", users: 180, intelCount: 8, syncStatus: "synced"  },
  { id: "t-004", name: "StudioZ",     status: "active",    plan: "growth",     users: 14,  intelCount: 5, syncStatus: "synced"  },
  { id: "t-005", name: "InnovateCo",  status: "suspended", plan: "growth",     users: 8,   intelCount: 3, syncStatus: "failed"  },
];

const INTEL_LIST = [
  { code: "business",     name: "Business",     activeCount: 4, flagCount: 4, color: "var(--blue)"   },
  { code: "voice",        name: "Voice",         activeCount: 3, flagCount: 2, color: "var(--teal)"   },
  { code: "growth",       name: "Growth",        activeCount: 4, flagCount: 6, color: "var(--green)"  },
  { code: "decision",     name: "Decision",      activeCount: 3, flagCount: 3, color: "var(--amber)"  },
  { code: "story",        name: "Story",         activeCount: 3, flagCount: 2, color: "var(--purple)" },
  { code: "powermeeting", name: "Power Meeting", activeCount: 3, flagCount: 3, color: "var(--accent)" },
  { code: "agent",        name: "Agent",         activeCount: 2, flagCount: 5, color: "var(--red)"    },
  { code: "evidence",     name: "Evidence",      activeCount: 2, flagCount: 1, color: "var(--teal)"   },
];

const TOTAL_TENANTS = MOCK_TENANTS.length;
const ACTIVE_TENANTS = MOCK_TENANTS.length;
const TOTAL_USERS    = MOCK_TENANTS.reduce((s, t) => s + t.users, 0);
const ACTIVE_USERS   = MOCK_TENANTS.filter((t) => t.status !== "suspended").reduce((s, t) => s + t.users, 0);
const TOTAL_POSSIBLE = INTEL_LIST.length * TOTAL_TENANTS;
const TOTAL_ACTIVE   = INTEL_LIST.reduce((s, i) => s + i.activeCount, 0);
const COVERAGE_PCT   = Math.round((TOTAL_ACTIVE / TOTAL_POSSIBLE) * 100);

const MOCK_AUDIT_RECENT = [
  { id: "al-001", action: "update", entity_type: "tenant",   actor: "Takashi Nishida", time: "2026-03-23T14:22:00Z" },
  { id: "al-002", action: "create", entity_type: "intel_act",actor: "Yuki Tanaka",      time: "2026-03-23T10:00:00Z" },
  { id: "al-003", action: "update", entity_type: "feature_flag", actor: "Sarah Chen",  time: "2026-03-22T16:45:00Z" },
  { id: "al-004", action: "update", entity_type: "sync_record",  actor: "system",      time: "2026-03-22T03:02:00Z" },
];

const RBAC_STATS = { superAdmin: 1, orgAdmin: 5, operator: 23, readOnly: 12 };
const SYNC_COUNTS = {
  synced:  MOCK_TENANTS.filter((t) => t.syncStatus === "synced").length,
  pending: MOCK_TENANTS.filter((t) => t.syncStatus === "pending").length,
  failed:  MOCK_TENANTS.filter((t) => t.syncStatus === "failed").length,
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.12em",
      color: "var(--text-tertiary)", textTransform: "uppercase",
      marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

function MonitorCard({ title, color = "var(--text-tertiary)", children }: {
  title:    string;
  color?:   string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "var(--bg2)", border: "1px solid var(--border)",
      borderRadius: 12, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.08em", color: "var(--text-tertiary)", textTransform: "uppercase" }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "var(--bg3)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", width: 28, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function CoveragePill({ count, total }: { count: number; total: number }) {
  const pct = Math.round((count / total) * 100);
  const color = pct >= 75 ? "var(--green)" : pct >= 40 ? "var(--amber)" : "var(--text-tertiary)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 60, height: 4, background: "var(--bg3)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color }}>{count}/{total}</span>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader
        tag="Admin OS"
        title="Dashboard"
        description="システム全体のヘルスとインテリジェンス稼働状況を俯瞰する"
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 32 }}>

        {/* ── Section 1: System Health ───────────────────────────────────── */}
        <section>
          <SectionLabel>System Health Overview</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <MetricCard
              title="Total Tenants"
              value={TOTAL_TENANTS}
              subtext={`${MOCK_TENANTS.filter((t) => t.status === "active").length} active · ${MOCK_TENANTS.filter((t) => t.status === "trial").length} trial · ${MOCK_TENANTS.filter((t) => t.status === "suspended").length} suspended`}
              color="var(--text-primary)"
            />
            <MetricCard
              title="Active Users"
              value={ACTIVE_USERS}
              subtext={`${TOTAL_USERS} total · ${TOTAL_USERS - ACTIVE_USERS} suspended`}
              color="var(--blue)"
            />
            <MetricCard
              title="Intelligence Coverage"
              value={`${COVERAGE_PCT}%`}
              subtext={`${TOTAL_ACTIVE} / ${TOTAL_POSSIBLE} activations across ${ACTIVE_TENANTS} tenants`}
              color={COVERAGE_PCT >= 60 ? "var(--green)" : "var(--amber)"}
            />
          </div>
        </section>

        {/* ── Section 2: Intelligence Status ────────────────────────────── */}
        <section>
          <SectionLabel>Intelligence Status</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {INTEL_LIST.map((intel) => {
              const pct = Math.round((intel.activeCount / TOTAL_TENANTS) * 100);
              return (
                <div key={intel.code} style={{
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: 10, padding: "14px 16px",
                  borderTop: `2px solid ${intel.color}`,
                }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                    <IntelligenceDot code={intel.code} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", lineHeight: "18px" }}>{intel.name}</div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>{intel.code}</div>
                    </div>
                  </div>

                  {/* Activation bar */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ height: 3, background: "var(--bg3)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: intel.color, borderRadius: 2, transition: "width 0.5s" }} />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: intel.activeCount > 0 ? intel.color : "var(--text-tertiary)" }}>
                      {intel.activeCount}/{TOTAL_TENANTS} tenants
                    </span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
                      {intel.flagCount} flags
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 3: Tenant Health Summary ──────────────────────────── */}
        <section>
          <SectionLabel>Tenant Health Summary</SectionLabel>
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ height: 40, background: "var(--bg2)" }}>
                  {["Tenant", "Plan", "Users", "Intel Coverage", "Sync Status"].map((label) => (
                    <th key={label} style={{
                      padding: "0 16px", textAlign: "left",
                      fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.07em",
                      color: "var(--text-tertiary)", textTransform: "uppercase",
                      borderBottom: "1px solid var(--border)", fontWeight: 400,
                      whiteSpace: "nowrap",
                    }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_TENANTS.map((t, i) => (
                  <tr
                    key={t.id}
                    style={{
                      height: 52,
                      borderBottom: i < MOCK_TENANTS.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <td style={{ padding: "0 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: "50%",
                          background: "var(--teal-dim)", color: "var(--teal)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "var(--mono)", fontSize: 11, fontWeight: 500, flexShrink: 0,
                        }}>
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", lineHeight: "18px" }}>{t.name}</div>
                          <StatusBadge status={t.status} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "0 16px" }}>
                      <StatusBadge status={t.plan} />
                    </td>
                    <td style={{ padding: "0 16px" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--text-secondary)" }}>{t.users}</span>
                    </td>
                    <td style={{ padding: "0 16px", minWidth: 140 }}>
                      <CoveragePill count={t.intelCount} total={INTEL_LIST.length} />
                    </td>
                    <td style={{ padding: "0 16px" }}>
                      <SyncStatusBadge status={t.syncStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Section 4: Monitor Cards ───────────────────────────────────── */}
        <section>
          <SectionLabel>Monitor</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>

            {/* RBAC Risk */}
            <MonitorCard title="RBAC Risk" color={RBAC_STATS.superAdmin > 2 ? "var(--red)" : "var(--green)"}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "SuperAdmin", count: RBAC_STATS.superAdmin,  color: "var(--purple)", risk: true  },
                  { label: "OrgAdmin",   count: RBAC_STATS.orgAdmin,    color: "var(--blue)",   risk: false },
                  { label: "Operator",   count: RBAC_STATS.operator,    color: "var(--teal)",   risk: false },
                  { label: "ReadOnly",   count: RBAC_STATS.readOnly,    color: "var(--text-tertiary)", risk: false },
                ].map(({ label, count, color }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-secondary)" }}>{label}</span>
                    <MiniBar value={count} max={RBAC_STATS.operator} color={color} />
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: 4, padding: "6px 10px", borderRadius: 6,
                background: RBAC_STATS.superAdmin <= 2 ? "var(--green-dim)" : "var(--red-dim)",
                fontFamily: "var(--mono)", fontSize: 10,
                color: RBAC_STATS.superAdmin <= 2 ? "var(--green)" : "var(--red)",
              }}>
                {RBAC_STATS.superAdmin <= 2 ? "Risk: Low — within safe threshold" : "Risk: High — SuperAdmin count exceeds 2"}
              </div>
            </MonitorCard>

            {/* Sync Status */}
            <MonitorCard title="Sync Status" color={SYNC_COUNTS.failed > 0 ? "var(--red)" : "var(--green)"}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Synced",  count: SYNC_COUNTS.synced,  color: "var(--green)" },
                  { label: "Pending", count: SYNC_COUNTS.pending, color: "var(--amber)" },
                  { label: "Failed",  count: SYNC_COUNTS.failed,  color: "var(--red)"   },
                ].map(({ label, count, color }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-secondary)", width: 56, flexShrink: 0 }}>{label}</span>
                    <div style={{ flex: 1, height: 5, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${(count / TOTAL_TENANTS) * 100}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.5s" }} />
                    </div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 300, color, width: 16, textAlign: "right" }}>{count}</span>
                  </div>
                ))}
              </div>
              <div style={{
                padding: "6px 10px", borderRadius: 6,
                background: SYNC_COUNTS.failed > 0 ? "var(--red-dim)" : "var(--green-dim)",
                fontFamily: "var(--mono)", fontSize: 10,
                color: SYNC_COUNTS.failed > 0 ? "var(--red)" : "var(--green)",
              }}>
                {SYNC_COUNTS.failed > 0
                  ? `${SYNC_COUNTS.failed} tenant(s) require sync attention`
                  : "All active tenants in sync"}
              </div>
            </MonitorCard>

            {/* Recent Audit */}
            <MonitorCard title="Recent Audit" color="var(--text-tertiary)">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {MOCK_AUDIT_RECENT.map((entry, i) => (
                  <div key={entry.id} style={{ display: "flex", flexDirection: "column", gap: 3, paddingBottom: i < MOCK_AUDIT_RECENT.length - 1 ? 12 : 0, borderBottom: i < MOCK_AUDIT_RECENT.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <ActionBadge action={entry.action} />
                      <span style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.entity_type}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
                        {entry.actor}
                      </span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)" }}>
                        {new Date(entry.time).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </MonitorCard>

          </div>
        </section>

      </div>
    </div>
  );
}
