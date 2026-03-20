// src/ui/screens/InputScreen.tsx
// Input Screen — 現実世界の事実（顧客・実験・会議）を入力する
// EN: Input | JP: インプット
// 因果ループ: このフェーズのデータが Notion → GIOS 正同期の起点となる

"use client";

import { useState } from "react";
import { useGIOSStore } from "@/store";
import { usePreferences } from "@/ui/preferences";


// Section definitions — Data Dictionary Input phase variables
const SECTIONS = [
  {
    number: 1,
    en: "Customer",
    ja: "顧客",
    fields: [
      { canonical: "customerName",  en: "Customer Name",  ja: "顧客名",  type: "text"  },
      { canonical: "industry",      en: "Industry",       ja: "業種",    type: "text"  },
      { canonical: "companySize",   en: "Company Size",   ja: "規模",    type: "text"  },
      { canonical: "contactPerson", en: "Contact Person", ja: "担当者",  type: "text"  },
      { canonical: "contactEmail",  en: "Contact Email",  ja: "メール",  type: "email" },
    ],
  },
  {
    number: 2,
    en: "Value Moment",
    ja: "Value Moment",
    fields: [
      { canonical: "valueMomentName", en: "Value Moment",  ja: "Value Moment", type: "text"     },
      { canonical: "painPoint",       en: "Pain Point",    ja: "課題",         type: "textarea" },
      { canonical: "context",         en: "Context",       ja: "文脈",         type: "textarea" },
    ],
  },
  {
    number: 3,
    en: "Experiment",
    ja: "実験",
    fields: [
      { canonical: "hypothesis",        en: "Hypothesis",        ja: "仮説",     type: "textarea" },
      { canonical: "experimentMethod",  en: "Experiment Method", ja: "実験方法", type: "text"     },
    ],
  },
  {
    number: 4,
    en: "Meeting",
    ja: "会議",
    fields: [
      { canonical: "agenda", en: "Meeting Agenda", ja: "アジェンダ", type: "textarea" },
    ],
  },
] as const;

// Flat field list for form state initialisation
const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields as readonly { canonical: string; en: string; ja: string; type: string }[]);

const inputStyle: React.CSSProperties = {
  background: "var(--bg3)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "8px 12px",
  color: "var(--text-primary)",
  fontFamily: "var(--sans)",
  fontSize: 12,
  width: "100%",
  outline: "none",
  transition: "border-color 0.15s",
};

export default function InputScreen() {
  const setFlow = useGIOSStore((s) => s.setFlow);
  const input   = useGIOSStore((s) => s.flow.Input);
  const { lang } = usePreferences();

  const [form, setForm] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(ALL_FIELDS.map((f) => [f.canonical, String(input[f.canonical] ?? "")]))
  );
  const [saved, setSaved]       = useState(false);
  const [focusedField, setFocus] = useState<string | null>(null);

  const handleChange = (canonical: string, value: string) => {
    setForm((prev) => ({ ...prev, [canonical]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    // 空文字を除いた変数のみを Store に書き込む
    const data = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v.trim() !== "")
    );
    setFlow("Input", data);
    setSaved(true);
  };

  // Preview: filled fields
  const filledEntries = Object.entries(form).filter(([, v]) => v.trim() !== "");

  return (
    <div style={{ overflowY: "auto", height: "100%" }}>
      <div
        style={{
          padding: "28px 32px",
          maxWidth: 1100,
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: 0,
          minHeight: "calc(100% - 56px)",
        }}
      >
        {/* Left: form area */}
        <div style={{ paddingRight: 28, borderRight: "1px solid var(--border)" }}>
          {/* Header */}
          <header style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
            <p
              style={{
                fontFamily: "var(--mono)",
                fontSize: 9,
                letterSpacing: "0.12em",
                color: "var(--teal)",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Input
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
              {lang === "ja" ? "インプット" : "Input"}
            </h1>
            <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {lang === "ja"
                ? "現実世界の事実を記録する"
                : "Record facts from the real world"}
            </p>
          </header>

          {/* Sections */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            {SECTIONS.map((section, si) => (
              <div
                key={section.number}
                style={{
                  marginBottom: 28,
                  paddingBottom: 28,
                  borderBottom: si < SECTIONS.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                {/* Section header with numbered circle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "var(--teal-dim)",
                      border: "1px solid rgba(110,181,160,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--mono)",
                      fontSize: 9,
                      color: "var(--teal)",
                      flexShrink: 0,
                    }}
                  >
                    {section.number}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      color: "var(--teal)",
                      textTransform: "uppercase",
                    }}
                  >
                    {lang === "ja" ? section.ja : section.en}
                  </span>
                </div>

                {/* Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {section.fields.map(({ canonical, en, ja, type }) => (
                    <div key={canonical}>
                      <label
                        style={{
                          display: "block",
                          fontFamily: "var(--mono)",
                          fontSize: 9,
                          letterSpacing: "0.08em",
                          color: "var(--text-tertiary)",
                          textTransform: "uppercase",
                          marginBottom: 5,
                        }}
                      >
                        {lang === "ja" ? ja : en}
                      </label>
                      {type === "textarea" ? (
                        <textarea
                          value={form[canonical]}
                          onChange={(e) => handleChange(canonical, e.target.value)}
                          onFocus={() => setFocus(canonical)}
                          onBlur={() => setFocus(null)}
                          rows={3}
                          style={{
                            ...inputStyle,
                            resize: "none",
                            borderColor:
                              focusedField === canonical
                                ? "var(--teal)"
                                : "var(--border)",
                          }}
                        />
                      ) : (
                        <input
                          type={type}
                          value={form[canonical]}
                          onChange={(e) => handleChange(canonical, e.target.value)}
                          onFocus={() => setFocus(canonical)}
                          onBlur={() => setFocus(null)}
                          style={{
                            ...inputStyle,
                            borderColor:
                              focusedField === canonical
                                ? "var(--teal)"
                                : "var(--border)",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Save button */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 4 }}>
              <button
                type="submit"
                style={{
                  padding: "8px 18px",
                  background: "var(--teal)",
                  border: "none",
                  borderRadius: 6,
                  color: "var(--bg)",
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                }}
              >
                {lang === "ja" ? "保存" : "Save"}
              </button>
              {saved && (
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    color: "var(--teal)",
                  }}
                >
                  {lang === "ja" ? "保存しました" : "Saved"}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Right: preview panel */}
        <div style={{ paddingLeft: 24, paddingTop: 0 }}>
          <div
            style={{
              position: "sticky",
              top: 28,
            }}
          >
            <p
              style={{
                fontFamily: "var(--mono)",
                fontSize: 9,
                letterSpacing: "0.1em",
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                marginBottom: 14,
                paddingTop: 2,
              }}
            >
              {lang === "ja" ? "プレビュー" : "Preview"}
            </p>
            {filledEntries.length === 0 ? (
              <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
                {lang === "ja" ? "入力待ち" : "Awaiting input"}
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filledEntries.map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      background: "var(--bg2)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "8px 10px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 9,
                        color: "var(--text-tertiary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: 2,
                      }}
                    >
                      {k}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 10,
                        color: "var(--text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {v}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
