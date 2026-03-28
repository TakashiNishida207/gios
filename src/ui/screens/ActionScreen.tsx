// src/ui/screens/ActionScreen.tsx
// Action Screen — 意思決定・次のアクション・実行タスクを明示する
// EN: Action | JP: アクション
// 因果ループ: Insight の洞察を受け取り、実行へと変換する唯一のフェーズ

"use client";

import { useGIOSStore } from "@/store";
import { usePreferences } from "@/ui/preferences";


export default function ActionScreen() {
  const action     = useGIOSStore((s) => s.flow.Action);
  const appendDiff = useGIOSStore((s) => s.appendDiff);
  const { lang } = usePreferences();

  const chosenOption     = action["chosenOption"]     as string   | undefined;
  const nextAction       = action["nextAction"]       as string   | undefined;
  const actionItems      = action["actionItems"]      as string[] | undefined;
  const owner            = action["owner"]            as string   | undefined;
  const dueDate          = action["dueDate"]          as string   | undefined;
  const meetingDecisions = action["meetingDecisions"] as string   | undefined;

  // Notion への逆同期キューに積む
  const handleSync = () => {
    if (Object.keys(action).length === 0) return;
    appendDiff({ ...action });
  };

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
              color: "var(--accent)",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Action
          </p>
          <h1
            style={{
              fontFamily: "var(--sans)",
              fontSize: 26,
              fontWeight: 400,
              color: "var(--text-primary)",
              marginBottom: 4,
            }}
          >
            {lang === "ja" ? "アクション" : "Action"}
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {lang === "ja"
              ? "意思決定を実行へと変換する"
              : "Convert decisions into execution"}
          </p>
        </header>

        {/* Chosen option — prominent display */}
        <section style={{ marginBottom: 24 }}>
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
            {lang === "ja" ? "決定内容" : "Chosen Option"}
          </p>
          <div
            style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "16px 20px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* accent top bar */}
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
            {chosenOption ? (
              <p
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 18,
                  color: "var(--accent)",
                  lineHeight: 1.5,
                  marginBottom: meetingDecisions ? 8 : 0,
                }}
              >
                {chosenOption}
              </p>
            ) : (
              <p
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  color: "var(--text-tertiary)",
                }}
              >
                —
              </p>
            )}
            {meetingDecisions && (
              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {meetingDecisions}
              </p>
            )}
          </div>
        </section>

        {/* Next action */}
        <section style={{ marginBottom: 24 }}>
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
            {lang === "ja" ? "次のアクション" : "Next Action"}
          </p>
          <div
            style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "12px 16px",
            }}
          >
            <p style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.6 }}>
              {nextAction ?? <span style={{ color: "var(--text-tertiary)" }}>—</span>}
            </p>
          </div>
        </section>

        {/* Action items checklist */}
        <section style={{ marginBottom: 24 }}>
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
                      marginTop: 4,
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.5 }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                color: "var(--text-tertiary)",
              }}
            >
              —
            </p>
          )}
        </section>

        {/* Owner / Due Date — side by side cards */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "12px 16px",
            }}
          >
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
          <div
            style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "12px 16px",
            }}
          >
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
        </section>

        {/* Sync to Notion */}
        <section style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
          <button
            onClick={handleSync}
            disabled={Object.keys(action).length === 0}
            style={{
              padding: "8px 18px",
              background: Object.keys(action).length > 0 ? "var(--accent)" : "var(--bg3)",
              border: "none",
              borderRadius: 6,
              color: Object.keys(action).length > 0 ? "var(--bg)" : "var(--text-tertiary)",
              fontFamily: "var(--mono)",
              fontSize: 11,
              fontWeight: 500,
              cursor: Object.keys(action).length > 0 ? "pointer" : "not-allowed",
              opacity: Object.keys(action).length === 0 ? 0.35 : 1,
              letterSpacing: "0.04em",
              transition: "opacity 0.15s",
            }}
          >
            {lang === "ja" ? "Notion に同期" : "Sync to Notion"}
          </button>
        </section>
      </div>
    </div>
  );
}
