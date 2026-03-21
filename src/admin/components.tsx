// src/admin/components.tsx
// Admin OS 共有コンポーネント — Table / DetailPanel / EditDrawer / StatusBadge / AuditTimeline
// Quiet × Clean × Executive Calm

"use client";

import type { AuditLog } from "./types";

// ─── StatusBadge ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  active:    { color: "var(--green)",  bg: "var(--green-dim)"  },
  trial:     { color: "var(--amber)",  bg: "var(--amber-dim)"  },
  suspended: { color: "var(--red)",    bg: "var(--red-dim)"    },
  inactive:  { color: "var(--text-tertiary)", bg: "var(--bg3)" },
  synced:    { color: "var(--green)",  bg: "var(--green-dim)"  },
  pending:   { color: "var(--amber)",  bg: "var(--amber-dim)"  },
  failed:    { color: "var(--red)",    bg: "var(--red-dim)"    },
  system:    { color: "var(--purple)", bg: "var(--purple-dim)" },
  tenant:    { color: "var(--teal)",   bg: "var(--teal-dim)"   },
};

export function StatusBadge({ status }: { status: string }) {
  const { color, bg } = STATUS_COLORS[status] ?? { color: "var(--text-secondary)", bg: "var(--bg3)" };
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 7px",
      borderRadius: 4,
      fontFamily: "var(--mono)",
      fontSize: 10,
      letterSpacing: "0.04em",
      color,
      background: bg,
    }}>
      {status}
    </span>
  );
}

// ─── ActionBadge — audit log action ──────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  create: "var(--green)",
  update: "var(--amber)",
  delete: "var(--red)",
};

export function ActionBadge({ action }: { action: string }) {
  const color = ACTION_COLORS[action] ?? "var(--text-secondary)";
  return (
    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color, letterSpacing: "0.04em" }}>
      {action}
    </span>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

export type Column<T> = {
  key:    keyof T | string;
  label:  string;
  render: (row: T) => React.ReactNode;
  width?: string | number;
};

