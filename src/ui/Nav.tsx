// src/ui/Nav.tsx
// GIOS グローバルナビゲーション — 因果ループの順序で画面を配置する
// EN/JP 切替対応

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/",              en: "Dashboard",     ja: "ダッシュボード"    },
  { href: "/input",         en: "Input",         ja: "インプット"        },
  { href: "/insight",       en: "Insight",       ja: "洞察"              },
  { href: "/action",        en: "Action",        ja: "アクション"        },
  { href: "/power-meeting", en: "Power Meeting", ja: "パワーミーティング" },
  { href: "/learning",      en: "Learning",      ja: "学習"              },
] as const;

type Props = { lang?: "en" | "ja" };

export default function Nav({ lang = "ja" }: Props) {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-100 bg-white px-8 py-3 flex items-center gap-6">
      <span className="text-xs font-mono text-gray-300 uppercase tracking-widest mr-2">
        GIOS
      </span>
      {NAV_ITEMS.map(({ href, en, ja }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`text-sm transition-colors ${
              active
                ? "text-gray-900 font-medium"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            {lang === "ja" ? ja : en}
          </Link>
        );
      })}
    </nav>
  );
}
