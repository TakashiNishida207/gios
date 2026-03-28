// app/chasm/page.tsx
// Chasm Score Dashboard — GIOS_SCORE_ENGINE による純粋関数スコア計算
// 因果ループ: ChasmEvidence → calculateChasmScore → 可視化 → Action

"use client";

import { useState, useCallback } from "react";
import { usePreferences } from "@/ui/preferences";
import {
  calculateChasmScore,
  type ChasmEvidence,
  type ChasmScoreResult,
} from "@/score/GIOS_SCORE_ENGINE";

// ─── 定数 ─────────────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  "Chasm Crossed": { color: "var(--green)",  bg: "var(--green-dim)",  border: "rgba(122,170,128,0.25)" },
  "Not Crossed":   { color: "var(--red)",    bg: "var(--red-dim)",    border: "rgba(181,110,110,0.25)" },
};

const DEMO_SEGMENTS = ["Enterprise", "SMB", "Consumer"];

function scoreColor(total: number): string {
  if (total >= 60) return "var(--green)";
  if (total >= 40) return "var(--amber)";
  return "var(--red)";
}

// ─── デフォルトエビデンス ──────────────────────────────────────────────────────

function defaultEvidence(): ChasmEvidence {
  return {
    segmentShare:             0,
    segmentPainIntensity:     0,
    referenceability:         0,
    winRate:                  0,
    repeatablePatternCount:   0,
    salesCycleConsistency:    0,
    messageClarity:           0,
    useCaseStandardization:   0,
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
  field: keyof ChasmEvidence;
  value: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (field: keyof ChasmEvidence, v: number) => void;
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
        style={{ width: 64, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 6px", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 10, outline: "none" }}
      />
      <div style={{ flex: 1, height: 2, background: "var(--bg3)", borderRadius: 1, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "var(--text-tertiary)", borderRadius: 1, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

// ─── メイン画面 ────────────────────────────────────────────────────────────────

export default function ChasmScreen() {
  const { lang } = usePreferences();

  const [segment,  setSegment]  = useState(DEMO_SEGMENTS[0]);
  const [evidence, setEvidence] = useState<ChasmEvidence>(defaultEvidence);
  const [result,   setResult]   = useState<ChasmScoreResult | null>(null);

  const handleChange = useCallback(
    (field: keyof ChasmEvidence, value: number) => {
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
  const handleCalculate = () => setResult(calculateChasmScore(evidence));

  const total       = result?.total ?? 0;
  const gaugeColor  = scoreColor(total);
  const status      = result?.status ?? "Not Crossed";
  const statusStyle = STATUS_STYLE[status];

  type F = { label: string; field: keyof ChasmEvidence; max: number; step: number; unit?: string };

  const FIELDS: F[] = [
    // Segment Dominance (40点)
    { label: lang === "ja" ? "セグメントシェア"        : "Segment Share",            field: "segmentShare",           max: 1,  step: 0.01, unit: "0–1"  },
    { label: lang === "ja" ? "セグメント痛みの強度"    : "Segment Pain Intensity",   field: "segmentPainIntensity",   max: 10, step: 0.1,  unit: "0–10" },
    { label: lang === "ja" ? "リファレンサビリティ"    : "Referenceability",         field: "referenceability",       max: 10, step: 0.1,  unit: "0–10" },
    // Sales Repeatability (40点)
    { label: lang === "ja" ? "商談勝率"                : "Win Rate",                 field: "winRate",                max: 1,  step: 0.01, unit: "0–1"  },
    { label: lang === "ja" ? "再現可能パターン数"      : "Repeatable Pattern Count", field: "repeatablePatternCount", max: 10, step: 1,    unit: "件"   },
    { label: lang === "ja" ? "営業サイクル一貫性"      : "Sales Cycle Consistency",  field: "salesCycleConsistency",  max: 10, step: 0.1,  unit: "0–10" },
    // Whole Product (20点)
    { label: lang === "ja" ? "メッセージ明確度"        : "Message Clarity",          field: "messageClarity",         max: 10, step: 0.1,  unit: "0–10" },
    { label: lang === "ja" ? "ユースケース標準化"      : "Use Case Standardization", field: "useCaseStandardization", max: 10, step: 0.1,  unit: "0–10" },
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
          <p style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.12em", color: "var(--amber)", textTransform: "uppercase", marginBottom: 6 }}>
            Chasm Score
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontFamily: "var(--sans)", fontSize: 26, fontWeight: 400, color: "var(--text-primary)", marginBottom: 4 }}>
                {lang === "ja" ? "Chasmスコア" : "Chasm Score"}
              </h1>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {lang === "ja"
                  ? "セグメント支配・営業再現性・ホールプロダクトの3次元でキャズム突破を測定する"
                  : "Measure Chasm Breakthrough across segment dominance, sales repeatability, and whole product"}
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

            {sectionLabel(lang === "ja" ? "セグメント支配 (40点)" : "Segment Dominance (40pts)", "var(--teal)")}
            <div style={sectionStyle}>
              {FIELDS.slice(0, 3).map((f) => <EvidenceInput key={f.field} {...f} value={evidence[f.field]} onChange={handleChange} />)}
            </div>

            {sectionLabel(lang === "ja" ? "営業再現性 (40点)" : "Sales Repeatability (40pts)", "var(--purple)")}
            <div style={sectionStyle}>
              {FIELDS.slice(3, 6).map((f) => <EvidenceInput key={f.field} {...f} value={evidence[f.field]} onChange={handleChange} />)}
            </div>

            {sectionLabel(lang === "ja" ? "ホールプロダクト (20点)" : "Whole Product (20pts)", "var(--amber)")}
            <div style={{ ...sectionStyle, marginBottom: 16 }}>
              {FIELDS.slice(6).map((f) => <EvidenceInput key={f.field} {...f} value={evidence[f.field]} onChange={handleChange} />)}
            </div>

            <button
              onClick={handleCalculate}
              style={{ padding: "8px 20px", background: "var(--amber)", border: "none", borderRadius: 6, color: "var(--bg)", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 500, cursor: "pointer", letterSpacing: "0.04em" }}
            >
              {lang === "ja" ? "スコア計算" : "Calculate Score"}
            </button>
          </div>

          {/* Right: score panel */}
          <div style={{ position: "sticky", top: 0 }}>

            {/* Gauge */}
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px", marginBottom: 12, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: gaugeColor }} />
              <p style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Chasm Score</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 14 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 48, fontWeight: 300, color: gaugeColor, lineHeight: 1 }}>{Math.round(total)}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--text-tertiary)" }}>/ 100</span>
              </div>
              <div style={{ height: 6, background: "var(--bg3)", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ width: `${total}%`, height: "100%", borderRadius: 3, background: gaugeColor, transition: "width 0.8s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 8, color: "var(--text-tertiary)" }}>
                <span>0</span>
                <span style={{ color: "var(--amber)", opacity: 0.7 }}>60 threshold</span>
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
                <ScoreBar label={lang === "ja" ? "セグメント支配"  : "Segment Dominance"}    value={result.segmentDominanceScore}   max={40} color="var(--teal)"   />
                <ScoreBar label={lang === "ja" ? "営業再現性"      : "Sales Repeatability"}  value={result.salesRepeatabilityScore} max={40} color="var(--purple)" />
                <ScoreBar label={lang === "ja" ? "ホールプロダクト" : "Whole Product"}        value={result.wholeProductScore}       max={20} color="var(--amber)"  />
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
