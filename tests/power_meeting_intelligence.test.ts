// tests/power_meeting_intelligence.test.ts
import { PowerMeetingIntelligence } from "../src/intelligence/power_meeting_intelligence";

const intel = new PowerMeetingIntelligence();

describe("PowerMeetingIntelligence", () => {
  it("name が 'PowerMeeting'", () => {
    expect(intel.name).toBe("PowerMeeting");
  });

  it("chosenOption から meetingDecisions を生成する", () => {
    const result = intel.process({ chosenOption: "プランA採用" });
    expect(result["meetingDecisions"]).toBe("プランA採用");
  });

  it("既存の meetingDecisions は上書きしない", () => {
    const result = intel.process({ chosenOption: "A", meetingDecisions: "既存決定" });
    expect(result["meetingDecisions"]).toBe("既存決定");
  });

  it("nextAction を actionItems に追加する", () => {
    const result = intel.process({ nextAction: "契約書送付" });
    expect(result["actionItems"]).toContain("契約書送付");
  });

  it("既存の actionItems に nextAction を追加する（重複なし）", () => {
    const result = intel.process({
      nextAction: "契約書送付",
      actionItems: ["資料共有", "契約書送付"],
    });
    const items = result["actionItems"] as string[];
    expect(items.filter((i) => i === "契約書送付")).toHaveLength(1);
  });

  it("agenda + participants から meetingNotes スケルトンを生成する", () => {
    const result = intel.process({
      agenda: "Q3 振り返り",
      participants: ["Alice", "Bob"],
    });
    const notes = result["meetingNotes"] as string;
    expect(notes).toContain("Q3 振り返り");
    expect(notes).toContain("Alice");
    expect(notes).toContain("Bob");
  });

  it("既存の meetingNotes は上書きしない", () => {
    const result = intel.process({
      agenda: "Q3",
      participants: ["Alice"],
      meetingNotes: "既存議事録",
    });
    expect(result["meetingNotes"]).toBe("既存議事録");
  });
});
