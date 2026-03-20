// src/ui/screens/Dashboard.tsx
// Dashboard — Intelligence Flow 全フェーズの状態を俯瞰する
// EN: Dashboard | JP: ダッシュボード

"use client";

import { useState } from "react";
import { useGIOSStore } from "@/store";
import { usePreferences } from "@/ui/preferences";
import type { FlowPhase } from "@/dictionary/types";

const FLOW_PHASES: {
  phase: FlowPhase;
  en: string;
  ja: string;
  color: string;
  dim: string;
}[] = [
  { phase: "Input",      en: "Input",      ja: "インプット",     color: "var(--teal)",   dim: "var(--teal-dim)"   },
  { phase: "Processing", en: "Processing", ja: "処理",           color: "var(--amber)",  dim: "var(--amber-dim)"  },
  { phase: "Insight",    en: "Insight",    ja: "洞察",           color: "var(--purple)", dim: "var(--purple-dim)" },
  { phase: "Action",     en: "Action",     ja: "アクション",     color: "var(--accent)", dim: "var(--accent-dim)" },
  { phase: "Feedback",   en: "Feedback",   ja: "フィードバック", color: "var(--red)",    dim: "var(--red-dim)"    },
  { phase: "Learning",   en: "Learning",   ja: "学習",           color: "var(--green)",  dim: "var(--green-dim)"  },
];

type SyncDirection = "forward" | "backward" | "full";
type SyncStatus = { ok: boolean; message: string } | null;


export default function Dashboard() {
  const flow    = useGIOSStore((s) => s.flow);
  const setFlow = useGIOSStore((s) => s.setFlow);
  const diff    = useGIOSStore((s) => s.__diff__);
  const { lang } = usePreferences();

  const [syncing, setSyncing] = useState(false);
  const [status, setStatus]   = useState<SyncStatus>(null);

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
        const phases = ["Input", "Processing", "Insight", "Action", "Feedback", "Learning"] as const;
        phases.forEach((p) => setFlow(p, dataJson.flow[p] ?? {}));
      }

      const synced =
        direction === "full"
          ? `forward ${data.forward} / backward ${data.backward}`
          : `${data.synced}`;

      setStatus({
        ok: true,
        message:
          lang === "ja" ? `同期完了 — ${synced} 件` : `Sync complete — ${synced} record(s)`,
      });
    } catch (e) {
      setStatus({ ok: false, message: String(e) });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ overflowY: "auto", height: "100%" }}>
      <div style={{ padding: "28px 32px", maxWidth: 1100 }}>

        {/* Header */}
        <header
          style={{
            marginBottom: 28,
            paddingBottom: 20,
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--mono)",
                fontSize: 9,
                letterSpacing: "0.12em",
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              GIOS
            </p>
            <h1
              style={{
                fontFamily: "var(--serif)",
                fontSize: 26,
                fontWeight: 400,
                color: "var(--text-primary)",
                marginBottom: 4,
              }}
            >
              {lang === "ja" ? "ダッシュボード" : "Dashboard"}
            </h1>
            <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {lang === "ja"
                ? "Intelligence Flow の現在状態"
                : "Current state of Intelligence Flow"}
            </p>
          </div>

          {/* Sync controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {status && (
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: status.ok ? "var(--text-secondary)" : "var(--red)",
                  marginRight: 4,
                }}
              >
                {status.message}
              </span>
            )}
            <button
              onClick={() => handleSync("forward")}
              disabled={syncing}
              style={{
                padding: "6px 12px",
                fontFamily: "var(--mono)",
                fontSize: 10,
                background: "var(--teal-dim)",
                border: "1px solid rgba(110,181,160,0.2)",
                borderRadius: 5,
                color: "var(--teal)",
                cursor: syncing ? "not-allowed" : "pointer",
                opacity: syncing ? 0.4 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {syncing ? "…" : "Notion → GIOS"}
            </button>
            <button
              onClick={() => handleSync("backward")}
              disabled={syncing}
              style={{
                padding: "6px 12px",
                fontFamily: "var(--mono)",
                fontSize: 10,
                background: "var(--accent-dim)",
                border: "1px solid rgba(200,184,154,0.2)",
                borderRadius: 5,
                color: "var(--accent)",
                cursor: syncing ? "not-allowed" : "pointer",
                opacity: syncing ? 0.4 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {syncing ? "…" : "GIOS → Notion"}
            </button>
            <button
              onClick={() => handleSync("full")}
              disabled={syncing}
              style={{
                padding: "6px 14px",
                fontFamily: "var(--mono)",
                fontSize: 10,
                background: "var(--accent)",
                border: "1px solid var(--accent)",
                borderRadius: 5,
                color: "var(--bg)",
                fontWeight: 500,
                cursor: syncing ? "not-allowed" : "pointer",
                opacity: syncing ? 0.4 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {syncing ? "…" : (lang === "ja" ? "フル同期" : "Full Sync")}
            </button>
          </div>
        </header>

        {/* Phase cards grid */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 28,
          }}
        >
          {FLOW_PHASES.map(({ phase, en, ja, color }) => {
            const data  = flow[phase];
            const count = Object.keys(data).length;
            const filled = count > 0;

            return (
              <div
                key={phase}
                className="fade-in"
                style={{
                  background: "var(--bg2)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: 16,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* accent top bar */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: color,
                    opacity: filled ? 1 : 0.25,
                  }}
                />
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 9,
                    color: "var(--text-tertiary)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  {en}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: 15,
                      color: "var(--text-primary)",
                    }}
                  >
                    {lang === "ja" ? ja : en}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 18,
                      fontWeight: 300,
                      color: filled ? color : "var(--text-tertiary)",
                    }}
                  >
                    {count}
                  </div>
                </div>

                {filled ? (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {Object.entries(data)
                      .slice(0, 3)
                      .map(([k, v]) => (
                        <li
                          key={k}
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: 10,
                            color: "var(--text-secondary)",
                            marginBottom: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span style={{ color: "var(--text-tertiary)" }}>{k}:</span>{" "}
                          {Array.isArray(v) ? (v as string[]).join(", ") : String(v)}
                        </li>
                      ))}
                    {count > 3 && (
                      <li
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: 10,
                          color: "var(--text-tertiary)",
                          marginTop: 2,
                        }}
                      >
                        +{count - 3} {lang === "ja" ? "件" : "more"}
                      </li>
                    )}
                  </ul>
                ) : (
                  <p
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {lang === "ja" ? "データなし" : "No data"}
                  </p>
                )}
              </div>
            );
          })}
        </section>

        {/* Reverse sync queue */}
        <section
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: 20,
          }}
        >
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: "0.1em",
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            {lang === "ja" ? "逆同期キュー" : "Reverse Sync Queue"}
          </p>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-secondary)" }}>
            {diff.length === 0
              ? lang === "ja"
                ? "同期待ちなし"
                : "No pending sync"
              : `${diff.length} ${lang === "ja" ? "件待機中" : "record(s) pending"}`}
          </p>
        </section>
      </div>
    </div>
  );
}
