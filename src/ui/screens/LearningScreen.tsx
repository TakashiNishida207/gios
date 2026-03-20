// src/ui/screens/LearningScreen.tsx
// Learning Screen — 学び・更新仮説・プレイブックを OS に蓄積する
// EN: Learning | JP: 学習
// 因果ループ: Feedback を受け取り、OS を更新して次の Input へとループを閉じる

"use client";

import { useGIOSStore } from "@/store";

type Props = { lang?: "en" | "ja" };

// Learning フェーズの変数定義
const LEARNING_FIELDS = [
  { canonical: "learning",           en: "Learning",             ja: "学び"             },
  { canonical: "updatedHypothesis",  en: "Updated Hypothesis",   ja: "更新仮説"         },
  { canonical: "updatedNarrative",   en: "Updated Narrative",    ja: "更新ストーリー"   },
  { canonical: "playbookUpdate",     en: "Playbook Update",      ja: "プレイブック更新" },
] as const;

const PATTERN_FIELDS = [
  { canonical: "bestPractice", en: "Best Practice", ja: "Best Practice" },
  { canonical: "antiPattern",  en: "Anti Pattern",  ja: "Anti Pattern"  },
] as const;

export default function LearningScreen({ lang = "ja" }: Props) {
  const learning  = useGIOSStore((s) => s.flow.Learning);
  const growth    = useGIOSStore((s) => s.intelligence.Growth);
  const appendDiff = useGIOSStore((s) => s.appendDiff);

  const handleSync = () => {
    if (Object.keys(learning).length === 0) return;
    appendDiff({ ...learning });
  };

  return (
    <div className="min-h-screen bg-white px-8 py-10">
      {/* ヘッダー */}
      <header className="mb-8 border-b border-gray-100 pb-6">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">Learning</p>
        <h1 className="text-2xl font-semibold text-gray-900">
          {lang === "ja" ? "学習" : "Learning"}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {lang === "ja"
            ? "OS を更新し、次の因果ループへつなぐ"
            : "Update the OS and close the causal loop"}
        </p>
      </header>

      {/* Learning フィールド */}
      <section className="mb-8 space-y-6">
        {LEARNING_FIELDS.map(({ canonical, en, ja }) => {
          const value = learning[canonical];
          return (
            <div key={canonical}>
              <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">
                {lang === "ja" ? ja : en}
              </p>
              <p className="text-sm text-gray-900 leading-relaxed">
                {value !== undefined && value !== null
                  ? String(value)
                  : <span className="text-gray-300">—</span>}
              </p>
            </div>
          );
        })}
      </section>

      {/* Best Practice / Anti Pattern */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-8">
        {PATTERN_FIELDS.map(({ canonical, en, ja }) => {
          const value = growth[canonical];
          return (
            <div key={canonical} className="border border-gray-100 rounded p-4">
              <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">
                {lang === "ja" ? ja : en}
              </p>
              <p className="text-sm text-gray-900 leading-relaxed">
                {value !== undefined && value !== null
                  ? String(value)
                  : <span className="text-gray-300">—</span>}
              </p>
            </div>
          );
        })}
      </section>

      {/* 因果ループクローズ — Notion へ同期して次サイクルへ */}
      <section className="border-t border-gray-100 pt-6 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {lang === "ja"
            ? "学習を Notion に同期すると次の因果ループが始まる"
            : "Syncing learning to Notion starts the next causal loop"}
        </p>
        <button
          onClick={handleSync}
          disabled={Object.keys(learning).length === 0}
          className="px-5 py-2 text-sm border border-gray-200 rounded text-gray-700 hover:border-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {lang === "ja" ? "Notion に同期" : "Sync to Notion"}
        </button>
      </section>
    </div>
  );
}
