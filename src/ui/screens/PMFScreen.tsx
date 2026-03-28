// src/ui/screens/PMFScreen.tsx
// PMF Score Dashboard — セグメント別スコアゲージとフェーズバッジ
// 因果ループ: structured_evidence → score_engine → 可視化 → Action

"use client";

import { useState, useEffect, useCallback } from "react";
import { usePreferences } from "@/ui/preferences";
import type { PhaseJudgment, StructuredEvidence } from "@/pmf/score_engine";

// ─── 型 ───────────────────────────────────────────────────────────────────────

type ScoreResult = PhaseJudgment & { ok: boolean };

// ─── 定数 ─────────────────────────────────────────────────────────────────────

const PHASE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  "Scale":    { color: "var(--teal)",   bg: "var(--teal-dim)",   border: "rgba(110,181,160,0.25)" },
  "Chasm":    { color: "var(--purple)", bg: "var(--purple-dim)", border: "rgba(139,130,192,0.25)" },
  "PMF":      { color: "var(--green)",  bg: "var(--green-dim)",  border: "rgba(122,170,128,0.25)" },
  "Pre-PMF":  { color: "var(--red)",    bg: "var(--red-dim)",    border: "rgba(181,110,110,0.25)" },
};

const DEMO_SEGMENTS = ["Enterprise", "SMB", "Consumer"];

// PMF スコアに応じた色を返す（score は 0-1 正規化済み）
function scoreColor(score: number): string {
  if (score >= 0.60) return "var(--green)";
  if (score >= 0.40) return "var(--amber)";
  return "var(--red)";
}

// ─── デモ用デフォルトエビデンス ───────────────────────────────────────────────

function defaultEvidence(segment: string): StructuredEvidence {
  return {
    segment,
    retention_rate:             0,
    behavior_change_score:      0,
    time_to_value:              1,
    segment_dominance:          0,
    sean_ellis_vd_ratio:        0,
    value_moment_frequency:     0,
    emotional_dependency_score: 0,
    willingness_to_pay:         0,
    ltv:                        0,
    cac:                        0,
    churn_sensitivity:          0,
    growth_channels:            0,
  };
}

