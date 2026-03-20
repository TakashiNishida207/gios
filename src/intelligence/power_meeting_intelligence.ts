// src/intelligence/power_meeting_intelligence.ts
// PowerMeeting Intelligence — 会議の構造・決定・アクションを最大化する
// 因果ループ担当変数: agenda, participants, actionItems, owner, dueDate,
//                     meetingDecisions, meetingNotes, chosenOption, nextAction

import type { IntelligenceModule } from "./types";

export class PowerMeetingIntelligence implements IntelligenceModule {
  readonly name = "PowerMeeting";

  /**
   * PowerMeeting 変数群を受け取り、会議の因果構造を強化して返す。
   * - agenda が存在し actionItems がない場合、アクション待ち状態を明示する
   * - chosenOption が存在すれば meetingDecisions に反映する（未設定の場合）
   * - nextAction が存在すれば actionItems に追加する（未設定の場合）
   */
  process(input: Record<string, unknown>): Record<string, unknown> {
    const output: Record<string, unknown> = { ...input };

    // chosenOption → meetingDecisions（未設定の場合）
    if (typeof input["chosenOption"] === "string" && !input["meetingDecisions"]) {
      output["meetingDecisions"] = input["chosenOption"];
    }

    // nextAction → actionItems（未設定の場合）
    if (typeof input["nextAction"] === "string") {
      const existing = Array.isArray(input["actionItems"]) ? input["actionItems"] : [];
      if (!existing.includes(input["nextAction"])) {
        output["actionItems"] = [...existing, input["nextAction"]];
      }
    }

    // agenda + participants が揃っていれば meetingNotes の骨格を生成する（未設定の場合）
    if (
      typeof input["agenda"] === "string" &&
      Array.isArray(input["participants"]) &&
      !input["meetingNotes"]
    ) {
      const who = (input["participants"] as string[]).join(", ");
      output["meetingNotes"] = `[議事録] 参加者: ${who} / アジェンダ: ${input["agenda"]}`;
    }

    return output;
  }
}
