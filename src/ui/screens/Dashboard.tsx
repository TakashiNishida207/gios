// src/ui/screens/Dashboard.tsx
// Dashboard — Intelligence Flow 全フェーズの状態を俯瞰する
// EN: Dashboard | JP: ダッシュボード

"use client";

import { useGIOSStore } from "@/store";
import type { FlowPhase } from "@/dictionary/types";

// 因果ループの順序と表示ラベル
const FLOW_PHASES: { phase: FlowPhase; en: string; ja: string }[] = [
  { phase: "Input",      en: "Input",      ja: "インプット"  },
  { phase: "Processing", en: "Processing", ja: "処理"        },
  { phase: "Insight",    en: "Insight",    ja: "洞察"        },
  { phase: "Action",     en: "Action",     ja: "アクション"  },
  { phase: "Feedback",   en: "Feedback",   ja: "フィードバック" },
  { phase: "Learning",   en: "Learning",   ja: "学習"        },
];

type Props = { lang?: "en" | "ja" };

export default function Dashboard({ lang = "ja" }: Props) {
  const flow = useGIOSStore((s) => s.flow);
  const diff = useGIOSStore((s) => s.__diff__);

  return (
    <div className="min-h-screen bg-white px-8 py-10">
      {/* ヘッダー */}
      <header className="mb-10 border-b border-gray-100 pb-6">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">GIOS</p>
        <h1 className="text-2xl font-semibold text-gray-900">
          {lang === "ja" ? "ダッシュボード" : "Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {lang === "ja"
            ? "Intelligence Flow の現在状態"
            : "Current state of Intelligence Flow"}
        </p>
      </header>

      {/* 因果ループ フェーズグリッド */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 mb-10">
        {FLOW_PHASES.map(({ phase, en, ja }) => {
          const data   = flow[phase];
          const count  = Object.keys(data).length;
          const filled = count > 0;

          return (
            <div
              key={phase}
              className={`rounded border p-4 ${
                filled ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"
              }`}
            >
              <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">
                {en}
              </p>
              <p className="text-base font-medium text-gray-900">
                {lang === "ja" ? ja : en}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                {filled
                  ? `${count} ${lang === "ja" ? "変数" : "variable(s)"}`
                  : lang === "ja" ? "データなし" : "No data"}
              </p>
            </div>
          );
        })}
      </section>

      {/* 逆同期キュー状態 */}
      <section className="border-t border-gray-100 pt-6">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">
          {lang === "ja" ? "逆同期キュー" : "Reverse Sync Queue"}
        </p>
        <p className="text-sm text-gray-600">
          {diff.length === 0
            ? (lang === "ja" ? "同期待ちなし" : "No pending sync")
            : `${diff.length} ${lang === "ja" ? "件待機中" : "record(s) pending"}`}
        </p>
      </section>
    </div>
  );
}
