// src/ui/screens/Dashboard.tsx
// Dashboard — Intelligence Flow 全フェーズの状態を俯瞰する
// EN: Dashboard | JP: ダッシュボード

"use client";

import { useState } from "react";
import { useGIOSStore } from "@/store";
import type { FlowPhase } from "@/dictionary/types";

const FLOW_PHASES: { phase: FlowPhase; en: string; ja: string }[] = [
  { phase: "Input",      en: "Input",      ja: "インプット"     },
  { phase: "Processing", en: "Processing", ja: "処理"           },
  { phase: "Insight",    en: "Insight",    ja: "洞察"           },
  { phase: "Action",     en: "Action",     ja: "アクション"     },
  { phase: "Feedback",   en: "Feedback",   ja: "フィードバック" },
  { phase: "Learning",   en: "Learning",   ja: "学習"           },
];

type SyncDirection = "forward" | "backward" | "full";
type SyncStatus = { ok: boolean; message: string } | null;

type Props = { lang?: "en" | "ja" };

export default function Dashboard({ lang = "ja" }: Props) {
  const flow      = useGIOSStore((s) => s.flow);
  const setFlow   = useGIOSStore((s) => s.setFlow);
  const diff      = useGIOSStore((s) => s.__diff__);

  const [syncing, setSyncing]   = useState(false);
  const [status, setStatus]     = useState<SyncStatus>(null);

  const handleSync = async (direction: SyncDirection) => {
    setSyncing(true);
    setStatus(null);
    try {
      const res  = await fetch("/api/sync", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ direction }),
      });
      const data = await res.json();

      if (!data.ok) throw new Error(data.error ?? "同期エラー");

      // サーバーストアのデータを Zustand に反映する
      const dataRes  = await fetch("/api/sync/data");
      const dataJson = await dataRes.json();
      if (dataJson.ok) {
        const phases = ["Input","Processing","Insight","Action","Feedback","Learning"] as const;
        phases.forEach((p) => setFlow(p, dataJson.flow[p] ?? {}));
      }

      const synced = direction === "full"
        ? `forward ${data.forward} / backward ${data.backward}`
        : `${data.synced}`;

      setStatus({
        ok: true,
        message: lang === "ja"
          ? `同期完了 — ${synced} 件`
          : `Sync complete — ${synced} record(s)`,
      });
    } catch (e) {
      setStatus({ ok: false, message: String(e) });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-8 py-10">
      {/* ヘッダー */}
      <header className="mb-10 border-b border-gray-100 pb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">GIOS</p>
          <h1 className="text-2xl font-semibold text-gray-900">
            {lang === "ja" ? "ダッシュボード" : "Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {lang === "ja"
              ? "Intelligence Flow の現在状態"
              : "Current state of Intelligence Flow"}
          </p>
        </div>

        {/* 同期コントロール */}
        <div className="flex items-center gap-3">
          {status && (
            <span className={`text-xs ${status.ok ? "text-gray-500" : "text-red-400"}`}>
              {status.message}
            </span>
          )}
          <button
            onClick={() => handleSync("forward")}
            disabled={syncing}
            className="px-4 py-2 text-xs font-mono border border-gray-200 rounded text-gray-600 hover:border-gray-400 transition-colors disabled:opacity-40"
          >
            {syncing ? "…" : (lang === "ja" ? "Notion → GIOS" : "Notion → GIOS")}
          </button>
          <button
            onClick={() => handleSync("backward")}
            disabled={syncing}
            className="px-4 py-2 text-xs font-mono border border-gray-200 rounded text-gray-600 hover:border-gray-400 transition-colors disabled:opacity-40"
          >
            {syncing ? "…" : (lang === "ja" ? "GIOS → Notion" : "GIOS → Notion")}
          </button>
          <button
            onClick={() => handleSync("full")}
            disabled={syncing}
            className="px-4 py-2 text-xs font-mono bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            {syncing ? "…" : (lang === "ja" ? "フル同期" : "Full Sync")}
          </button>
        </div>
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
              {filled ? (
                <ul className="mt-2 space-y-0.5">
                  {Object.entries(data).slice(0, 4).map(([k, v]) => (
                    <li key={k} className="text-xs text-gray-500 truncate">
                      <span className="text-gray-300">{k}:</span>{" "}
                      {Array.isArray(v) ? (v as string[]).join(", ") : String(v)}
                    </li>
                  ))}
                  {Object.keys(data).length > 4 && (
                    <li className="text-xs text-gray-300">
                      +{Object.keys(data).length - 4} {lang === "ja" ? "件" : "more"}
                    </li>
                  )}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-gray-300">
                  {lang === "ja" ? "データなし" : "No data"}
                </p>
              )}
            </div>
          );
        })}
      </section>

      {/* 逆同期キュー */}
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
