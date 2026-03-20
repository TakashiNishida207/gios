// src/ui/screens/ActionScreen.tsx
// Action Screen — 意思決定・次のアクション・実行タスクを明示する
// EN: Action | JP: アクション
// 因果ループ: Insight の洞察を受け取り、実行へと変換する唯一のフェーズ

"use client";

import { useGIOSStore } from "@/store";

type Props = { lang?: "en" | "ja" };

export default function ActionScreen({ lang = "ja" }: Props) {
  const action     = useGIOSStore((s) => s.flow.Action);
  const appendDiff = useGIOSStore((s) => s.appendDiff);

  const chosenOption    = action["chosenOption"]    as string   | undefined;
  const nextAction      = action["nextAction"]      as string   | undefined;
  const actionItems     = action["actionItems"]     as string[] | undefined;
  const owner           = action["owner"]           as string   | undefined;
  const dueDate         = action["dueDate"]         as string   | undefined;
  const meetingDecisions= action["meetingDecisions"] as string  | undefined;

  // Notion への逆同期キューに積む
  const handleSync = () => {
    if (Object.keys(action).length === 0) return;
    appendDiff({ ...action });
  };

  return (
    <div className="min-h-screen bg-white px-8 py-10">
      {/* ヘッダー */}
      <header className="mb-8 border-b border-gray-100 pb-6">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">Action</p>
        <h1 className="text-2xl font-semibold text-gray-900">
          {lang === "ja" ? "アクション" : "Action"}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {lang === "ja"
            ? "意思決定を実行へと変換する"
            : "Convert decisions into execution"}
        </p>
      </header>

      {/* 決定内容 */}
      <section className="mb-8">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">
          {lang === "ja" ? "決定内容" : "Chosen Option"}
        </p>
        <p className="text-base font-medium text-gray-900">
          {chosenOption ?? <span className="text-gray-300">—</span>}
        </p>
        {meetingDecisions && (
          <p className="mt-1 text-sm text-gray-500">{meetingDecisions}</p>
        )}
      </section>

      {/* 次のアクション */}
      <section className="mb-8">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">
          {lang === "ja" ? "次のアクション" : "Next Action"}
        </p>
        <p className="text-sm text-gray-900">
          {nextAction ?? <span className="text-gray-300">—</span>}
        </p>
      </section>

      {/* アクションアイテム */}
      <section className="mb-8">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-3">
          {lang === "ja" ? "アクションアイテム" : "Action Items"}
        </p>
        {actionItems && actionItems.length > 0 ? (
          <ul className="space-y-2">
            {actionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-900">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-300">—</p>
        )}
      </section>

      {/* Owner / Due Date */}
      <section className="grid grid-cols-2 gap-4 mb-8">
        <div className="border border-gray-100 rounded p-3">
          <p className="text-xs font-mono text-gray-400 mb-1">
            {lang === "ja" ? "Owner" : "Owner"}
          </p>
          <p className="text-sm text-gray-900">{owner ?? "—"}</p>
        </div>
        <div className="border border-gray-100 rounded p-3">
          <p className="text-xs font-mono text-gray-400 mb-1">
            {lang === "ja" ? "期限" : "Due Date"}
          </p>
          <p className="text-sm font-mono text-gray-900">{dueDate ?? "—"}</p>
        </div>
      </section>

      {/* Notion 逆同期 */}
      <section className="border-t border-gray-100 pt-6">
        <button
          onClick={handleSync}
          disabled={Object.keys(action).length === 0}
          className="px-5 py-2 text-sm border border-gray-200 rounded text-gray-700 hover:border-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {lang === "ja" ? "Notion に同期" : "Sync to Notion"}
        </button>
      </section>
    </div>
  );
}