// ─── サブコンポーネント ────────────────────────────────────────────────────────

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-secondary)", letterSpacing: "0.06em" }}>
          {label}
        </span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color }}>
          {Math.round(value * 100)}
        </span>
      </div>
      <div style={{ height: 4, background: "var(--bg3)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value * 100}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function EvidenceInput({
  label, field, value, onChange,
}: {
  label: string;
  field: keyof StructuredEvidence;
  value: number;
  onChange: (field: keyof StructuredEvidence, v: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <label style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", width: 160, flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <input
        type="number" min="0" max="1" step="0.01"
        value={value}
        onChange={(e) => onChange(field, parseFloat(e.target.value) || 0)}
        style={{
          width: 64, background: "var(--bg3)", border: "1px solid var(--border)",
          borderRadius: 4, padding: "3px 6px", color: "var(--text-primary)",
          fontFamily: "var(--mono)", fontSize: 10, outline: "none",
        }}
      />
      <div style={{ flex: 1, height: 2, background: "var(--bg3)", borderRadius: 1, overflow: "hidden" }}>
        <div style={{ width: `${value * 100}%`, height: "100%", background: "var(--text-tertiary)", borderRadius: 1, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

// ─── メイン画面 ────────────────────────────────────────────────────────────────

export default function PMFScreen() {
  const { lang } = usePreferences();

  const [segment,  setSegment]  = useState(DEMO_SEGMENTS[0]);
  const [evidence, setEvidence] = useState<StructuredEvidence>(() => defaultEvidence(DEMO_SEGMENTS[0]));
  const [result,   setResult]   = useState<ScoreResult | null>(null);
  const [loading,  setLoading]  = useState(false);

  // セグメント変更時にエビデンスをリセット
  useEffect(() => {
    setEvidence(defaultEvidence(segment));
    setResult(null);
  }, [segment]);

  const handleEvidenceChange = useCallback(
    (field: keyof StructuredEvidence, value: number) => {
      setEvidence((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/pmf/score/calculate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(evidence),
      });
      const data = await res.json() as ScoreResult;
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const phase      = result?.phase ?? "Pre-PMF";
  const phaseStyle = PHASE_COLORS[phase] ?? PHASE_COLORS["Pre-PMF"];
  const pmfScore   = result?.scores.pmf_score ?? 0;
  const gaugeColor = scoreColor(pmfScore);

  const EVIDENCE_FIELDS: { label: string; field: keyof StructuredEvidence }[] = [
    { label: lang === "ja" ? "継続率"             : "Retention Rate",            field: "retention_rate"             },
    { label: lang === "ja" ? "行動変容"           : "Behavior Change",            field: "behavior_change_score"      },
    { label: lang === "ja" ? "価値実感時間(日)"   : "Time to Value (days)",       field: "time_to_value"              },
    { label: lang === "ja" ? "セグメント支配率"   : "Segment Dominance",          field: "segment_dominance"          },
    { label: lang === "ja" ? "Sean Ellis VD率"    : "Sean Ellis VD Ratio",        field: "sean_ellis_vd_ratio"        },
    { label: lang === "ja" ? "Value Moment頻度"   : "Value Moment Freq.",         field: "value_moment_frequency"     },
    { label: lang === "ja" ? "感情的依存"         : "Emotional Dependency",       field: "emotional_dependency_score" },
    { label: lang === "ja" ? "支払意欲"           : "Willingness to Pay",         field: "willingness_to_pay"         },
    { label: "LTV",                                                                field: "ltv"                        },
    { label: "CAC",                                                                field: "cac"                        },
    { label: lang === "ja" ? "解約感度"           : "Churn Sensitivity",          field: "churn_sensitivity"          },
    { label: lang === "ja" ? "成長チャネル数"     : "Growth Channels",            field: "growth_channels"            },
  ];

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
                {lang === "ja" ? "行動・感情・経済の3次元でPMFを測定する" : "Measure PMF across behavioral, emotional, and economic dimensions"}
              </p>
            </div>

            {/* Segment selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {lang === "ja" ? "セグメント" : "Segment"}
              </span>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                style={{
                  background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 5,
                  padding: "5px 10px", color: "var(--text-primary)", fontFamily: "var(--mono)",
                  fontSize: 11, cursor: "pointer", outline: "none",
                }}
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

            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
              {EVIDENCE_FIELDS.map(({ label, field }) => (
                <EvidenceInput
                  key={field}
                  label={label}
                  field={field}
                  value={(evidence[field] as number) ?? 0}
                  onChange={handleEvidenceChange}
                />
              ))}
            </div>

            <button
              onClick={handleCalculate}
              disabled={loading}
              style={{
                padding: "8px 20px", background: "var(--green)", border: "none", borderRadius: 6,
                color: "var(--bg)", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1,
                letterSpacing: "0.04em", transition: "opacity 0.15s",
              }}
            >
              {loading ? "…" : lang === "ja" ? "スコア計算" : "Calculate Score"}
            </button>
          </div>

          {/* Right: score panel */}
          <div style={{ position: "sticky", top: 0 }}>

            {/* PMF Score Gauge */}
            <div style={{
              background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10,
              padding: "20px", marginBottom: 12, position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: gaugeColor }} />

              <p style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                PMF Score
              </p>

              {/* Large score number — pmfScore は 0-1、表示時に × 100 */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 14 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 48, fontWeight: 300, color: gaugeColor, lineHeight: 1 }}>
                  {Math.round(pmfScore * 100)}
                </span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--text-tertiary)" }}>/ 100</span>
              </div>

              {/* Gauge bar */}
              <div style={{ height: 6, background: "var(--bg3)", borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
                <div style={{
                  width: `${pmfScore * 100}%`, height: "100%", borderRadius: 3,
                  background: gaugeColor, transition: "width 0.8s ease",
                }} />
              </div>

              {/* Threshold markers */}
              <div style={{ position: "relative", height: 10, marginBottom: 6 }}>
                {[40, 60, 70, 75].map((threshold) => (
                  <div key={threshold} style={{
                    position: "absolute", left: `${threshold}%`,
                    top: 0, width: 1, height: 10, background: "var(--border)",
                  }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 8, color: "var(--text-tertiary)" }}>
                <span>0</span>
                <span style={{ position: "absolute", left: "calc(40% + 20px)" }}>40</span>
                <span style={{ position: "absolute", left: "calc(60% + 20px)" }}>60</span>
                <span style={{ marginLeft: "auto" }}>100</span>
              </div>
            </div>

            {/* Phase badge */}
            <div style={{
              background: phaseStyle.bg, border: `1px solid ${phaseStyle.border}`,
              borderRadius: 8, padding: "12px 16px", marginBottom: 12,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {lang === "ja" ? "フェーズ" : "Phase"}
              </span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 500, color: phaseStyle.color, letterSpacing: "0.04em" }}>
                {phase}
              </span>
            </div>

            {/* Sub-score bars */}
            {result && (
              <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px" }}>
                <p style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                  {lang === "ja" ? "次元スコア" : "Dimension Scores"}
                </p>
                <ScoreBar
                  label={lang === "ja" ? "行動 (Behavioral)" : "Behavioral"}
                  value={result.scores.behavioral_score}
                  color="var(--teal)"
                />
                <ScoreBar
                  label={lang === "ja" ? "感情 (Emotional)" : "Emotional"}
                  value={result.scores.emotional_score}
                  color="var(--purple)"
                />
                <ScoreBar
                  label={lang === "ja" ? "経済 (Economic)" : "Economic"}
                  value={result.scores.economic_score}
                  color="var(--amber)"
                />
              </div>
            )}

            {/* No data state */}
            {!result && (
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
