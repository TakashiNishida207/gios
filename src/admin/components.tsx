// src/admin/components.tsx
// Admin OS 共有コンポーネント — Quiet × Clean × Executive Calm × Dark/Light対応
// 因果ループ: Evidence → Score → Phase → Action の可視化を支援する

"use client";

import type { AuditLog } from "./types";

// ─── Token helpers (CSS var wrappers) ────────────────────────────────────────
// All tokens map to existing GIOS CSS custom properties — dark/light handled automatically.

// ─── StatusBadge ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  active:       { color: "var(--green)",  bg: "var(--green-dim)"  },
  trial:        { color: "var(--amber)",  bg: "var(--amber-dim)"  },
  suspended:    { color: "var(--red)",    bg: "var(--red-dim)"    },
  inactive:     { color: "var(--text-tertiary)", bg: "var(--bg3)" },
  synced:       { color: "var(--green)",  bg: "var(--green-dim)"  },
  pending:      { color: "var(--amber)",  bg: "var(--amber-dim)"  },
  failed:       { color: "var(--red)",    bg: "var(--red-dim)"    },
  system:       { color: "var(--purple)", bg: "var(--purple-dim)" },
  tenant:       { color: "var(--teal)",   bg: "var(--teal-dim)"   },
  enterprise:   { color: "var(--blue)",   bg: "var(--blue-dim)"   },
  growth:       { color: "var(--teal)",   bg: "var(--teal-dim)"   },
  starter:      { color: "var(--text-secondary)", bg: "var(--bg3)" },
};

export function StatusBadge({ status }: { status: string }) {
  const { color, bg } = STATUS_COLORS[status?.toLowerCase()] ?? { color: "var(--text-secondary)", bg: "var(--bg3)" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 20,
      fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.03em",
      color, background: bg, whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

// ─── SyncStatusBadge ──────────────────────────────────────────────────────────

export function SyncStatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; dot: string }> = {
    synced:  { color: "var(--green)", bg: "var(--green-dim)", dot: "var(--green)" },
    pending: { color: "var(--amber)", bg: "var(--amber-dim)", dot: "var(--amber)" },
    failed:  { color: "var(--red)",   bg: "var(--red-dim)",   dot: "var(--red)"   },
  };
  const s = map[status] ?? { color: "var(--text-secondary)", bg: "var(--bg3)", dot: "var(--text-tertiary)" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, background: s.bg, color: s.color, fontFamily: "var(--mono)", fontSize: 11 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

// ─── ActionBadge ─────────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  create: "var(--green)",
  update: "var(--amber)",
  delete: "var(--red)",
};

export function ActionBadge({ action }: { action: string }) {
  const color = ACTION_COLORS[action] ?? "var(--text-secondary)";
  return (
    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color, letterSpacing: "0.04em", textTransform: "uppercase" }}>
      {action}
    </span>
  );
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

export function MetricCard({ title, value, subtext, color = "var(--text-primary)" }: {
  title:   string;
  value:   string | number;
  subtext?: string;
  color?:  string;
}) {
  return (
    <div style={{
      background: "var(--bg2)", border: "1px solid var(--border)",
      borderRadius: 12, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ fontSize: 36, fontWeight: 600, lineHeight: 1.1, color, marginBottom: 4 }}>
        {value}
      </div>
      {subtext && (
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: "16px" }}>
          {subtext}
        </div>
      )}
    </div>
  );
}

// ─── AdminTable ───────────────────────────────────────────────────────────────

export type Column<T> = {
  key:    keyof T | string;
  label:  string;
  render: (row: T) => React.ReactNode;
  width?: string | number;
};

