// app/chasm/page.tsx
// Chasm Breakthrough Phase Score Dashboard
// 因果ループ: structured_chasm_evidence → chasm_engine → 可視化 → Action

"use client";

import { useState, useEffect, useCallback } from "react";
import { usePreferences } from "@/ui/preferences";
import type { ChasmPhaseJudgment, ChasmEvidence } from "@/chasm/chasm_engine";

// ─── 型 ───────────────────────────────────────────────────────────────────────

type ScoreResult = ChasmPhaseJudgment & { ok: boolean };

// ─── 定数 ─────────────────────────────────────────────────────────────────────

const PHASE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  "Breakthrough": { color: "var(--green)",  bg: "var(--green-dim)",  border: "rgba(122,170,128,0.25)" },
  "Chasm":        { color: "var(--amber)",  bg: "var(--amber-dim)",  border: "rgba(181,150,100,0.25)" },
  "Pre-Chasm":    { color: "var(--red)",    bg: "var(--red-dim)",    border: "rgba(181,110,110,0.25)" },
};

const DEMO_SEGMENTS = ["Enterprise", "SMB", "Consumer"];

/** Chasm スコアに応じた色 (0-1 スケール) */
function scoreColor(score: number): string {
  if (score >= 0.70) return "var(--green)";
  if (score >= 0.55) return "var(--amber)";
  return "var(--red)";
}

// ─── デモ用デフォルトエビデンス ───────────────────────────────────────────────

