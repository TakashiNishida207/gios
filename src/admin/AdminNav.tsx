// src/admin/AdminNav.tsx
// Admin OS サブナビゲーション — Quiet × Clean × Executive Calm

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePreferences } from "@/ui/preferences";

const ADMIN_NAV = [
  { href: "/admin/tenants",      en: "Tenants",      ja: "テナント"    },
  { href: "/admin/users",        en: "Users",        ja: "ユーザー"    },
  { href: "/admin/roles",        en: "Roles",        ja: "ロール"      },
  { href: "/admin/intelligence", en: "Intelligence", ja: "インテリジェンス" },
  { href: "/admin/settings",     en: "Settings",     ja: "設定"        },
  { href: "/admin/audit",        en: "Audit Log",    ja: "監査ログ"    },
  { href: "/admin/sync",         en: "Sync",         ja: "同期"        },
] as const;

export default function AdminNav() {
  const pathname = usePathname();
  const { lang } = usePreferences();

  return (
    <nav style={{
      borderRight: "1px solid var(--border)",
      padding: "20px 0",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg)",
      height: "100%",
      overflowY: "auto",
    }}>
      {/* Section label */}
      <div style={{
        fontFamily: "var(--mono)",
        fontSize: 9,
        letterSpacing: "0.12em",
        color: "var(--text-tertiary)",
        textTransform: "uppercase",
        padding: "0 16px",
        marginBottom: 8,
      }}>
        Admin OS
      </div>

      {/* Nav items */}
      <div style={{ padding: "0 8px" }}>
        {ADMIN_NAV.map(({ href, en, ja }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display:        "block",
                padding:        "7px 8px",
                borderRadius:   5,
                fontSize:       12,
                fontFamily:     "var(--mono)",
                color:          active ? "var(--text-primary)" : "var(--text-secondary)",
                background:     active ? "var(--bg3)"          : "transparent",
                textDecoration: "none",
                marginBottom:   2,
                transition:     "background 0.12s",
              }}
            >
              {lang === "ja" ? ja : en}
            </Link>
          );
        })}
      </div>

      {/* Back to GIOS */}
      <div style={{ marginTop: "auto", padding: "0 8px 8px" }}>
        <Link
          href="/"
          style={{
            display:        "block",
            padding:        "6px 8px",
            borderRadius:   5,
            fontSize:       11,
            fontFamily:     "var(--mono)",
            color:          "var(--text-tertiary)",
            textDecoration: "none",
          }}
        >
          ← {lang === "ja" ? "GIOS に戻る" : "Back to GIOS"}
        </Link>
      </div>
    </nav>
  );
}