export function AdminTable<T extends { id: string }>({
  columns, rows, selectedId, onSelect, loading, emptyMessage = "No data",
}: {
  columns:       Column<T>[];
  rows:          T[];
  selectedId?:   string | null;
  onSelect?:     (row: T) => void;
  loading?:      boolean;
  emptyMessage?: string;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr style={{ height: 40 }}>
            {columns.map((col) => (
              <th key={String(col.key)} style={{
                padding: "0 16px", textAlign: "left",
                fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.07em",
                color: "var(--text-tertiary)", textTransform: "uppercase",
                borderBottom: "1px solid var(--border)",
                background: "var(--bg2)", width: col.width, whiteSpace: "nowrap",
                fontWeight: 400,
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-tertiary)", fontFamily: "var(--mono)", fontSize: 13 }}>
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-tertiary)", fontFamily: "var(--mono)", fontSize: 13 }}>
                {emptyMessage}
              </td>
            </tr>
          ) : rows.map((row) => {
            const isSelected = selectedId === row.id;
            return (
              <tr
                key={row.id}
                onClick={() => onSelect?.(row)}
                style={{
                  height: 48, cursor: onSelect ? "pointer" : "default",
                  background: isSelected ? "var(--bg3)" : "transparent",
                  borderBottom: "1px solid var(--border)",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = "var(--bg2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isSelected ? "var(--bg3)" : "transparent"; }}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} style={{
                    padding: "0 16px", fontSize: 14, lineHeight: "20px",
                    color: "var(--text-primary)", overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── DetailPanel ──────────────────────────────────────────────────────────────

export function DetailPanel({ title, subtitle, onClose, onEdit, children }: {
  title:    React.ReactNode;
  subtitle?: React.ReactNode;
  onClose?: () => void;
  onEdit?:  () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      width: 420, flexShrink: 0,
      borderLeft: "1px solid var(--border)", background: "var(--bg)",
      display: "flex", flexDirection: "column", height: "100%",
      overflowY: "auto",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 600, lineHeight: "28px", color: "var(--text-primary)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {subtitle}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {onEdit && (
              <button onClick={onEdit} style={panelBtn("var(--bg3)", "var(--text-primary)")}>Edit</button>
            )}
            {onClose && (
              <button onClick={onClose} style={panelBtn("transparent", "var(--text-tertiary)")}>✕</button>
            )}
          </div>
        </div>
      </div>
      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {children}
      </div>
    </div>
  );
}

// ─── EditDrawer ───────────────────────────────────────────────────────────────

export function EditDrawer({ title, open, onClose, onSave, saving, children }: {
  title:    string;
  open:     boolean;
  onClose:  () => void;
  onSave:   () => void;
  saving?:  boolean;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, backdropFilter: "blur(2px)" }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 480,
        background: "var(--bg2)", borderLeft: "1px solid var(--border)",
        zIndex: 101, display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 20, fontWeight: 600, lineHeight: "28px", color: "var(--text-primary)" }}>{title}</span>
          <button onClick={onClose} style={panelBtn("transparent", "var(--text-tertiary)")}>✕</button>
        </div>
        <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>{children}</div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={onClose} style={panelBtn("var(--bg3)", "var(--text-secondary)")}>Cancel</button>
          <button onClick={onSave} disabled={saving} style={{ ...panelBtn("var(--green)", "var(--bg)"), border: "none", fontWeight: 500, opacity: saving ? 0.5 : 1 }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── DiffViewer ───────────────────────────────────────────────────────────────

export function DiffViewer({ before, after }: { before: unknown; after: unknown }) {
  if (before == null && after == null) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {before != null && (
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--red)", marginBottom: 4, letterSpacing: "0.06em" }}>BEFORE</div>
          <pre style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)", background: "var(--bg3)", borderRadius: 6, padding: "10px 12px", overflowX: "auto", fontFamily: "var(--mono)", lineHeight: 1.6, whiteSpace: "pre-wrap", border: "1px solid var(--border)" }}>
            {JSON.stringify(before, null, 2)}
          </pre>
        </div>
      )}
      {after != null && (
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--green)", marginBottom: 4, letterSpacing: "0.06em" }}>AFTER</div>
          <pre style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)", background: "var(--bg3)", borderRadius: 6, padding: "10px 12px", overflowX: "auto", fontFamily: "var(--mono)", lineHeight: 1.6, whiteSpace: "pre-wrap", border: "1px solid var(--border)" }}>
            {JSON.stringify(after, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── AuditTimeline ────────────────────────────────────────────────────────────

export function AuditTimeline({ logs }: { logs: AuditLog[] }) {
  if (logs.length === 0) return (
    <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-tertiary)" }}>No audit records</p>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
      {/* Vertical line */}
      <div style={{ position: "absolute", left: 11, top: 12, bottom: 12, width: 1, background: "var(--border)" }} />
      {logs.map((log, i) => (
        <div key={log.id} style={{ display: "flex", gap: 12, paddingBottom: i < logs.length - 1 ? 16 : 0 }}>
          {/* Icon dot */}
          <div style={{
            width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
            background: ACTION_COLORS[log.action] ? `${ACTION_COLORS[log.action]}20` : "var(--bg3)",
            border: `1.5px solid ${ACTION_COLORS[log.action] ?? "var(--border)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", zIndex: 1,
          }}>
            <span style={{ fontSize: 8, color: ACTION_COLORS[log.action] ?? "var(--text-tertiary)" }}>
              {log.action === "create" ? "+" : log.action === "delete" ? "−" : "~"}
            </span>
          </div>
          {/* Content */}
          <div style={{ flex: 1, paddingTop: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
              <ActionBadge action={log.action} />
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{log.entity_type}</span>
              {log.intelligence_code && (
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "var(--teal-dim)", color: "var(--teal)" }}>
                  {log.intelligence_code}
                </span>
              )}
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
              {new Date(log.created_at).toLocaleString()}
            </div>
            {(log.before != null || log.after != null) && (
              <div style={{ marginTop: 6 }}>
                <DiffViewer before={log.before} after={log.after} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── FormField + inputs ───────────────────────────────────────────────────────

export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.07em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--bg3)", border: "1px solid var(--border)",
  borderRadius: 6, padding: "9px 12px", color: "var(--text-primary)",
  fontSize: 14, fontFamily: "var(--sans)", outline: "none", boxSizing: "border-box",
  lineHeight: "20px",
};

export const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

// ─── DetailRow ────────────────────────────────────────────────────────────────

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.06em", color: "var(--text-tertiary)", textTransform: "uppercase", width: 112, flexShrink: 0, paddingTop: 1 }}>
        {label}
      </span>
      <span style={{ fontSize: 14, lineHeight: "20px", color: "var(--text-primary)", flex: 1, wordBreak: "break-all" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

export function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{
      fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.07em",
      color: "var(--text-tertiary)", textTransform: "uppercase",
      marginTop: 24, marginBottom: 12, paddingBottom: 8,
      borderBottom: "1px solid var(--border)",
    }}>
      {title}
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

export function PageHeader({ tag, title, description, action }: {
  tag:         string;
  title:       string;
  description: string;
  action?:     React.ReactNode;
}) {
  return (
    <header style={{
      padding: "32px 32px 24px", borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexShrink: 0,
    }}>
      <div>
        <p style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", color: "var(--teal)", textTransform: "uppercase", marginBottom: 6 }}>
          {tag}
        </p>
        <h1 style={{ fontFamily: "var(--sans)", fontSize: 24, fontWeight: 600, lineHeight: "32px", color: "var(--text-primary)", marginBottom: 4 }}>
          {title}
        </h1>
        <p style={{ fontSize: 14, lineHeight: "20px", color: "var(--text-secondary)" }}>{description}</p>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </header>
  );
}

// ─── PrimaryButton ────────────────────────────────────────────────────────────

export function PrimaryButton({ onClick, disabled, children }: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: "var(--teal)", color: "var(--bg)", border: "none", borderRadius: 6,
      padding: "8px 16px", fontFamily: "var(--sans)", fontSize: 14, fontWeight: 500,
      lineHeight: "20px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
    }}>
      {children}
    </button>
  );
}

// ─── InitialAvatar ────────────────────────────────────────────────────────────

export function InitialAvatar({ name, color = "var(--teal)" }: { name: string; color?: string }) {
  const init = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 28, height: 28, borderRadius: "50%", background: `${color}25`,
      color, fontFamily: "var(--mono)", fontSize: 12, fontWeight: 500, flexShrink: 0,
    }}>
      {init}
    </span>
  );
}

// ─── PermissionChip ───────────────────────────────────────────────────────────

export function PermissionChip({ code }: { code: string }) {
  return (
    <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 4, fontFamily: "var(--mono)", fontSize: 11, background: "var(--teal-dim)", color: "var(--teal)", marginRight: 4, marginBottom: 4 }}>
      {code}
    </span>
  );
}

// ─── IntelligenceDot ─────────────────────────────────────────────────────────

const INTEL_COLORS: Record<string, string> = {
  business: "var(--blue)", voice: "var(--teal)", growth: "var(--green)",
  decision: "var(--amber)", story: "var(--purple)", powermeeting: "var(--accent)",
  agent: "var(--red)", evidence: "var(--teal)",
};

export function IntelligenceDot({ code }: { code: string }) {
  const color = INTEL_COLORS[code] ?? "var(--text-tertiary)";
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color, marginRight: 6 }} />;
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

export function Toggle({ on, disabled, onChange }: { on: boolean; disabled?: boolean; onChange?: () => void }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      style={{
        width: 38, height: 22, borderRadius: 11, border: "none",
        background: on ? "var(--green)" : "var(--bg3)",
        cursor: disabled ? "wait" : "pointer",
        opacity: disabled ? 0.5 : 1,
        position: "relative", flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: on ? 19 : 3,
        width: 16, height: 16, borderRadius: "50%",
        background: on ? "var(--bg)" : "var(--text-tertiary)",
        transition: "left 0.2s",
      }} />
    </button>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function panelBtn(bg: string, color: string): React.CSSProperties {
  return {
    background: bg, color, border: "1px solid var(--border)", borderRadius: 5,
    padding: "6px 12px", fontFamily: "var(--sans)", fontSize: 13,
    cursor: "pointer", lineHeight: "20px",
  };
}
