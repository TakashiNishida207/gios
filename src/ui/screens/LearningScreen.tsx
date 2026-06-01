// src/ui/screens/LearningScreen.tsx
// Learning Screen — 学び・更新仮説・プレイブックを編集・保存・Notion同期する
"use client";

import { useState, useEffect, useRef } from "react";
import { useGDIOSStore } from "@/store";
import { usePreferences } from "@/ui/preferences";

type FormState = {
  learning: string; updatedHypothesis: string; updatedNarrative: string;
  playbookUpdate: string; bestPractice: string; antiPattern: string;
};

const inputStyle: React.CSSProperties = {
  background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6,
  padding: "8px 12px", color: "var(--text-primary)", fontFamily: "var(--sans)",
  fontSize: 12, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = {
  fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-tertiary)",
  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "block",
};

export default function LearningScreen() {
  const learning   = useGDIOSStore((s) => s.flow.Learning);
  const growth     = useGDIOSStore((s) => s.intelligence.Growth);
  const flowInput  = useGDIOSStore((s) => s.flow.Input);
  const setFlow    = useGDIOSStore((s) => s.setFlow);
  const setIntelligence = useGDIOSStore((s) => s.setIntelligence);
  const appendDiff = useGDIOSStore((s) => s.appendDiff);
  const { lang }   = usePreferences();

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState("");

  const [form, setFormState] = useState<FormState>({
    learning:          String(learning["learning"]          ?? ""),
    updatedHypothesis: String(learning["updatedHypothesis"] ?? ""),
    updatedNarrative:  String(learning["updatedNarrative"]  ?? ""),
    playbookUpdate:    String(learning["playbookUpdate"]    ?? ""),
    bestPractice:      String(growth["bestPractice"]        ?? ""),
    antiPattern:       String(growth["antiPattern"]         ?? ""),
  });
  const [saved, setSaved] = useState(false);
  const [queued, setQueued] = useState(false);

  const prevLearningRef = useRef(learning);
  const prevGrowthRef   = useRef(growth);
  useEffect(() => {
    if (learning !== prevLearningRef.current || growth !== prevGrowthRef.current) {
      prevLearningRef.current = learning;
      prevGrowthRef.current   = growth;
      setFormState({
        learning:          String(learning["learning"]          ?? ""),
        updatedHypothesis: String(learning["updatedHypothesis"] ?? ""),
        updatedNarrative:  String(learning["updatedNarrative"]  ?? ""),
        playbookUpdate:    String(learning["playbookUpdate"]    ?? ""),
        bestPractice:      String(growth["bestPractice"]        ?? ""),
        antiPattern:       String(growth["antiPattern"]         ?? ""),
      });
    }
  }, [learning, growth]);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormState((p) => ({ ...p, [k]: e.target.value }));
    setSaved(false);
    setQueued(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "Learning", input: flowInput }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Generation failed");
      const d = json.data as Record<string, unknown>;
      setFormState((prev) => ({
        learning:          d["learning"]          != null ? String(d["learning"])          : prev.learning,
        updatedHypothesis: d["updatedHypothesis"] != null ? String(d["updatedHypothesis"]) : prev.updatedHypothesis,
        updatedNarrative:  d["updatedNarrative"]  != null ? String(d["updatedNarrative"])  : prev.updatedNarrative,
        playbookUpdate:    d["playbookUpdate"]    != null ? String(d["playbookUpdate"])    : prev.playbookUpdate,
        bestPractice:      d["bestPractice"]      != null ? String(d["bestPractice"])      : prev.bestPractice,
        antiPattern:       d["antiPattern"]       != null ? String(d["antiPattern"])       : prev.antiPattern,
      }));
      setSaved(false);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    const learningData: Record<string, unknown> = {};
    if (form.learning.trim())          learningData.learning          = form.learning.trim();
    if (form.updatedHypothesis.trim()) learningData.updatedHypothesis = form.updatedHypothesis.trim();
    if (form.updatedNarrative.trim())  learningData.updatedNarrative  = form.updatedNarrative.trim();
    if (form.playbookUpdate.trim())    learningData.playbookUpdate    = form.playbookUpdate.trim();
    setFlow("Learning", learningData);

    const growthData: Record<string, unknown> = {};
    if (form.bestPractice.trim()) growthData.bestPractice = form.bestPractice.trim();
    if (form.antiPattern.trim())  growthData.antiPattern  = form.antiPattern.trim();
    if (Object.keys(growthData).length > 0) setIntelligence("Growth", growthData);

    setSaved(true);
  };

  const handleSyncToNotion = () => {
    try {
      handleSave();
      appendDiff({ ...form, customerId: flowInput.customerId });  // 書き戻し先 Notion レコードの特定に使用
      setQueued(true);
    } catch (e) {
      console.error("Notion queue error:", e);
    }
  };

  const MAIN_FIELDS = [
    { key: "learning",          ja: "学び",           en: "Learning",           rows: 5, color: "var(--amber)" },
    { key: "updatedHypothesis", ja: "更新仮説",       en: "Updated Hypothesis", rows: 3, color: "var(--teal)"  },
    { key: "updatedNarrative",  ja: "更新ストーリー", en: "Updated Narrative",  rows: 4, color: "var(--purple)"},
    { key: "playbookUpdate",    ja: "プレイブック更新", en: "Playbook Update",  rows: 3, color: "var(--blue)"  },
  ] as const;

  const PATTERN_FIELDS = [
    { key: "bestPractice", ja: "Best Practice", en: "Best Practice", color: "var(--green)" },
    { key: "antiPattern",  ja: "Anti Pattern",  en: "Anti Pattern",  color: "var(--red)"   },
  ] as const;

  return (
    <div style={{ overflowY: "auto", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "28px 32px", maxWidth: 1100, flex: 1 }}>

        {/* Header */}
        <header style={{ marginBottom: 16, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.12em", color: "var(--amber)", textTransform: "uppercase", marginBottom: 6 }}>Learning</p>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontFamily: "var(--sans)", fontSize: 26, fontWeight: 400, color: "var(--text-primary)", marginBottom: 4 }}>
                {lang === "ja" ? "学習" : "Learning"}
              </h1>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {lang === "ja" ? "OS を更新し、次の因果ループへつなぐ" : "Update the OS and close the causal loop"}
              </p>
            </div>
            {saved && <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--green)" }}>✓ {lang === "ja" ? "保存済み" : "Saved"}</span>}
          </div>
        </header>

        {/* AI Generate Banner */}
        <div style={{ marginBottom: 20, padding: "14px 18px", background: "var(--bg2)", border: "1px solid rgba(230,180,50,0.25)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--amber)", marginBottom: 3 }}>
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
            style={{ padding: "9px 20px", background: generating ? "var(--bg3)" : "var(--amber)", border: "none", borderRadius: 6, color: generating ? "var(--text-tertiary)" : "var(--bg)", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 500, cursor: generating ? "not-allowed" : "pointer", letterSpacing: "0.04em", whiteSpace: "nowrap", minWidth: 130 }}>
            {generating ? (lang === "ja" ? "生成中…" : "Generating…") : (lang === "ja" ? "✦ AI で生成" : "✦ Generate with AI")}
          </button>
        </div>

        {/* Main learning fields */}
        {MAIN_FIELDS.map(({ key, ja, en, rows, color }) => (
          <section key={key} style={{ marginBottom: 16 }}>
            <label style={{ ...labelStyle, color }}>{lang === "ja" ? ja : en}</label>
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color, opacity: form[key] ? 1 : 0.2 }} />
              <textarea rows={rows} value={form[key]} onChange={set(key)}
                style={{ ...inputStyle, background: "transparent", border: "none", padding: 0, resize: "vertical", lineHeight: 1.7 }} />
            </div>
          </section>
        ))}

        {/* Patterns — Best Practice / Anti Pattern */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ ...labelStyle, marginBottom: 12 }}>{lang === "ja" ? "パターン" : "Patterns"}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {PATTERN_FIELDS.map(({ key, ja, en, color }) => (
              <div key={key} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color, opacity: form[key] ? 1 : 0.2 }} />
                <label style={{ ...labelStyle, color }}>{lang === "ja" ? ja : en}</label>
                <textarea rows={3} value={form[key]} onChange={set(key)}
                  style={{ ...inputStyle, background: "transparent", border: "none", padding: 0, resize: "vertical", lineHeight: 1.6 }} />
              </div>
            ))}
          </div>
        </section>

        <div style={{ paddingBottom: 80 }} />
      </div>

      {/* Sticky action bar */}
      <div style={{ position: "sticky", bottom: 0, background: "var(--bg)", borderTop: "1px solid var(--border)", padding: "12px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
        <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
          {queued
            ? (lang === "ja" ? "✓ Notion キューに追加済み" : "✓ Queued to Notion")
            : saved
              ? (lang === "ja" ? "✓ 保存済み" : "✓ Saved")
              : (lang === "ja" ? "A: 手動入力　B: AI生成　A+B: 生成後に編集" : "A: Manual　B: AI　A+B: Generate then edit")}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSave}
            style={{ padding: "8px 20px", background: "var(--amber)", border: "none", borderRadius: 6, color: "var(--bg)", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 500, cursor: "pointer", letterSpacing: "0.04em" }}>
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
