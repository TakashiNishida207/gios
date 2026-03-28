// src/ui/screens/PMFScreen.tsx
// PMF Score Dashboard — GIOS_SCORE_ENGINE による純粋関数スコア計算
// 因果ループ: PMFEvidence → calculatePMFScore → 可視化 → Action

"use client";

import { useState, useCallback } from "react";
import { usePreferences } from "@/ui/preferences";
import {
  calculatePMFScore,
  type PMFEvidence,
  type PMFScoreResult,
} from "@/score/GIOS_SCORE_ENGINE";

// ─── 定数 ─────────────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  "PMF Achieved": { color: "var(--green)",  bg: "var(--green-dim)",  border: "rgba(122,170,128,0.25)" },
  "Not Achieved": { color: "var(--red)",    bg: "var(--red-dim)",    border: "rgba(181,110,110,0.25)" },
};

const DEMO_SEGMENTS = ["Enterprise", "SMB", "Consumer"];

function scoreColor(total: number): string {
  if (total >= 65) return "var(--green)";
  if (total >= 45) return "var(--amber)";
  return "var(--red)";
}

// ─── デフォルトエビデンス ──────────────────────────────────────────────────────

function defaultEvidence(): PMFEvidence {
  return {
    day30Retention:            0,
    coreActionPerWeek:         0,
    behaviorChangeScore:       0,
    seanEllisVeryDisappointed: 0,
    nps:                       0,
    qualitativeHeat:           0,
    activationRate:            0,
    timeToValueScore:          0,
  };
}

