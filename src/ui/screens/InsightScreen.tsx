// src/ui/screens/InsightScreen.tsx
// Insight Screen — 洞察・仮説・選択肢を意思決定者に提示する
// EN: Insight | JP: 洞察
// 因果ループ: Processing の結果を受け取り、Action の前に意味づけを与える

"use client";

import { useGIOSStore } from "@/store";
import { usePreferences } from "@/ui/preferences";


// Insight フェーズの変数定義
const INSIGHT_FIELDS = [
  { canonical: "valueHypothesis",   en: "Value Hypothesis",   ja: "価値仮説"   },
  { canonical: "narrative",         en: "Narrative",          ja: "ストーリー" },
  { canonical: "decisionRationale", en: "Decision Rationale", ja: "選択理由"   },
  { canonical: "successMetric",     en: "Success Metric",     ja: "KPI"        },
] as const;

const PROCESSING_FIELDS = [
  { canonical: "gapLevel",        en: "Gap Level",        ja: "Gap Level",        color: "var(--teal)"   },
  { canonical: "priorityScore",   en: "Priority Score",   ja: "Priority",         color: "var(--amber)"  },
  { canonical: "painSeverity",    en: "Pain Severity",    ja: "Pain Severity",    color: "var(--red)"    },
  { canonical: "opportunitySize", en: "Opportunity Size", ja: "Opportunity Size", color: "var(--purple)" },
] as const;

// Intelligence tabs
const INTEL_TABS = [
  { key: "Growth",   en: "Growth",   ja: "成長",     color: "var(--teal)"   },
  { key: "Evidence", en: "Evidence", ja: "エビデンス", color: "var(--amber)" },
  { key: "Story",    en: "Story",    ja: "ストーリー", color: "var(--purple)" },
  { key: "Decision", en: "Decision", ja: "意思決定",  color: "var(--accent)" },
] as const;

// Flow strip phases
const FLOW_STRIP = [
  { label: "Input",      active: false, color: "var(--teal)"   },
  { label: "Processing", active: false, color: "var(--amber)"  },
  { label: "Insight",    active: true,  color: "var(--purple)" },
  { label: "Action",     active: false, color: "var(--accent)" },
  { label: "Feedback",   active: false, color: "var(--red)"    },
  { label: "Learning",   active: false, color: "var(--green)"  },
];

export default function InsightScreen() {
  const insight    = useGIOSStore((s) => s.flow.Insight);
  const processing = useGIOSStore((s) => s.flow.Processing);
  const decision   = useGIOSStore((s) => s.intelligence.Decision);
  const { lang } = usePreferences();

  const decisionOptions = decision["decisionOptions"];
  const hasOptions = Array.isArray(decisionOptions) && decisionOptions.length > 0;

  const narrative = insight["narrative"];

  return (
    <div style={{ overflowY: "auto", height: "100%" }}>
      <div style={{ padding: "28px 32px", maxWidth: 1100 }}>

        {/* Flow strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 24,
            padding: "8px 12px",
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
          }}
        >
          {FLOW_STRIP.map((p, i) => (
            <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {i > 0 && (
                <div
                  style={{
                    width: 16,
                    height: 1,
                    background: "var(--border)",
                    margin: "0 2px",
                  }}
                />
              )}
              <div
                style={{
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  letterSpacing: "0.06em",
                  background: p.active ? "var(--purple-dim)" : "transparent",
                  color: p.active ? p.color : "var(--text-tertiary)",
                  border: p.active ? "1px solid rgba(139,130,192,0.25)" : "1px solid transparent",
                }}
              >
                {p.label}
              </div>
            </div>
          ))}
        </div>

        {/* Header */}
        <header style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: "0.12em",
              color: "var(--purple)",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Insight
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
            {lang === "ja" ? "洞察" : "Insight"}
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {lang === "ja"
              ? "意味づけ・仮説・意思決定の根拠"
              : "Meaning, hypotheses, and decision rationale"}
          </p>
        </header>

        {/* Intelligence tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {INTEL_TABS.map(({ key, en, ja, color }) => (
            <div
              key={key}
              style={{
                padding: "5px 12px",
                borderRadius: 5,
                fontFamily: "var(--mono)",
                fontSize: 9,
                letterSpacing: "0.06em",
                color,
                background: "var(--bg2)",
                border: `1px solid var(--border)`,
                textTransform: "uppercase",
              }}
            >
              {lang === "ja" ? ja : en}
            </div>
          ))}
        </div>

        {/* Scoring cards — Processing data */}
        <section style={{ marginBottom: 24 }}>
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
            {lang === "ja" ? "スコアリング" : "Scoring"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {PROCESSING_FIELDS.map(({ canonical, en, ja, color }) => {
              const value = processing[canonical];
              return (
                <div
                  key={canonical}
                  style={{
                    background: "var(--bg2)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "12px 14px",
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
                    }}
                  />
                  <p
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 9,
                      color: "var(--text-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 8,
                    }}
                  >
                    {lang === "ja" ? ja : en}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 22,
                      fontWeight: 300,
                      color: value !== undefined && value !== null ? color : "var(--text-tertiary)",
                    }}
                  >
                    {value !== undefined && value !== null ? String(value) : "—"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Narrative block */}
        {!!narrative && (
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
              {lang === "ja" ? "ストーリー" : "Narrative"}
            </p>
            <div
              style={{
                borderLeft: "2px solid var(--purple)",
                paddingLeft: 16,
                background: "var(--purple-dim)",
                borderRadius: "0 8px 8px 0",
                padding: "14px 16px",
              }}
            >
              <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.7 }}>
                {String(narrative)}
              </p>
            </div>
          </section>
        )}

        {/* Insight fields */}
        <section style={{ marginBottom: 24 }}>
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
            {lang === "ja" ? "洞察" : "Insights"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {INSIGHT_FIELDS.filter((f) => f.canonical !== "narrative").map(({ canonical, en, ja }) => {
              const value = insight[canonical];
              return (
                <div
                  key={canonical}
                  style={{
                    background: "var(--bg2)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "12px 14px",
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

        {/* Decision options */}
        {hasOptions && (
          <section style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
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
              {lang === "ja" ? "選択肢" : "Decision Options"}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {(decisionOptions as string[]).map((opt, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    background: "var(--bg2)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "10px 14px",
                  }}
                >
                  {/* Radio-style dot */}
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      border: "1px solid var(--purple)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: i === 0 ? "var(--purple)" : "transparent",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 9,
                      color: "var(--text-tertiary)",
                      width: 16,
                      flexShrink: 0,
                      paddingTop: 2,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-primary)" }}>{opt}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
