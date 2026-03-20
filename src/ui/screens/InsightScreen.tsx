// src/ui/screens/InsightScreen.tsx
// Insight Screen — 洞察・仮説・選択肢を意思決定者に提示する
// EN: Insight | JP: 洞察
// 因果ループ: Processing の結果を受け取り、Action の前に意味づけを与える

"use client";

import { useGIOSStore } from "@/store";

type Props = { lang?: "en" | "ja" };

// Insight フェーズの変数定義
const INSIGHT_FIELDS = [
  { canonical: "valueHypothesis",   en: "Value Hypothesis",   ja: "価値仮説"    },
  { canonical: "narrative",         en: "Narrative",          ja: "ストーリー"  },
  { canonical: "decisionRationale", en: "Decision Rationale", ja: "選択理由"    },
  { canonical: "successMetric",     en: "Success Metric",     ja: "KPI"         },
] as const;

const PROCESSING_FIELDS = [
  { canonical: "gapLevel",        en: "Gap Level",        ja: "Gap Level"       },
  { canonical: "priorityScore",   en: "Priority Score",   ja: "Priority"        },
  { canonical: "painSeverity",    en: "Pain Severity",    ja: "Pain Severity"   },
  { canonical: "opportunitySize", en: "Opportunity Size", ja: "Opportunity Size"},
] as const;

export default function InsightScreen({ lang = "ja" }: Props) {
  const insight    = useGIOSStore((s) => s.flow.Insight);
  const processing = useGIOSStore((s) => s.flow.Processing);
  const decision   = useGIOSStore((s) => s.intelligence.Decision);

  const decisionOptions = decision["decisionOptions"];
  const hasOptions = Array.isArray(decisionOptions) && decisionOptions.length > 0;

  return (
    <div className="min-h-screen bg-white px-8 py-10">
      {/* ヘッダー */}
      <header className="mb-8 border-b border-gray-100 pb-6">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">Insight</p>
        <h1 className="text-2xl font-semibold text-gray-900">
          {lang === "ja" ? "洞察" : "Insight"}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {lang === "ja"
            ? "意味づけ・仮説・意思決定の根拠"
            : "Meaning, hypotheses, and decision rationale"}
        </p>
      </header>

      {/* 数値スコアリング（Processing） */}
      <section className="mb-8">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-3">
          {lang === "ja" ? "スコアリング" : "Scoring"}
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {PROCESSING_FIELDS.map(({ canonical, en, ja }) => {
            const value = processing[canonical];
            return (
              <div key={canonical} className="border border-gray-100 rounded p-3">
                <p className="text-xs text-gray-400 mb-1">{lang === "ja" ? ja : en}</p>
                <p className="text-lg font-mono font-semibold text-gray-900">
                  {value !== undefined && value !== null ? String(value) : "—"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Insight フィールド */}
      <section className="mb-8 space-y-5">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">
          {lang === "ja" ? "洞察" : "Insights"}
        </p>
        {INSIGHT_FIELDS.map(({ canonical, en, ja }) => {
          const value = insight[canonical];
          return (
            <div key={canonical}>
              <p className="text-xs text-gray-400 mb-1">{lang === "ja" ? ja : en}</p>
              <p className="text-sm text-gray-900 leading-relaxed">
                {value !== undefined && value !== null ? String(value) : (
                  <span className="text-gray-300">—</span>
                )}
              </p>
            </div>
          );
        })}
      </section>

      {/* Decision Options */}
      {hasOptions && (
        <section className="border-t border-gray-100 pt-6">
          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-3">
            {lang === "ja" ? "選択肢" : "Decision Options"}
          </p>
          <ul className="space-y-2">
            {(decisionOptions as string[]).map((opt, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-xs font-mono text-gray-300 mt-0.5">{i + 1}</span>
                <span className="text-sm text-gray-900">{opt}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
