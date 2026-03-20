// src/ui/screens/PowerMeetingScreen.tsx
// PowerMeeting Screen — 会議の構造・決定・アクションを最大化する
// EN: Power Meeting | JP: パワーミーティング
// 因果ループ: Action フェーズの一部。会議を意思決定の場として構造化する。

"use client";

import { useGIOSStore } from "@/store";
import { usePreferences } from "@/ui/preferences";


// Deterministic color per participant index
const AVATAR_COLORS = [
  "var(--teal)",
  "var(--purple)",
  "var(--amber)",
  "var(--green)",
  "var(--red)",
  "var(--accent)",
];

export default function PowerMeetingScreen() {
  const pm     = useGIOSStore((s) => s.intelligence.PowerMeeting);
  const action = useGIOSStore((s) => s.flow.Action);
  const { lang } = usePreferences();

  const agenda           = pm["agenda"]            as string   | undefined;
  const participants     = pm["participants"]       as string[] | undefined;
  const meetingDecisions = action["meetingDecisions"] as string | undefined;
  const meetingNotes     = action["meetingNotes"]   as string   | undefined;
  const chosenOption     = action["chosenOption"]   as string   | undefined;
  const actionItems      = action["actionItems"]    as string[] | undefined;
  const owner            = action["owner"]          as string   | undefined;
  const dueDate          = action["dueDate"]        as string   | undefined;

  return (
    <div style={{ overflowY: "auto", height: "100%" }}>
      <div style={{ padding: "28px 32px", maxWidth: 1100 }}>

        {/* Header */}
        <header style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: "0.12em",
              color: "var(--green)",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Power Meeting
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
            {lang === "ja" ? "パワーミーティング" : "Power Meeting"}
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {lang === "ja"
              ? "会議を意思決定の場として最大化する"
              : "Maximize the meeting as a decision-making session"}
          </p>
        </header>

        {/* Two-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: 24,
          }}
        >
          {/* Left: meeting body */}
          <div>
            {/* Participants */}
            {participants && participants.length > 0 && (
              <section style={{ marginBottom: 20 }}>
                <p
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    color: "var(--text-tertiary)",
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  {lang === "ja" ? "参加者" : "Participants"}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {participants.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "var(--bg2)",
                        border: "1px solid var(--border)",
                        borderRadius: 20,
                        padding: "4px 10px 4px 6px",
                      }}
                    >
                      {/* Colored avatar */}
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "var(--mono)",
                          fontSize: 8,
                          color: "var(--bg)",
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        {p.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{p}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Agenda */}
            <section style={{ marginBottom: 20 }}>
              <p
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                {lang === "ja" ? "アジェンダ" : "Agenda"}
              </p>
              <div
                style={{
                  background: "var(--bg2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px 16px",
                }}
              >
                <p style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.7 }}>
                  {agenda ?? <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                </p>
              </div>
            </section>

            {/* Decisions with checkmark icons */}
            <section style={{ marginBottom: 20 }}>
              <p
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                {lang === "ja" ? "決定事項" : "Decisions"}
              </p>
              <div
                style={{
                  background: "var(--bg2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px 16px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: "var(--green)",
                    opacity: chosenOption ? 1 : 0.2,
                  }}
                />
                {chosenOption && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: meetingDecisions ? 8 : 0,
                    }}
                  >
                    {/* Checkmark icon */}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      style={{ flexShrink: 0 }}
                    >
                      <circle cx="7" cy="7" r="6" stroke="var(--green)" strokeWidth="1.2" />
                      <polyline
                        points="4,7 6,9 10,5"
                        stroke="var(--green)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--text-primary)",
                      }}
                    >
                      {chosenOption}
                    </p>
                  </div>
                )}
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  {meetingDecisions ?? (!chosenOption && <span style={{ color: "var(--text-tertiary)" }}>—</span>)}
                </p>
              </div>
            </section>

            {/* Action items */}
            <section style={{ marginBottom: 20 }}>
              <p
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                {lang === "ja" ? "アクションアイテム" : "Action Items"}
              </p>
              {actionItems && actionItems.length > 0 ? (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {actionItems.map((item, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        background: "var(--bg2)",
                        border: "1px solid var(--border)",
                        borderRadius: 7,
                        padding: "10px 14px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: 9,
                          color: "var(--text-tertiary)",
                          width: 16,
                          flexShrink: 0,
                          paddingTop: 2,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--text-primary)",
                          lineHeight: 1.5,
                        }}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
                  —
                </p>
              )}
            </section>

            {/* Meeting notes */}
            {meetingNotes && (
              <section style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
                <p
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    color: "var(--text-tertiary)",
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  {lang === "ja" ? "議事録" : "Meeting Notes"}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    lineHeight: 1.8,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {meetingNotes}
                </p>
              </section>
            )}
          </div>

          {/* Right: intelligence context panel */}
          <div>
            <div
              style={{
                position: "sticky",
                top: 0,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <p
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                {lang === "ja" ? "インテリジェンス" : "Intelligence"}
              </p>

              {/* Owner card */}
              <div
                style={{
                  background: "var(--bg2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: "var(--teal)",
                  }}
                />
                <p
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 9,
                    color: "var(--text-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 6,
                  }}
                >
                  {lang === "ja" ? "Owner" : "Owner"}
                </p>
                <p style={{ fontSize: 13, color: "var(--text-primary)" }}>
                  {owner ?? <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                </p>
              </div>

              {/* Due date card */}
              <div
                style={{
                  background: "var(--bg2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: "var(--amber)",
                  }}
                />
                <p
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 9,
                    color: "var(--text-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 6,
                  }}
                >
                  {lang === "ja" ? "期限" : "Due Date"}
                </p>
                <p
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 13,
                    color: "var(--text-primary)",
                  }}
                >
                  {dueDate ?? <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                </p>
              </div>

              {/* Participants count card */}
              <div
                style={{
                  background: "var(--bg2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: "var(--green)",
                  }}
                />
                <p
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 9,
                    color: "var(--text-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 6,
                  }}
                >
                  {lang === "ja" ? "参加者数" : "Participants"}
                </p>
                <p
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 22,
                    fontWeight: 300,
                    color: participants && participants.length > 0 ? "var(--green)" : "var(--text-tertiary)",
                  }}
                >
                  {participants ? participants.length : 0}
                </p>
              </div>

              {/* Action items count card */}
              <div
                style={{
                  background: "var(--bg2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: "var(--accent)",
                  }}
                />
                <p
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 9,
                    color: "var(--text-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 6,
                  }}
                >
                  {lang === "ja" ? "アクション数" : "Action Items"}
                </p>
                <p
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 22,
                    fontWeight: 300,
                    color: actionItems && actionItems.length > 0 ? "var(--accent)" : "var(--text-tertiary)",
                  }}
                >
                  {actionItems ? actionItems.length : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