function defaultEvidence(segment: string): ChasmEvidence {
  return {
    segment,
    win_rate:                   0,
    deal_velocity:              30,  // 30日 (default)
    renewal_rate:               0,
    multi_threading_score:      0,
    reference_count:            0,
    reference_strength:         0,
    before_after_clarity:       0,
    industry_reference_density: 0,
    adjacent_segment_fit:       0,
    adoption_barrier:           5,   // 中程度 (default)
    price_sensitivity:          5,   // 中程度 (default)
    expansion_success_rate:     0,
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

// 0-1 フィールド用入力（スライダー付き）
function EvidenceInput01({
  label, field, value, onChange,
}: {
  label: string;
  field: keyof ChasmEvidence;
  value: number;
  onChange: (field: keyof ChasmEvidence, v: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <label style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", width: 180, flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <input
        type="number" min="0" max="1" step="0.01"
        value={value}
        onChange={(e) => onChange(field, parseFloat(e.target.value) || 0)}
        style={{ width: 64, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 6px", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 10, outline: "none" }}
      />
      <div style={{ flex: 1, height: 2, background: "var(--bg3)", borderRadius: 1, overflow: "hidden" }}>
        <div style={{ width: `${value * 100}%`, height: "100%", background: "var(--text-tertiary)", borderRadius: 1, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

// 正の数フィールド用入力（逆数フィールド: deal_velocity / adoption_barrier / price_sensitivity）
function EvidenceInputPositive({
  label, field, value, unit, onChange,
}: {
  label: string;
  field: keyof ChasmEvidence;
  value: number;
  unit:  string;
  onChange: (field: keyof ChasmEvidence, v: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <label style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", width: 180, flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <input
        type="number" min="0.1" step="0.1"
        value={value}
        onChange={(e) => onChange(field, parseFloat(e.target.value) || 1)}
        style={{ width: 64, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 6px", color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: 10, outline: "none" }}
      />
      <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", flexShrink: 0 }}>
        {unit}
      </span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--teal)", flexShrink: 0 }}>
        → {(1 / (value > 0 ? value : 1)).toFixed(3)}
      </span>
    </div>
  );
}

// ─── メイン画面 ────────────────────────────────────────────────────────────────

export default function ChasmScreen() {
  const { lang } = usePreferences();

  const [segment,  setSegment]  = useState(DEMO_SEGMENTS[0]);
  const [evidence, setEvidence] = useState<ChasmEvidence>(() => defaultEvidence(DEMO_SEGMENTS[0]));
  const [result,   setResult]   = useState<ScoreResult | null>(null);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    setEvidence(defaultEvidence(segment));
    setResult(null);
  }, [segment]);

  const handleChange = useCallback(
    (field: keyof ChasmEvidence, value: number) => {
      setEvidence((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/chasm/score", {
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

  const phase       = result?.phase ?? "Pre-Chasm";
  const phaseStyle  = PHASE_COLORS[phase] ?? PHASE_COLORS["Pre-Chasm"];
  const chasmScore  = result?.scores.chasm_score ?? 0;
  const gaugeColor  = scoreColor(chasmScore);

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
              <h1 style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 400, color: "var(--text-primary)", marginBottom: 4 }}>
                {lang === "ja" ? "Chasmスコア" : "Chasm Score"}
              </h1>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {lang === "ja"
                  ? "支配・リファレンス・拡張の3次元でキャズム突破を測定する"
                  : "Measure Chasm Breakthrough across dominance, reference, and expansion dimensions"}
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

            {/* Dominance section */}
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px", marginBottom: 12 }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em", color: "var(--teal)", textTransform: "uppercase", marginBottom: 12 }}>
                {lang === "ja" ? "支配次元" : "Dominance"}
              </p>
              <EvidenceInput01      label={lang === "ja" ? "商談勝率"           : "Win Rate"}              field="win_rate"              value={evidence.win_rate}              onChange={handleChange} />
              <EvidenceInputPositive label={lang === "ja" ? "成約速度（日）"    : "Deal Velocity (days)"} field="deal_velocity"         value={evidence.deal_velocity}         unit="days"  onChange={handleChange} />
              <EvidenceInput01      label={lang === "ja" ? "更新率"             : "Renewal Rate"}          field="renewal_rate"          value={evidence.renewal_rate}          onChange={handleChange} />
              <EvidenceInput01      label={lang === "ja" ? "マルチスレッディング" : "Multi-threading"}       field="multi_threading_score" value={evidence.multi_threading_score} onChange={handleChange} />
            </div>

            {/* Reference section */}
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px", marginBottom: 12 }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em", color: "var(--purple)", textTransform: "uppercase", marginBottom: 12 }}>
                {lang === "ja" ? "リファレンス次元" : "Reference"}
              </p>
              <EvidenceInput01 label={lang === "ja" ? "リファレンス数"       : "Reference Count"}       field="reference_count"            value={evidence.reference_count}            onChange={handleChange} />
              <EvidenceInput01 label={lang === "ja" ? "リファレンス強度"     : "Reference Strength"}    field="reference_strength"         value={evidence.reference_strength}         onChange={handleChange} />
              <EvidenceInput01 label={lang === "ja" ? "Before/After 明確度"  : "Before/After Clarity"}  field="before_after_clarity"       value={evidence.before_after_clarity}       onChange={handleChange} />
              <EvidenceInput01 label={lang === "ja" ? "業界導入密度"         : "Industry Ref. Density"} field="industry_reference_density" value={evidence.industry_reference_density} onChange={handleChange} />
            </div>

            {/* Expansion section */}
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em", color: "var(--green)", textTransform: "uppercase", marginBottom: 12 }}>
                {lang === "ja" ? "拡張次元" : "Expansion"}
              </p>
              <EvidenceInput01       label={lang === "ja" ? "隣接セグメント適合度" : "Adjacent Segment Fit"} field="adjacent_segment_fit"    value={evidence.adjacent_segment_fit}    onChange={handleChange} />
              <EvidenceInputPositive label={lang === "ja" ? "導入障壁"            : "Adoption Barrier"}     field="adoption_barrier"       value={evidence.adoption_barrier}       unit="1-10" onChange={handleChange} />
              <EvidenceInputPositive label={lang === "ja" ? "価格感度"            : "Price Sensitivity"}    field="price_sensitivity"      value={evidence.price_sensitivity}      unit="1-10" onChange={handleChange} />
              <EvidenceInput01       label={lang === "ja" ? "拡張成功率"          : "Expansion Success"}    field="expansion_success_rate" value={evidence.expansion_success_rate} onChange={handleChange} />
            </div>

            <button
              onClick={handleCalculate}
              disabled={loading}
              style={{ padding: "8px 20px", background: "var(--amber)", border: "none", borderRadius: 6, color: "var(--bg)", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1, letterSpacing: "0.04em", transition: "opacity 0.15s" }}
            >
              {loading ? "…" : lang === "ja" ? "スコア計算" : "Calculate Score"}
            </button>
          </div>

          {/* Right: score panel */}
          <div style={{ position: "sticky", top: 0 }}>

            {/* Chasm Score Gauge */}
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px", marginBottom: 12, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: gaugeColor }} />

              <p style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                Chasm Score
              </p>

              {/* Large score number — chasm_score は 0-1、表示時に × 100 */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 14 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 48, fontWeight: 300, color: gaugeColor, lineHeight: 1 }}>
                  {Math.round(chasmScore * 100)}
                </span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--text-tertiary)" }}>/ 100</span>
              </div>

              {/* Gauge bar */}
              <div style={{ height: 6, background: "var(--bg3)", borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
                <div style={{ width: `${chasmScore * 100}%`, height: "100%", borderRadius: 3, background: gaugeColor, transition: "width 0.8s ease" }} />
              </div>

              {/* Threshold markers: Pre-Chasm / Chasm (55%) / Breakthrough (70%) */}
              <div style={{ position: "relative", height: 10, marginBottom: 6 }}>
                {[55, 70].map((threshold) => (
                  <div key={threshold} style={{ position: "absolute", left: `${threshold}%`, top: 0, width: 1, height: 10, background: "var(--border)" }} />
                ))}
              </div>
              <div style={{ display: "flex", fontFamily: "var(--mono)", fontSize: 8, color: "var(--text-tertiary)", position: "relative" }}>
                <span>0</span>
                <span style={{ position: "absolute", left: "calc(55% + 2px)" }}>55</span>
                <span style={{ position: "absolute", left: "calc(70% + 2px)" }}>70</span>
                <span style={{ marginLeft: "auto" }}>100</span>
              </div>
            </div>

            {/* Phase badge */}
            <div style={{ background: phaseStyle.bg, border: `1px solid ${phaseStyle.border}`, borderRadius: 8, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {lang === "ja" ? "フェーズ" : "Phase"}
              </span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 500, color: phaseStyle.color, letterSpacing: "0.04em" }}>
                {phase}
              </span>
            </div>

            {/* Sub-score bars */}
            {result ? (
              <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px" }}>
                <p style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                  {lang === "ja" ? "次元スコア" : "Dimension Scores"}
                </p>
                <ScoreBar
                  label={lang === "ja" ? "支配 (Dominance)" : "Dominance"}
                  value={result.scores.dominance_score}
                  color="var(--teal)"
                />
                <ScoreBar
                  label={lang === "ja" ? "リファレンス (Reference)" : "Reference"}
                  value={result.scores.reference_score}
                  color="var(--purple)"
                />
                <ScoreBar
                  label={lang === "ja" ? "拡張 (Expansion)" : "Expansion"}
                  value={result.scores.expansion_score}
                  color="var(--green)"
                />
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
