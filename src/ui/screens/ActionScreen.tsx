// src/ui/screens/ActionScreen.tsx
// Action Screen — 意思決定・次のアクション・実行タスクを編集・保存・Notion同期する
"use client";

import { useState, useEffect, useRef } from "react";
import { useGDIOSStore } from "@/store";
import { usePreferences } from "@/ui/preferences";

type FormState = {
  chosenOption: string; meetingDecisions: string; nextAction: string;
  actionItems: string; owner: string; dueDate: string;
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

export default function ActionScreen() {
  const action     = useGDIOSStore((s) => s.flow.Action);
  const flowInput  = useGDIOSStore((s) => s.flow.Input);
  const setFlow    = useGDIOSStore((s) => s.setFlow);
  const appendDiff = useGDIOSStore((s) => s.appendDiff);
  const { lang }   = usePreferences();

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState("");
  const [queued, setQueued]         = useState(false);

  const [form, setFormState] = useState<FormState>({
    chosenOption:     String(action["chosenOption"]     ?? ""),
    meetingDecisions: String(action["meetingDecisions"] ?? ""),
    nextAction:       String(action["nextAction"]       ?? ""),
    actionItems:      Array.isArray(action["actionItems"])
      ? (action["actionItems"] as string[]).join("\n")
      : String(action["actionItems"] ?? ""),
    owner:   String(action["owner"]   ?? ""),
    dueDate: String(action["dueDate"] ?? ""),
  });
  const [saved, setSaved] = useState(false);

  const prevActionRef = useRef(action);
  useEffect(() => {
    if (action !== prevActionRef.current) {
      prevActionRef.current = action;
      setFormState({
        chosenOption:     String(action["chosenOption"]     ?? ""),
        meetingDecisions: String(action["meetingDecisions"] ?? ""),
        nextAction:       String(action["nextAction"]       ?? ""),
        actionItems:      Array.isArray(action["actionItems"])
          ? (action["actionItems"] as string[]).join("\n")
          : String(action["actionItems"] ?? ""),
        owner:   String(action["owner"]   ?? ""),
        dueDate: String(action["dueDate"] ?? ""),
      });
    }
  }, [action]);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        body: JSON.stringify({ phase: "Action", input: flowInput }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Generation failed");
      const d = json.data as Record<string, unknown>;
      setFormState((prev) => ({
        chosenOption:     d["chosenOption"]     != null ? String(d["chosenOption"])     : prev.chosenOption,
        meetingDecisions: d["meetingDecisions"] != null ? String(d["meetingDecisions"]) : prev.meetingDecisions,
        nextAction:       d["nextAction"]       != null ? String(d["nextAction"])       : prev.nextAction,
        actionItems:      d["actionItems"]      != null ? String(d["actionItems"])      : prev.actionItems,
        owner:            d["owner"]            != null ? String(d["owner"])            : prev.owner,
        dueDate:          d["dueDate"]          != null ? String(d["dueDate"])          : prev.dueDate,
      }));
      setSaved(false);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    const data: Record<string, unknown> = {};
    if (form.chosenOption.trim())     data.chosenOption     = form.chosenOption.trim();
    if (form.meetingDecisions.trim()) data.meetingDecisions = form.meetingDecisions.trim();
    if (form.nextAction.trim())       data.nextAction       = form.nextAction.trim();
    if (form.actionItems.trim())      data.actionItems      = form.actionItems.split("\n").filter(Boolean);
    if (form.owner.trim())            data.owner            = form.owner.trim();
    if (form.dueDate.trim())          data.dueDate          = form.dueDate.trim();
    setFlow("Action", data);
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

  return (
    <div style={{ overflowY: "auto", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "28px 32px", maxWidth: 1100, flex: 1 }}>

        {/* Header */}
        <header style={{ marginBottom: 16, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.12em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 6 }}>Action</p>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontFamily: "var(--sans)", fontSize: 26, fontWeight: 400, color: "var(--text-primary)", marginBottom: 4 }}>
                {lang === "ja" ? "アクション" : "Action"}
              </h1>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {lang === "ja" ? "意思決定を実行へと変換する" : "Convert decisions into execution"}
              </p>
            </div>
            {saved && <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--green)" }}>✓ {lang === "ja" ? "保存済み" : "Saved"}</span>}
          </div>
        </header>

        {/* AI Generate Banner */}
        <div style={{ marginBottom: 20, padding: "14px 18px", background: "var(--bg2)", border: "1px solid rgba(0,200,160,0.25)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", marginBottom: 3 }}>
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
            style={{ padding: "9px 20px", background: generating ? "var(--bg3)" : "var(--accent)", border: "none", borderRadius: 6, color: generating ? "var(--text-tertiary)" : "var(--bg)", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 500, cursor: generating ? "not-allowed" : "pointer", letterSpacing: "0.04em", whiteSpace: "nowrap", minWidth: 130 }}>
            {generating ? (lang === "ja" ? "生成中…" : "Generating…") : (lang === "ja" ? "✦ AI で生成" : "✦ Generate with AI")}
          </button>
        </div>

        {/* Chosen Option — prominent */}
        <section style={{ marginBottom: 20 }}>
          <label style={{ ...labelStyle, color: "var(--accent)" }}>
            {lang === "ja" ? "決定内容" : "Chosen Option"}
          </label>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "var(--accent)" }} />
            <textarea rows={2} value={form.chosenOption} onChange={set("chosenOption")}
              style={{ ...inputStyle, background: "transparent", border: "none", padding: 0, fontSize: 16, color: "var(--accent)", resize: "none" }} />
          </div>
        </section>

        {/* Two-column: Next Action + Meeting Decisions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <section>
            <label style={labelStyle}>{lang === "ja" ? "次のアクション" : "Next Action"}</label>
            <textarea rows={4} value={form.nextAction} onChange={set("nextAction")}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
          </section>
          <section>
            <label style={labelStyle}>{lang === "ja" ? "決定事項" : "Meeting Decisions"}</label>
            <textarea rows={4} value={form.meetingDecisions} onChange={set("meetingDecisions")}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
          </section>
        </div>

        {/* Action Items */}
        <section style={{ marginBottom: 20 }}>
          <label style={labelStyle}>{lang === "ja" ? "アクションアイテム（1行1項目）" : "Action Items (one per line)"}</label>
          <textarea rows={5} value={form.actionItems} onChange={set("actionItems")}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
        </section>

        {/* Owner + Due Date */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <section>
            <label style={labelStyle}>Owner</label>
            <input type="text" value={form.owner} onChange={set("owner")} style={inputStyle} />
          </section>
          <section>
            <label style={labelStyle}>{lang === "ja" ? "期限" : "Due Date"}</label>
            <input type="date" value={form.dueDate} onChange={set("dueDate")} style={inputStyle} />
          </section>
        </div>

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
            style={{ padding: "8px 20px", background: "var(--accent)", border: "none", borderRadius: 6, color: "var(--bg)", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 500, cursor: "pointer", letterSpacing: "0.04em" }}>
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