export function AdminTable<T extends { id: string }>({
  columns,
  rows,
  selectedId,
  onSelect,
  loading,
  emptyMessage = "No data",
}: {
  columns:      Column<T>[];
  rows:         T[];
  selectedId?:  string | null;
  onSelect?:    (row: T) => void;
  loading?:     boolean;
  emptyMessage?: string;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={{
                  padding: "8px 12px",
                  textAlign: "left",
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  borderBottom: "1px solid var(--border)",
                  width: col.width,
                  background: "var(--bg2)",
                  whiteSpace: "nowrap",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: "24px 12px", textAlign: "center", color: "var(--text-tertiary)", fontFamily: "var(--mono)", fontSize: 11 }}>
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: "24px 12px", textAlign: "center", color: "var(--text-tertiary)", fontFamily: "var(--mono)", fontSize: 11 }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onSelect?.(row)}
                style={{
                  cursor: onSelect ? "pointer" : "default",
                  background: selectedId === row.id ? "var(--bg3)" : "transparent",
                  transition: "background 0.1s",
                  borderBottom: "1px solid var(--border)",
                }}
                onMouseEnter={(e) => { if (selectedId !== row.id) (e.currentTarget as HTMLTableRowElement).style.background = "var(--bg2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = selectedId === row.id ? "var(--bg3)" : "transparent"; }}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    style={{
                      padding: "9px 12px",
                      fontSize: 12,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── DetailPanel ──────────────────────────────────────────────────────────────

export function DetailPanel({
  title,
  subtitle,
  onClose,
  onEdit,
  children,
}: {
  title:    React.ReactNode;
  subtitle?: React.ReactNode;
  onClose?: () => void;
  onEdit?:  () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      borderLeft: "1px solid var(--border)",
      background: "var(--bg)",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      height: "100%",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px 14px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 8,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
              {subtitle}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {onEdit && (
            <button onClick={onEdit} style={btnStyle("var(--bg3)", "var(--text-primary)")}>
              Edit
            </button>
          )}
          {onClose && (
            <button onClick={onClose} style={btnStyle("transparent", "var(--text-tertiary)")}>
              ✕
            </button>
          )}
        </div>
      </div>
      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        {children}
      </div>
    </div>
  );
}

// ─── EditDrawer ───────────────────────────────────────────────────────────────

export function EditDrawer({
  title,
  open,
  onClose,
  onSave,
  saving,
  children,
}: {
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
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 100,
        }}
      />
      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 400,
        background: "var(--bg2)",
        borderLeft: "1px solid var(--border)",
        zIndex: 101,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{title}</span>
          <button onClick={onClose} style={btnStyle("transparent", "var(--text-tertiary)")}>✕</button>
        </div>
        {/* Form */}
        <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
          {children}
        </div>
        {/* Footer */}
        <div style={{
          padding: "14px 20px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
        }}>
          <button onClick={onClose} style={btnStyle("var(--bg3)", "var(--text-secondary)")}>
            Cancel
          </button>
          <button onClick={onSave} disabled={saving} style={btnStyle("var(--green)", "var(--bg)", saving ? 0.5 : 1)}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── FormField ────────────────────────────────────────────────────────────────

export function FormField({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block",
        fontFamily: "var(--mono)",
        fontSize: 9,
        letterSpacing: "0.1em",
        color: "var(--text-tertiary)",
        textTransform: "uppercase",
        marginBottom: 6,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg3)",
  border: "1px solid var(--border)",
  borderRadius: 5,
  padding: "7px 10px",
  color: "var(--text-primary)",
  fontSize: 12,
  fontFamily: "var(--mono)",
  outline: "none",
  boxSizing: "border-box",
};

export const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

// ─── DetailRow ────────────────────────────────────────────────────────────────

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
      <span style={{
        fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.08em",
        color: "var(--text-tertiary)", textTransform: "uppercase",
        width: 100, flexShrink: 0, paddingTop: 2,
      }}>
        {label}
      </span>
      <span style={{ fontSize: 12, color: "var(--text-primary)", flex: 1, wordBreak: "break-all" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

export function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{
      fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em",
      color: "var(--text-tertiary)", textTransform: "uppercase",
      marginBottom: 10, marginTop: 20, paddingBottom: 6,
      borderBottom: "1px solid var(--border)",
    }}>
      {title}
    </div>
  );
}

// ─── AuditTimeline ────────────────────────────────────────────────────────────

export function AuditTimeline({ logs }: { logs: AuditLog[] }) {
  if (logs.length === 0) {
    return (
      <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
        No audit records
      </p>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {logs.map((log) => (
        <div
          key={log.id}
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "10px 12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ActionBadge action={log.action} />
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-secondary)" }}>
                {log.entity_type}
              </span>
            </div>
            <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)" }}>
              {new Date(log.created_at).toLocaleString()}
            </span>
          </div>
          {(log.before != null || log.after != null) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
              {log.before != null && (
                <pre style={{ margin: 0, fontSize: 9, color: "var(--red)", background: "var(--bg3)", borderRadius: 4, padding: "4px 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "pre-wrap", maxHeight: 60 }}>
                  {JSON.stringify(log.before, null, 1)}
                </pre>
              )}
              {log.after != null && (
                <pre style={{ margin: 0, fontSize: 9, color: "var(--green)", background: "var(--bg3)", borderRadius: 4, padding: "4px 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "pre-wrap", maxHeight: 60 }}>
                  {JSON.stringify(log.after, null, 1)}
                </pre>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

export function PageHeader({
  tag, title, description, action,
}: {
  tag:         string;
  title:       string;
  description: string;
  action?:     React.ReactNode;
}) {
  return (
    <header style={{
      padding: "24px 28px 20px",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
    }}>
      <div>
        <p style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.12em", color: "var(--teal)", textTransform: "uppercase", marginBottom: 5 }}>
          {tag}
        </p>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 400, color: "var(--text-primary)", marginBottom: 3 }}>
          {title}
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{description}</p>
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function btnStyle(bg: string, color: string, opacity = 1): React.CSSProperties {
  return {
    background: bg,
    color,
    border: "1px solid var(--border)",
    borderRadius: 5,
    padding: "5px 12px",
    fontFamily: "var(--mono)",
    fontSize: 11,
    cursor: "pointer",
    opacity,
    transition: "opacity 0.15s",
  };
}

export function PrimaryButton({ onClick, disabled, children }: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: "var(--green)",
        color: "var(--bg)",
        border: "none",
        borderRadius: 5,
        padding: "6px 14px",
        fontFamily: "var(--mono)",
        fontSize: 11,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </button>
  );
}