// ─── サブコンポーネント ────────────────────────────────────────────────────────

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-secondary)", letterSpacing: "0.06em" }}>
          {label}
        </span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color }}>
          {Math.round(value)}<span style={{ color: "var(--text-tertiary)", fontSize: 9 }}>/{max}</span>
        </span>
      </div>
      <div style={{ height: 4, background: "var(--bg3)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function EvidenceInput({
  label, field, value, max, step, unit, onChange,
}: {
  label: string;
  field: keyof PMFEvidence;
  value: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (field: keyof PMFEvidence, v: number) => void;
}) {
  const pct = Math.min(value / max, 1) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <label style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", width: 200, flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}{unit && <span style={{ opacity: 0.6 }}> ({unit})</span>}
      </label>
      <input
        type="number" min={0} max={max} step={step}
        value={value}
        onChange={(e) => onChange(field, parseFloat(e.target.value) || 0)}
        style={{
          width: 64, background: "var(--bg3)", border: "1px solid var(--border)",
          borderRadius: 4, padding: "3px 6px", color: "var(--text-primary)",
          fontFamily: "var(--mono)", fontSize: 10, outline: "none",
        }}
      />
      <div style={{ flex: 1, height: 2, background: "var(--bg3)", borderRadius: 1, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "var(--text-tertiary)", borderRadius: 1, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

// ─── メイン画面 ────────────────────────────────────────────────────────────────

export default function PMFScreen() {
  const { lang } = usePreferences();

  const [segment,  setSegment]  = useState(DEMO_SEGMENTS[0]);
  const [evidence, setEvidence] = useState<PMFEvidence>(defaultEvidence);
  const [result,   setResult]   = useState<PMFScoreResult | null>(null);

  const handleEvidenceChange = useCallback(
    (field: keyof PMFEvidence, value: number) => {
      setEvidence((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSegmentChange = (s: string) => {
    setSegment(s);
    setEvidence(defaultEvidence());
    setResult(null);
  };

  // 純粋関数を直接呼ぶ — API 不要
  const handleCalculate = () => setResult(calculatePMFScore(evidence));

  const total       = result?.total ?? 0;
  const gaugeColor  = scoreColor(total);
  const status      = result?.status ?? "Not Achieved";
  const statusStyle = STATUS_STYLE[status];

  type F = { label: string; field: keyof PMFEvidence; max: number; step: number; unit?: string };

  const FIELDS: F[] = [
    // Behavior (45点)
    { label: lang === "ja" ? "30日継続率"              : "Day-30 Retention",     field: "day30Retention",            max: 1,   step: 0.01, unit: "0–1"   },
    { label: lang === "ja" ? "週あたりコアアクション"  : "Core Actions / Week",  field: "coreActionPerWeek",         max: 5,   step: 0.1,  unit: "回"    },
    { label: lang === "ja" ? "行動変容スコア"          : "Behavior Change",      field: "behaviorChangeScore",       max: 10,  step: 0.1,  unit: "0–10"  },
    // Emotion (35点)
    { label: "Sean Ellis VD率",                                                   field: "seanEllisVeryDisappointed", max: 1,   step: 0.01, unit: "0–1"   },
    { label: "NPS",                                                               field: "nps",                       max: 100, step: 1,    unit: "0–100" },
    { label: lang === "ja" ? "質的ヒートスコア"        : "Qualitative Heat",     field: "qualitativeHeat",           max: 5,   step: 0.1,  unit: "0–5"   },
    // Activation (20点)
    { label: lang === "ja" ? "アクティベーション率"    : "Activation Rate",      field: "activationRate",            max: 1,   step: 0.01, unit: "0–1"   },
    { label: lang === "ja" ? "価値実感スコア"          : "Time to Value Score",  field: "timeToValueScore",          max: 10,  step: 0.1,  unit: "0–10"  },
  ];

  const sectionStyle = { background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px", marginBottom: 12 };
  const sectionLabel = (text: string, color: string) => (
    <p style={{ fontFamily: "var(--mono)", fontSize: 8, color, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 8 }}>
      {text}
    </p>
  );

  return (
    <div style={{ overflowY: "auto", height: "100%" }}>
      <div style={{ padding: "28px 32px", maxWidth: 1100 }}>

        {/* Header */}
        <header style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.12em", color: "var(--green)", textTransform: "uppercase", marginBottom: 6 }}>
            PMF Score
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontFamily: "var(--sans)", fontSize: 26, fontWeight: 400, color: "var(--text-primary)", marginBottom: 4 }}>
                {lang === "ja" ? "PMFスコア" : "PMF Score"}
              </h1>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {lang === "ja" ? "行動・感情・アクティベーションの3次元でPMFを測定する" : "Measure PMF across behavioral, emotional, and activation dimensions"}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {lang === "ja" ? "セグメント" : "Segment"}
              </span>
              <select
                value={segment}
                onChange={(e) => handleSegmentChange(e.target.value)}
                style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 5, padding: "5px 10px", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 11, cursor: "pointer", outline: "none" }}
              >
                {DEMO_SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </header>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>

          {/* Left: evidence inputs */}
          <div>
            <p style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 14 }}>
              {lang === "ja" ? "エビデンス入力" : "Evidence Input"}
            </p>

            {sectionLabel(lang === "ja" ? "行動 (45点)" : "Behavior (45pts)", "var(--teal)")}
            <div style={sectionStyle}>
              {FIELDS.slice(0, 3).map((f) => <EvidenceInput key={f.field} {...f} value={evidence[f.field]} onChange={handleEvidenceChange} />)}
            </div>

            {sectionLabel(lang === "ja" ? "感情 (35点)" : "Emotion (35pts)", "var(--purple)")}
            <div style={sectionStyle}>
              {FIELDS.slice(3, 6).map((f) => <EvidenceInput key={f.field} {...f} value={evidence[f.field]} onChange={handleEvidenceChange} />)}
            </div>

            {sectionLabel(lang === "ja" ? "アクティベーション (20点)" : "Activation (20pts)", "var(--amber)")}
            <div style={{ ...sectionStyle, marginBottom: 16 }}>
              {FIELDS.slice(6).map((f) => <EvidenceInput key={f.field} {...f} value={evidence[f.field]} onChange={handleEvidenceChange} />)}
            </div>

            <button
              onClick={handleCalculate}
              style={{ padding: "8px 20px", background: "var(--green)", border: "none", borderRadius: 6, color: "var(--bg)", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 500, cursor: "pointer", letterSpacing: "0.04em" }}
            >
              {lang === "ja" ? "スコア計算" : "Calculate Score"}
            </button>
          </div>

          {/* Right: score panel */}
          <div style={{ position: "sticky", top: 0 }}>

            {/* Gauge */}
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px", marginBottom: 12, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: gaugeColor }} />
              <p style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>PMF Score</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 14 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 48, fontWeight: 300, color: gaugeColor, lineHeight: 1 }}>{Math.round(total)}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--text-tertiary)" }}>/ 100</span>
              </div>
              <div style={{ height: 6, background: "var(--bg3)", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ width: `${total}%`, height: "100%", borderRadius: 3, background: gaugeColor, transition: "width 0.8s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 8, color: "var(--text-tertiary)" }}>
                <span>0</span>
                <span style={{ color: "var(--green)", opacity: 0.7 }}>65 threshold</span>
                <span>100</span>
              </div>
            </div>

            {/* Status */}
            <div style={{ background: statusStyle.bg, border: `1px solid ${statusStyle.border}`, borderRadius: 8, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {lang === "ja" ? "ステータス" : "Status"}
              </span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 500, color: statusStyle.color, letterSpacing: "0.04em" }}>
                {status}
              </span>
            </div>

            {/* Sub-score bars */}
            {result ? (
              <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px" }}>
                <p style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                  {lang === "ja" ? "次元スコア" : "Dimension Scores"}
                </p>
                <ScoreBar label={lang === "ja" ? "行動 (Behavior)"    : "Behavior"}   value={result.behaviorScore}   max={45} color="var(--teal)"   />
                <ScoreBar label={lang === "ja" ? "感情 (Emotion)"      : "Emotion"}    value={result.emotionScore}    max={35} color="var(--purple)" />
                <ScoreBar label={lang === "ja" ? "アクティベーション"  : "Activation"} value={result.activationScore} max={20} color="var(--amber)"  />
              </div>
            ) : (
              <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px" }}>
                <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
                  {lang === "ja" ? "エビデンスを入力してスコアを計算してください" : "Enter evidence values and calculate score"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
