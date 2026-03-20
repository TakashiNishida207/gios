// src/ui/screens/LearningScreen.tsx
// Learning Screen — 学び・更新仮説・プレイブックを OS に蓄積する
// EN: Learning | JP: 学習
// 因果ループ: Feedback を受け取り、OS を更新して次の Input へとループを閉じる

"use client";

import { useGIOSStore } from "@/store";
import { usePreferences } from "@/ui/preferences";


// Learning フェーズの変数定義
const LEARNING_FIELDS = [
  { canonical: "learning",          en: "Learning",           ja: "学び"             },
  { canonical: "updatedHypothesis", en: "Updated Hypothesis", ja: "更新仮説"         },
  { canonical: "updatedNarrative",  en: "Updated Narrative",  ja: "更新ストーリー"   },
  { canonical: "playbookUpdate",    en: "Playbook Update",    ja: "プレイブック更新" },
] as const;

const PATTERN_FIELDS = [
  { canonical: "bestPractice", en: "Best Practice", ja: "Best Practice", color: "var(--green)", dim: "var(--green-dim)" },
  { canonical: "antiPattern",  en: "Anti Pattern",  ja: "Anti Pattern",  color: "var(--red)",   dim: "var(--red-dim)"   },
] as const;

export default function LearningScreen() {
  const learning   = useGIOSStore((s) => s.flow.Learning);
  const growth     = useGIOSStore((s) => s.intelligence.Growth);
  const appendDiff = useGIOSStore((s) => s.appendDiff);
  const { lang } = usePreferences();

  const handleSync = () => {
    if (Object.keys(learning).length === 0) return;
    appendDiff({ ...learning });
  };

  const mainLearning = learning["learning"];

  return (
    <div style={{ overflowY: "auto", height: "100%" }}>
      <div style={{ padding: "28px 32px", maxWidth: 1100 }}>

        {/* Header */}
        <header style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: "0.12em",
              color: "var(--amber)",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Learning
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
            {lang === "ja" ? "学習" : "Learning"}
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {lang === "ja"
              ? "OS を更新し、次の因果ループへつなぐ"
              : "Update the OS and close the causal loop"}
          </p>
        </header>

        {/* Main learning narrative — serif font, prominent */}
        <section style={{ marginBottom: 24 }}>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: "0.1em",
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            {lang === "ja" ? "学び" : "Learning"}
          </p>
          <div
            style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "20px 22px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: "var(--amber)",
                opacity: mainLearning ? 1 : 0.25,
              }}
            />
            {mainLearning ? (
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 16,
                  color: "var(--text-primary)",
                  lineHeight: 1.8,
                }}
              >
                {String(mainLearning)}
              </p>
            ) : (
              <p
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  color: "var(--text-tertiary)",
                }}
              >
                {lang === "ja" ? "データなし" : "No data"}
              </p>
            )}
          </div>
        </section>

        {/* Other learning fields */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {LEARNING_FIELDS.filter((f) => f.canonical !== "learning").map(({ canonical, en, ja }) => {
              const value = learning[canonical];
              return (
                <div
                  key={canonical}
                  style={{
                    background: "var(--bg2)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "12px 16px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 9,
                      color: "var(--text-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 6,
                    }}
                  >
                    {lang === "ja" ? ja : en}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.6 }}>
                    {value !== undefined && value !== null ? (
                      String(value)
                    ) : (
                      <span style={{ color: "var(--text-tertiary)" }}>—</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Best Practice / Anti Pattern — side by side */}
        <section style={{ marginBottom: 28 }}>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: "0.1em",
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            {lang === "ja" ? "パターン" : "Patterns"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {PATTERN_FIELDS.map(({ canonical, en, ja, color }) => {
              const value = growth[canonical];
              return (
                <div
                  key={canonical}
                  style={{
                    background: "var(--bg2)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "16px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: color,
                      opacity: value ? 1 : 0.25,
                    }}
                  />
                  <p
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 9,
                      color: "var(--text-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 10,
                    }}
                  >
                    {lang === "ja" ? ja : en}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.6 }}>
                    {value !== undefined && value !== null ? (
                      String(value)
                    ) : (
                      <span style={{ color: "var(--text-tertiary)" }}>—</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Causal loop close — Sync to Notion */}
        <section
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)", maxWidth: 360 }}>
            {lang === "ja"
              ? "学習を Notion に同期すると次の因果ループが始まる"
              : "Syncing learning to Notion starts the next causal loop"}
          </p>
          <button
            onClick={handleSync}
            disabled={Object.keys(learning).length === 0}
            style={{
              padding: "8px 18px",
              background: Object.keys(learning).length > 0 ? "var(--amber)" : "var(--bg3)",
              border: "none",
              borderRadius: 6,
              color: Object.keys(learning).length > 0 ? "var(--bg)" : "var(--text-tertiary)",
              fontFamily: "var(--mono)",
              fontSize: 11,
              fontWeight: 500,
              cursor: Object.keys(learning).length > 0 ? "pointer" : "not-allowed",
              opacity: Object.keys(learning).length === 0 ? 0.35 : 1,
              letterSpacing: "0.04em",
              transition: "opacity 0.15s",
            }}
          >
            {lang === "ja" ? "Notion に同期" : "Sync to Notion"}
          </button>
        </section>
      </div>
    </div>
  );
}
