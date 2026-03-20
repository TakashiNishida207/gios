// src/ui/Sidebar.tsx
// GIOS Sidebar — 因果ループの順序でナビゲーションを配置する
// Intelligence Flow mini-viz: 各フェーズの変数数をプログレスバーで表示

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGIOSStore } from "@/store";
import { usePreferences } from "./preferences";

const NAV = [
  { href: "/",              en: "Dashboard",     ja: "ダッシュボード", icon: "grid"     },
  { href: "/input",         en: "Input",         ja: "インプット",     icon: "input"    },
  { href: "/insight",       en: "Insight",       ja: "洞察",           icon: "insight"  },
  { href: "/action",        en: "Action",        ja: "アクション",     icon: "action"   },
  { href: "/power-meeting", en: "Power Meeting", ja: "パワーMTG",      icon: "meeting"  },
  { href: "/learning",      en: "Learning",      ja: "学習",           icon: "learning" },
] as const;

const PHASE_ACTIVE: Record<string, string> = {
  "/":              "var(--accent)",
  "/input":         "var(--teal)",
  "/insight":       "var(--purple)",
  "/action":        "var(--accent)",
  "/power-meeting": "var(--green)",
  "/learning":      "var(--amber)",
};

const PHASE_ACTIVE_BG: Record<string, string> = {
  "/":              "var(--accent-dim)",
  "/input":         "var(--teal-dim)",
  "/insight":       "var(--purple-dim)",
  "/action":        "var(--accent-dim)",
  "/power-meeting": "var(--green-dim)",
  "/learning":      "var(--amber-dim)",
};

const FLOW_PHASES = [
  { key: "Input"      as const, color: "var(--teal)",   label: "Input"    },
  { key: "Processing" as const, color: "var(--amber)",  label: "Process"  },
  { key: "Insight"    as const, color: "var(--purple)", label: "Insight"  },
  { key: "Action"     as const, color: "var(--accent)", label: "Action"   },
  { key: "Feedback"   as const, color: "var(--red)",    label: "Feedback" },
  { key: "Learning"   as const, color: "var(--green)",  label: "Learning" },
];

const ICONS: Record<string, React.ReactNode> = {
  grid: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="1" y="1" width="5" height="5" rx="1"/>
      <rect x="8" y="1" width="5" height="5" rx="1"/>
      <rect x="1" y="8" width="5" height="5" rx="1"/>
      <rect x="8" y="8" width="5" height="5" rx="1"/>
    </svg>
  ),
  input: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M2 2h10v10H2z"/>
      <line x1="5" y1="5" x2="9" y2="5"/>
      <line x1="5" y1="7.5" x2="9" y2="7.5"/>
    </svg>
  ),
  insight: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="7" cy="7" r="5"/>
      <line x1="7" y1="4" x2="7" y2="7"/>
      <line x1="7" y1="7" x2="9.5" y2="9"/>
    </svg>
  ),
  action: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <polyline points="2,9 5,5 8,7 11,3"/>
      <line x1="11" y1="3" x2="11" y2="6"/>
      <line x1="11" y1="3" x2="8" y2="3"/>
    </svg>
  ),
  meeting: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="4" cy="5" r="2"/>
      <circle cx="10" cy="5" r="2"/>
      <path d="M1 12c0-2 1.5-3 3-3s3 1 3 1 1.5-1 3-1 3 1 3 3"/>
    </svg>
  ),
  learning: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M2 10L7 3l5 7H2z"/>
      <line x1="7" y1="7" x2="7" y2="11"/>
    </svg>
  ),
};

export default function Sidebar() {
  const pathname = usePathname();
  const flow     = useGIOSStore((s) => s.flow);
  const { lang } = usePreferences();

  const maxCount = Math.max(1, ...FLOW_PHASES.map((p) => Object.keys(flow[p.key]).length));

  return (
    <nav
      style={{
        borderRight: "1px solid var(--border)",
        overflowY: "auto",
        padding: "16px 0",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
      }}
    >
      {/* OS section label + nav items */}
      <div style={{ padding: "0 12px", marginBottom: 24 }}>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            letterSpacing: "0.1em",
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            padding: "0 8px",
            marginBottom: 4,
          }}
        >
          OS
        </div>
        {NAV.map(({ href, en, ja, icon }) => {
          const active = pathname === href;
          const color  = active ? PHASE_ACTIVE[href] : "var(--text-secondary)";
          const bg     = active ? PHASE_ACTIVE_BG[href] : "transparent";
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 8px",
                borderRadius: 6,
                color,
                background: bg,
                fontSize: 12,
                textDecoration: "none",
                transition: "background 0.15s",
              }}
            >
              <span style={{ opacity: active ? 1 : 0.5, flexShrink: 0 }}>{ICONS[icon]}</span>
              {lang === "ja" ? ja : en}
            </Link>
          );
        })}
      </div>

      {/* Intelligence Flow mini-viz */}
      <div
        style={{
          marginTop: "auto",
          margin: "auto 12px 12px",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 12,
        }}
      >
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            letterSpacing: "0.08em",
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Flow
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {FLOW_PHASES.map(({ key, color, label }) => {
            const count = Object.keys(flow[key]).length;
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 9,
                    color: "var(--text-tertiary)",
                    width: 52,
                    flexShrink: 0,
                  }}
                >
                  {label}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 3,
                    background: "var(--bg3)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: color,
                      borderRadius: 2,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 9,
                    color: "var(--text-tertiary)",
                    width: 16,
                    textAlign: "right",
                  }}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
