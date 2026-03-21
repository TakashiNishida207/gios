// src/ui/Topbar.tsx
// GIOS Topbar — brand, breadcrumb, flow phase badge, clock, theme + lang toggles

"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { usePreferences } from "./preferences";

const PHASE_COLORS: Record<string, { color: string; bg: string; border: string; label: string }> = {
  "/":              { color: "var(--accent)",  bg: "var(--accent-dim)",  border: "rgba(200,184,154,0.2)",  label: "OVERVIEW"       },
  "/input":         { color: "var(--teal)",    bg: "var(--teal-dim)",    border: "rgba(110,181,160,0.2)",  label: "INPUT PHASE"    },
  "/insight":       { color: "var(--purple)",  bg: "var(--purple-dim)",  border: "rgba(139,130,192,0.2)",  label: "INSIGHT PHASE"  },
  "/action":        { color: "var(--accent)",  bg: "var(--accent-dim)",  border: "rgba(200,184,154,0.2)",  label: "ACTION PHASE"   },
  "/power-meeting": { color: "var(--green)",   bg: "var(--green-dim)",   border: "rgba(122,170,128,0.2)",  label: "POWER MEETING"  },
  "/learning":      { color: "var(--amber)",   bg: "var(--amber-dim)",   border: "rgba(196,151,90,0.2)",   label: "LEARNING PHASE" },
  "/pmf":           { color: "var(--green)",   bg: "var(--green-dim)",   border: "rgba(122,170,128,0.2)",  label: "PMF SCORE"      },
};

// Sun icon — shown in dark mode (click → switch to light)
function IconSun() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <circle cx="6" cy="6" r="2.2" />
      <line x1="6"   y1="0.5" x2="6"   y2="2"    />
      <line x1="6"   y1="10"  x2="6"   y2="11.5" />
      <line x1="0.5" y1="6"   x2="2"   y2="6"    />
      <line x1="10"  y1="6"   x2="11.5" y2="6"   />
      <line x1="2.1" y1="2.1" x2="3.1" y2="3.1"  />
      <line x1="8.9" y1="8.9" x2="9.9" y2="9.9"  />
      <line x1="9.9" y1="2.1" x2="8.9" y2="3.1"  />
      <line x1="3.1" y1="8.9" x2="2.1" y2="9.9"  />
    </svg>
  );
}

// Moon icon — shown in light mode (click → switch to dark)
function IconMoon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M9.5 7A5 5 0 0 1 5 2a4.5 4.5 0 1 0 4.5 5z" />
    </svg>
  );
}

export default function Topbar() {
  const pathname = usePathname();
  const phase    = PHASE_COLORS[pathname] ?? PHASE_COLORS["/"];
  const [time, setTime] = useState("");
  const { theme, lang, toggleTheme, toggleLang } = usePreferences();

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const segments =
    pathname === "/" ? ["Dashboard"] : ["Dashboard", ...pathname.split("/").filter(Boolean)];

  const btnBase: React.CSSProperties = {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    background:     "none",
    border:         "1px solid var(--border)",
    borderRadius:   4,
    cursor:         "pointer",
    color:          "var(--text-secondary)",
    lineHeight:     1,
    flexShrink:     0,
  };

  return (
    <header
      style={{
        gridColumn:     "1 / -1",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        padding:        "0 20px",
        borderBottom:   "1px solid var(--border)",
        background:     "var(--bg)",
      }}
    >
      {/* Left: brand + breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", color: "var(--accent)" }}>
          GIOS
        </span>
        <div style={{ width: 1, height: 14, background: "var(--border)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
          {segments.map((s, i) => (
            <span key={i} style={i === segments.length - 1 ? { color: "var(--text-secondary)" } : {}}>
              {i > 0 && <span style={{ marginRight: 6, opacity: 0.4 }}>›</span>}
              {s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}
            </span>
          ))}
        </div>
      </div>

      {/* Right: phase badge + clock + toggles */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Phase badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          background: phase.bg, border: `1px solid ${phase.border}`,
          borderRadius: 4, padding: "3px 8px",
          fontFamily: "var(--mono)", fontSize: 9, color: phase.color, letterSpacing: "0.06em",
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: phase.color, animation: "pulse 2s infinite" }} />
          {phase.label}
        </div>

        <div style={{ width: 1, height: 14, background: "var(--border)" }} />

        {/* Clock */}
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
          {time}
        </span>

        <div style={{ width: 1, height: 14, background: "var(--border)" }} />

        {/* Language toggle: EN · JP */}
        <button
          onClick={toggleLang}
          title={lang === "en" ? "Switch to Japanese" : "Switch to English"}
          style={{ ...btnBase, gap: 3, padding: "3px 8px" }}
        >
          <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.06em", color: lang === "en" ? "var(--text-primary)" : "var(--text-tertiary)" }}>
            EN
          </span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--border-hover)", margin: "0 1px" }}>·</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.06em", color: lang === "ja" ? "var(--text-primary)" : "var(--text-tertiary)" }}>
            JP
          </span>
        </button>

        {/* Theme toggle: sun (→ light) / moon (→ dark) */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          style={{ ...btnBase, padding: "4px 8px" }}
        >
          {theme === "dark" ? <IconSun /> : <IconMoon />}
        </button>
      </div>
    </header>
  );
}
