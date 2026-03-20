// src/ui/screens/PowerMeetingScreen.tsx
// PowerMeeting Screen — 会議の構造・決定・アクションを最大化する
// EN: Power Meeting | JP: パワーミーティング
// 因果ループ: Action フェーズの一部。会議を意思決定の場として構造化する。

"use client";

import { useGIOSStore } from "@/store";

type Props = { lang?: "en" | "ja" };

export default function PowerMeetingScreen({ lang = "ja" }: Props) {
  const pm     = useGIOSStore((s) => s.intelligence.PowerMeeting);
  const action = useGIOSStore((s) => s.flow.Action);

  const agenda          = pm["agenda"]           as string  | undefined;
  const participants    = pm["participants"]      as string[] | undefined;
  const meetingDecisions= action["meetingDecisions"] as string | undefined;
  const meetingNotes    = action["meetingNotes"]  as string  | undefined;
  const chosenOption    = action["chosenOption"]  as string  | undefined;
  const actionItems     = action["actionItems"]   as string[] | undefined;
  const owner           = action["owner"]         as string  | undefined;
  const dueDate         = action["dueDate"]       as string  | undefined;

  return (
    <div className="min-h-screen bg-white px-8 py-10">
      {/* ヘッダー */}
      <header className="mb-8 border-b border-gray-100 pb-6">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">
          Power Meeting
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">
          {lang === "ja" ? "パワーミーティング" : "Power Meeting"}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {lang === "ja"
            ? "会議を意思決定の場として最大化する"
            : "Maximize the meeting as a decision-making session"}
        </p>
      </header>

      {/* アジェンダ */}
      <section className="mb-8">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">
          {lang === "ja" ? "アジェンダ" : "Agenda"}
        </p>
        <p className="text-sm text-gray-900 leading-relaxed">
          {agenda ?? <span className="text-gray-300">—</span>}
        </p>
      </section>

      {/* 参加者 */}
      {participants && participants.length > 0 && (
        <section className="mb-8">
          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">
            {lang === "ja" ? "参加者" : "Participants"}
          </p>
          <div className="flex flex-wrap gap-2">
            {participants.map((p, i) => (
              <span key={i} className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-700">
                {p}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 決定事項 */}
      <section className="mb-8">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">
          {lang === "ja" ? "決定事項" : "Decisions"}
        </p>
        {chosenOption && (
          <p className="text-sm font-medium text-gray-900 mb-1">{chosenOption}</p>
        )}
        <p className="text-sm text-gray-600 leading-relaxed">
          {meetingDecisions ?? <span className="text-gray-300">—</span>}
        </p>
      </section>

      {/* アクションアイテム */}
      <section className="mb-8">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">
          {lang === "ja" ? "アクションアイテム" : "Action Items"}
        </p>
        {actionItems && actionItems.length > 0 ? (
          <ul className="space-y-2">
            {actionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-xs font-mono text-gray-300 mt-0.5">{i + 1}</span>
                <span className="text-sm text-gray-900">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-300">—</p>
        )}
      </section>

      {/* Owner / Due Date */}
      <section className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
        <div>
          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">
            {lang === "ja" ? "Owner" : "Owner"}
          </p>
          <p className="text-sm text-gray-900">{owner ?? <span className="text-gray-300">—</span>}</p>
        </div>
        <div>
          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">
            {lang === "ja" ? "期限" : "Due Date"}
          </p>
          <p className="text-sm font-mono text-gray-900">{dueDate ?? <span className="text-gray-300">—</span>}</p>
        </div>
      </section>

      {/* 議事録 */}
      {meetingNotes && (
        <section className="border-t border-gray-100 pt-6 mt-6">
          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">
            {lang === "ja" ? "議事録" : "Meeting Notes"}
          </p>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
            {meetingNotes}
          </p>
        </section>
      )}
    </div>
  );
}
