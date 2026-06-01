// src/ui/screens/InsightScreen.tsx
// Insight Screen — インサイト・仮説・選択肢を編集・保存・Notion同期する
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useGDIOSStore } from "@/store";
import { usePreferences } from "@/ui/preferences";

const FLOW_STRIP = [
  { label: "Input",      active: false, color: "var(--teal)"   },
  { label: "Processing", active: false, color: "var(--amber)"  },
  { label: "Insight",    active: true,  color: "var(--purple)" },
  { label: "Action",     active: false, color: "var(--accent)" },
  { label: "Feedback",   active: false, color: "var(--red)"    },
  { label: "Learning",   active: false, color: "var(--green)"  },
];

const inputStyle: React.CSSProperties = {
  background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6,
  padding: "8px 12px", color: "var(--text-primary)", fontFamily: "var(--sans)",
  fontSize: 12, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = {
  fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)",
  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "block",
};

type FormState = {
  narrative: string; valueHypothesis: string; decisionRationale: string;
  successMetric: string; decisionOptions: string;
  gapLevel: string; priorityScore: string; painSeverity: string; opportunitySize: string;
};

export default function InsightScreen() {
  const insight    = useGDIOSStore((s) => s.flow.Insight);
  const processing = useGDIOSStore((s) => s.flow.Processing);
  const flowInput  = useGDIOSStore((s) => s.flow.Input);
  const setFlow    = useGDIOSStore((s) => s.setFlow);
  const appendDiff = useGDIOSStore((s) => s.appendDiff);
  const { lang }   = usePreferences();

  const makeForm = useCallback((): FormState => ({
    narrative:         String(insight["narrative"]         ?? ""),
    valueHypothesis:   String(insight["valueHypothesis"]   ?? ""),
    decisionRationale: String(insight["decisionRationale"] ?? ""),
    successMetric:     String(insight["successMetric"]     ?? ""),
    decisionOptions:   Array.isArray(insight["decisionOptions"])
      ? (insight["decisionOptions"] as string[]).join("\n")
      : String(insight["decisionOptions"] ?? ""),
    gapLevel:        String(processing["gapLevel"]        ?? ""),
    priorityScore:   String(processing["priorityScore"]   ?? ""),
    painSeverity:    String(processing["painSeverity"]    ?? ""),
    opportunitySize: String(processing["opportunitySize"] ?? ""),
  }), [insight, processing]);

  const [form, setForm] = useState<FormState>(makeForm);
  const [saved, setSaved] = useState(false);
  const [queued, setQueued] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  const prevInsightRef    = useRef(insight);
  const prevProcessingRef = useRef(processing);
  useEffect(() => {
    if (insight !== prevInsightRef.current || processing !== prevProcessingRef.current) {
      prevInsightRef.current    = insight;
      prevProcessingRef.current = processing;
      setForm(makeForm());
    }
  }, [insight, processing, makeForm]);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setSaved(false);
    setQueued(false);
  };

  const handleSave = () => {
    const insightData = {
      narrative:         form.narrative         || undefined,
      valueHypothesis:   form.valueHypothesis   || undefined,
      decisionRationale: form.decisionRationale || undefined,
      successMetric:     form.successMetric     || undefined,
      decisionOptions:   form.decisionOptions ? form.decisionOptions.split("\n").filter(Boolean) : undefined,
    };
    const processingData = {
      gapLevel:        form.gapLevel        ? parseFloat(form.gapLevel)        : undefined,
      priorityScore:   form.priorityScore   ? parseFloat(form.priorityScore)   : undefined,
      painSeverity:    form.painSeverity    ? parseFloat(form.painSeverity)    : undefined,
      opportunitySize: form.opportunitySize ? parseFloat(form.opportunitySize) : undefined,
    };
    setFlow("Insight",    Object.fromEntries(Object.entries(insightData).filter(([,v]) => v !== undefined)));
    setFlow("Processing", Object.fromEntries(Object.entries(processingData).filter(([,v]) => v !== undefined)));
    setSaved(true);
  };

  const handleSyncToNotion = () => {
    try {
      handleSave();
      appendDiff({
        ...Object.fromEntries(Object.entries(form).filter(([,v]) => String(v).trim() !== "")),
        customerId: flowInput.customerId,  // 書き戻し先 Notion レコードの特定に使用
      });
      setQueued(true);
    } catch (e) {
      console.error("Notion queue error:", e);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "Insight", input: flowInput }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Generation failed");
      const d = json.data as Record<string, unknown>;
      setForm((prev) => ({
        narrative:         d["narrative"]         != null ? String(d["narrative"])         : prev.narrative,
        valueHypothesis:   d["valueHypothesis"]   != null ? String(d["valueHypothesis"])   : prev.valueHypothesis,
        decisionRationale: d["decisionRationale"] != null ? String(d["decisionRationale"]) : prev.decisionRationale,
        successMetric:     d["successMetric"]     != null ? String(d["successMetric"])     : prev.successMetric,
        decisionOptions:   d["decisionOptions"]   != null ? String(d["decisionOptions"])   : prev.decisionOptions,
        gapLevel:          d["gapLevel"]          != null ? String(d["gapLevel"])          : prev.gapLevel,
        priorityScore:     d["priorityScore"]     != null ? String(d["priorityScore"])     : prev.priorityScore,
        painSeverity:      d["painSeverity"]      != null ? String(d["painSeverity"])      : prev.painSeverity,
        opportunitySize:   d["opportunitySize"]   != null ? String(d["opportunitySize"])   : prev.opportunitySize,
      }));
      setSaved(false);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setGenerating(false);
    }
  };

  const SCORING = [
    { key: "gapLevel",        label: "Gap Level",        color: "var(--teal)"   },
    { key: "priorityScore",   label: "Priority Score",   color: "var(--amber)"  },
    { key: "painSeverity",    label: "Pain Severity",    color: "var(--red)"    },
    { key: "opportunitySize", label: "Opportunity Size", color: "var(--purple)" },
  ] as const;

  return (
    <div style={{ overflowY: "auto", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "28px 32px", maxWidth: 1100, flex: 1 }}>

        {/* Flow strip */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 24, padding: "8px 12px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8 }}>
          {FLOW_STRIP.map((p, i) => (
            <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {i > 0 && <div style={{ width: 16, height: 1, background: "var(--border)", margin: "0 2px" }} />}
              <div style={{ padding: "3px 8px", borderRadius: 4, fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.06em", background: p.active ? "var(--purple-dim)" : "transparent", color: p.active ? p.color : "var(--text-tertiary)", border: p.active ? "1px solid rgba(139,130,192,0.25)" : "1px solid transparent" }}>
                {p.label}
              </div>
            </div>
          ))}
        </div>

        {/* Header */}
        <header style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.12em", color: "var(--purple)", textTransform: "uppercase", marginBottom: 6 }}>Insight</p>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontFamily: "var(--sans)", fontSize: 26, fontWeight: 400, color: "var(--text-primary)", marginBottom: 4 }}>
                {lang === "ja" ? "インサイト" : "Insight"}
              </h1>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {lang === "ja" ? "意味づけ・仮説・意思決定の根拠を記録する" : "Record meaning, hypotheses, and decision rationale"}
              </p>
            </div>
            {saved && <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--green)" }}>✓ {lang === "ja" ? "保存済み" : "Saved"}</span>}
          </div>
        </header>

        {/* AI Generate Banner */}
        <div style={{ marginBottom: 24, padding: "14px 18px", background: "var(--bg2)", border: "1px solid rgba(139,130,192,0.3)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--purple)", marginBottom: 3 }}>
              ✦ {lang === "ja" ? "AI ドラフト生成" : "AI Draft Generation"}
            </p>
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.5 }}>
              {lang === "ja"
                ? "インプット情報をもとにドラフトを自動生成します（B）。生成後も手動編集できます（A+B）。手動入力のみの場合はスキップしてください（A）。"
                : "Auto-generate draft from Input data (B). Edit after generation (A+B). Or skip and enter manually (A)."}
            </p>
            {genError && <p style={{ fontSize: 11, color: "var(--red)", marginTop: 6 }}>⚠ {genError}</p>}
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{ padding: "9px 20px", background: generating ? "var(--bg3)" : "var(--purple)", border: "none", borderRadius: 6, color: generating ? "var(--text-tertiary)" : "var(--bg)", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 500, cursor: generating ? "not-allowed" : "pointer", letterSpacing: "0.04em", whiteSpace: "nowrap", minWidth: 130 }}>
            {generating ? (lang === "ja" ? "生成中…" : "Generating…") : (lang === "ja" ? "✦ AI で生成" : "✦ Generate with AI")}
          </button>
        </div>

        {/* Scoring */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ ...labelStyle, marginBottom: 12 }}>{lang === "ja" ? "スコアリング" : "Scoring"}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {SCORING.map(({ key, label, color }) => (
              <div key={key} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color }} />
                <label style={{ ...labelStyle, color }}>{label}</label>
                <input type="number" step="0.1" value={form[key]} onChange={set(key)}
                  style={{ ...inputStyle, fontFamily: "var(--mono)", fontSize: 18, fontWeight: 300, color, background: "transparent", border: "none", padding: "0", width: "100%" }} />
              </div>
            ))}
          </div>
        </section>

        {/* Narrative */}
        <section style={{ marginBottom: 16 }}>
          <label style={labelStyle}>{lang === "ja" ? "ストーリー" : "Narrative"}</label>
          <textarea rows={4} value={form.narrative} onChange={set("narrative")}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }} />
        </section>

        {([
          { key: "valueHypothesis",   ja: "価値仮説",          en: "Value Hypothesis",              rows: 3 },
          { key: "decisionRationale", ja: "選択理由",          en: "Decision Rationale",            rows: 3 },
          { key: "successMetric",     ja: "KPI",               en: "Success Metric",                rows: 1 },
          { key: "decisionOptions",   ja: "選択肢（1行1項目）", en: "Decision Options (one per line)", rows: 4 },
        ] as const).map(({ key, ja, en, rows }) => (
          <section key={key} style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{lang === "ja" ? ja : en}</label>
            <textarea rows={rows} value={form[key]} onChange={set(key)}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
          </section>
        ))}

        <div style={{ paddingBottom: 80 }} />
      </div>

      {/* Sticky action bar */}
      <div style={{ position: "sticky", bottom: 0, background: "var(--bg)", borderTop: "1px solid var(--border)", padding: "12px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
        <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: queued ? "var(--teal)" : saved ? "var(--green)" : "var(--text-tertiary)" }}>
          {queued
            ? (lang === "ja" ? "✓ Notion キューに追加済み" : "✓ Queued to Notion")
            : saved
              ? (lang === "ja" ? "✓ 保存済み" : "✓ Saved")
              : (lang === "ja" ? "A: 手動入力　B: AI生成　A+B: 生成後に編集" : "A: Manual　B: AI　A+B: Generate then edit")}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSave}
            style={{ padding: "8px 20px", background: "var(--purple)", border: "none", borderRadius: 6, color: "var(--bg)", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 500, cursor: "pointer", letterSpacing: "0.04em" }}>
            {lang === "ja" ? "保存" : "Save"}
          </button>
          <button onClick={handleSyncToNotion}
            style={{ padding: "8px 18px", background: queued ? "var(--teal)" : "var(--bg2)", border: queued ? "1px solid var(--teal)" : "1px solid var(--border)", borderRadius: 6, color: queued ? "var(--bg)" : "var(--text-secondary)", fontFamily: "var(--mono)", fontSize: 11, cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.2s" }}>
            {queued
              ? (lang === "ja" ? "✓ キュー済み" : "✓ Queued")
              : (lang === "ja" ? "保存 & Notion キューに積む" : "Save & Queue to Notion")}
          </button>
        </div>
      </div>
    </div>
  );
}
