// src/admin/AdminNav.tsx
// Admin OS サブナビゲーション — Quiet × Clean × Executive Calm

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePreferences } from "@/ui/preferences";

const ADMIN_NAV = [
  { href: "/admin/tenants",      en: "Tenants",      ja: "テナント",         dot: "var(--teal)"   },
  { href: "/admin/users",        en: "Users",        ja: "ユーザー",         dot: "var(--blue)"   },
  { href: "/admin/roles",        en: "Roles",        ja: "ロール",           dot: "var(--purple)" },
  { href: "/admin/intelligence", en: "Intelligence", ja: "インテリジェンス", dot: "var(--amber)"  },
  { href: "/admin/settings",     en: "Settings",     ja: "設定",             dot: "var(--text-tertiary)" },
  { href: "/admin/audit",        en: "Audit Log",    ja: "監査ログ",         dot: "var(--text-tertiary)" },
  { href: "/admin/sync",         en: "Sync",         ja: "同期",             dot: "var(--green)"  },
] as const;

export default function AdminNav() {
  const pathname = usePathname();
  const { lang } = usePreferences();

  return (
    <nav style={{
      borderRight: "1px solid var(--border)",
      padding: "28px 0 20px",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg)",
      height: "100%",
      overflowY: "auto",
    }}>
      {/* Header */}
      <div style={{ padding: "0 20px 20px", borderBottom: "1px solid var(--border)", marginBottom: 12 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.14em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 4 }}>
          Admin OS
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
          {lang === "ja" ? "管理コンソール" : "Management Console"}
        </div>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: "4px 12px" }}>
        {ADMIN_NAV.map(({ href, en, ja, dot }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display:        "flex",
                alignItems:     "center",
                gap:            10,
                padding:        "9px 10px",
                borderRadius:   6,
                fontSize:       14,
                fontWeight:     active ? 500 : 400,
                color:          active ? "var(--text-primary)" : "var(--text-secondary)",
                background:     active ? "var(--bg3)"          : "transparent",
                textDecoration: "none",
                marginBottom:   2,
                transition:     "background 0.12s, color 0.12s",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? dot : "var(--bg3)", flexShrink: 0, transition: "background 0.12s" }} />
              {lang === "ja" ? ja : en}
            </Link>
          );
        })}
      </div>

      {/* Back to GIOS */}
      <div style={{ padding: "12px 12px 0", borderTop: "1px solid var(--border)", marginTop: 12 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 6, fontSize: 13, color: "var(--text-tertiary)", textDecoration: "none" }}>
          <span style={{ fontSize: 12 }}>←</span>
          {lang === "ja" ? "GIOS に戻る" : "Back to GIOS"}
        </Link>
      </div>
    </nav>
  );
}
