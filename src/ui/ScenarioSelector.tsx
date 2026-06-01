// src/ui/ScenarioSelector.tsx
// デモシナリオセレクター — 全ページ共通の一括切り替えUI
// 因果ループ: シナリオ選択 → loadScenario → store全書き換え → 全ページ即時反映

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useGDIOSStore } from "@/store";
import { DEMO_SCENARIOS }  from "@/store/demoData";
import { usePreferences }  from "@/ui/preferences";

// UC番号ごとのカラー
const UC_COLORS: Record<string, string> = {
  uc1: "var(--red)",
  uc2: "var(--amber)",
  uc3: "var(--green)",
  uc4: "var(--purple)",
  uc5: "var(--blue)",
  uc6: "var(--teal)",
};

const UC_LABELS: Record<string, string> = {
  uc1: "UC1", uc2: "UC2", uc3: "UC3",
  uc4: "UC4", uc5: "UC5", uc6: "UC6",
};

// UC名の短縮形（Topbarの省スペース表示用）
const UC_SHORT_JA: Record<string, string> = {
  uc1: "チャーン対応",
  uc2: "API障害",
  uc3: "アップセル",
  uc4: "PMFピボット",
  uc5: "キャズム突破",
  uc6: "Pricing/EMEA",
};

const UC_SHORT_EN: Record<string, string> = {
  uc1: "Churn Risk",
  uc2: "Incident",
  uc3: "Upsell",
  uc4: "PMF Pivot",
  uc5: "Chasm",
  uc6: "Pricing/EMEA",
};

export default function ScenarioSelector() {
  const activeId    = useGDIOSStore((s) => s.activeScenarioId);
  const loadScenario = useGDIOSStore((s) => s.loadScenario);
  const { lang }    = usePreferences();

  const [open,    setOpen]    = useState(false);
  const [flash,   setFlash]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = useCallback((id: string) => {
    loadScenario(id);
    setOpen(false);
    setFlash(true);
    setTimeout(() => setFlash(false), 1200);
  }, [loadScenario]);

  const color = UC_COLORS[activeId] ?? "var(--text-tertiary)";
  const label = UC_LABELS[activeId] ?? "—";
  const short = lang === "ja"
    ? (UC_SHORT_JA[activeId] ?? activeId)
    : (UC_SHORT_EN[activeId] ?? activeId);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* トリガーボタン */}
      <button
        onClick={() => setOpen((o) => !o)}
        title={lang === "ja" ? "デモシナリオを切り替える" : "Switch demo scenario"}
        style={{
          display:     "flex",
          alignItems:  "center",
          gap:          5,
          background:  open ? "var(--bg3)" : "var(--bg2)",
          border:       `1px solid ${open ? color : "var(--border)"}`,
          borderRadius: 4,
          padding:      "3px 8px",
          cursor:       "pointer",
          transition:   "border-color 0.15s, background 0.15s",
        }}
      >
        {/* カラードット */}
        <span style={{
          width: 5, height: 5, borderRadius: "50%",
          background: flash ? "var(--green)" : color,
          flexShrink: 0,
          transition: "background 0.3s",
        }} />
        {/* UC番号 */}
        <span style={{
          fontFamily: "var(--mono)", fontSize: 9,
          color: flash ? "var(--green)" : color,
          fontWeight: 600, letterSpacing: "0.04em",
          transition: "color 0.3s",
        }}>
          {label}
        </span>
        {/* シナリオ短縮名 */}
        <span style={{
          fontFamily: "var(--mono)", fontSize: 9,
          color: flash ? "var(--green)" : "var(--text-secondary)",
          letterSpacing: "0.02em",
          transition: "color 0.3s",
        }}>
          {flash ? (lang === "ja" ? "切替完了 ✓" : "Loaded ✓") : short}
        </span>
        {/* 矢印 */}
        <span style={{
          fontFamily: "var(--mono)", fontSize: 8,
          color: "var(--text-tertiary)",
          marginLeft: 1,
          transform: open ? "rotate(180deg)" : "none",
          transition: "transform 0.15s",
          display: "inline-block",
        }}>
          ▾
        </span>
      </button>

      {/* ドロップダウンパネル */}
      {open && (
        <div style={{
          position:   "absolute",
          top:        "calc(100% + 6px)",
          right:      0,
          width:      300,
          background: "var(--bg2)",
          border:     "1px solid var(--border)",
          borderRadius: 8,
          boxShadow:  "0 8px 24px rgba(0,0,0,0.3)",
          zIndex:     1000,
          overflow:   "hidden",
        }}>
          {/* ヘッダー */}
          <div style={{
            padding:      "10px 14px 8px",
            borderBottom: "1px solid var(--border)",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "space-between",
          }}>
            <span style={{
              fontFamily: "var(--mono)", fontSize: 9,
              color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              {lang === "ja" ? "デモシナリオ" : "Demo Scenario"}
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)" }}>
              {DEMO_SCENARIOS.length} {lang === "ja" ? "シナリオ" : "scenarios"}
            </span>
          </div>

          {/* シナリオリスト */}
          <div style={{ padding: "4px 0" }}>
            {DEMO_SCENARIOS.map((scenario) => {
              const sc      = UC_COLORS[scenario.id] ?? "var(--text-tertiary)";
              const isActive = scenario.id === activeId;
              return (
                <button
                  key={scenario.id}
                  onClick={() => handleSelect(scenario.id)}
                  style={{
                    width:       "100%",
                    display:     "flex",
                    alignItems:  "flex-start",
                    gap:          10,
                    padding:      "9px 14px",
                    background:   isActive ? "var(--bg3)" : "transparent",
                    border:       "none",
                    cursor:       "pointer",
                    textAlign:    "left",
                    transition:   "background 0.12s",
                  }}
                  onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "var(--bg3)"; }}
                  onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  {/* UC番号バッジ */}
                  <span style={{
                    fontFamily:   "var(--mono)", fontSize: 9, fontWeight: 600,
                    color:         sc,
                    background:   `color-mix(in srgb, ${sc} 15%, transparent)`,
                    border:       `1px solid color-mix(in srgb, ${sc} 30%, transparent)`,
                    borderRadius:  3,
                    padding:      "2px 5px",
                    flexShrink:    0,
                    marginTop:     1,
                    letterSpacing: "0.04em",
                  }}>
                    {UC_LABELS[scenario.id]}
                  </span>

                  {/* テキスト */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: isActive ? 500 : 400,
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                      marginBottom: 2,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {lang === "ja" ? scenario.nameJa : scenario.name}
                    </div>
                    <div style={{
                      fontFamily: "var(--mono)", fontSize: 9,
                      color: "var(--text-tertiary)",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {lang === "ja" ? scenario.descriptionJa : scenario.description}
                    </div>
                  </div>

                  {/* アクティブチェック */}
                  {isActive && (
                    <span style={{ color: sc, fontSize: 11, flexShrink: 0, marginTop: 1 }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* フッター */}
          <div style={{
            padding:   "8px 14px",
            borderTop: "1px solid var(--border)",
          }}>
            <p style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", margin: 0 }}>
              {lang === "ja"
                ? "切り替えると全ページのデモデータが即時更新されます"
                : "Switching updates demo data across all pages instantly"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
