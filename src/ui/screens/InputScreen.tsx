// src/ui/screens/InputScreen.tsx
// Input Screen — 現実世界の事実（顧客・実験・会議）を入力する
// EN: Input | JP: インプット
// 因果ループ: このフェーズのデータが Notion → GIOS 正同期の起点となる

"use client";

import { useState } from "react";
import { useGIOSStore } from "@/store";

type Props = { lang?: "en" | "ja" };

// Data Dictionary の Input フェーズ変数に対応するフォームフィールド
const FIELDS = [
  { canonical: "customerName",    en: "Customer Name",    ja: "顧客名",     type: "text"  },
  { canonical: "industry",        en: "Industry",         ja: "業種",       type: "text"  },
  { canonical: "companySize",     en: "Company Size",     ja: "規模",       type: "text"  },
  { canonical: "contactPerson",   en: "Contact Person",   ja: "担当者",     type: "text"  },
  { canonical: "contactEmail",    en: "Contact Email",    ja: "メール",     type: "email" },
  { canonical: "valueMomentName", en: "Value Moment",     ja: "Value Moment", type: "text" },
  { canonical: "painPoint",       en: "Pain Point",       ja: "課題",       type: "textarea" },
  { canonical: "context",         en: "Context",          ja: "文脈",       type: "textarea" },
  { canonical: "hypothesis",      en: "Hypothesis",       ja: "仮説",       type: "textarea" },
  { canonical: "agenda",          en: "Meeting Agenda",   ja: "アジェンダ", type: "textarea" },
] as const;

export default function InputScreen({ lang = "ja" }: Props) {
  const setFlow = useGIOSStore((s) => s.setFlow);
  const input   = useGIOSStore((s) => s.flow.Input);

  const [form, setForm] = useState<Record<string, string>>(
    () => Object.fromEntries(FIELDS.map((f) => [f.canonical, String(input[f.canonical] ?? "")]))
  );
  const [saved, setSaved] = useState(false);

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

  return (
    <div className="min-h-screen bg-white px-8 py-10">
      {/* ヘッダー */}
      <header className="mb-8 border-b border-gray-100 pb-6">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">Input</p>
        <h1 className="text-2xl font-semibold text-gray-900">
          {lang === "ja" ? "インプット" : "Input"}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {lang === "ja"
            ? "現実世界の事実を記録する"
            : "Record facts from the real world"}
        </p>
      </header>

      {/* フォーム */}
      <form
        className="space-y-6 max-w-xl"
        onSubmit={(e) => { e.preventDefault(); handleSave(); }}
      >
        {FIELDS.map(({ canonical, en, ja, type }) => (
          <div key={canonical}>
            <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">
              {lang === "ja" ? ja : en}
            </label>
            {type === "textarea" ? (
              <textarea
                value={form[canonical]}
                onChange={(e) => handleChange(canonical, e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-400 resize-none"
              />
            ) : (
              <input
                type={type}
                value={form[canonical]}
                onChange={(e) => handleChange(canonical, e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-400"
              />
            )}
          </div>
        ))}

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            className="px-5 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors"
          >
            {lang === "ja" ? "保存" : "Save"}
          </button>
          {saved && (
            <span className="text-xs text-gray-400">
              {lang === "ja" ? "保存しました" : "Saved"}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
