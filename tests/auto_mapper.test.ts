// tests/auto_mapper.test.ts
import { AutoMapper } from "../src/sync/mappers/auto_mapper";

const mapper = new AutoMapper();

describe("AutoMapper", () => {
  describe("getForwardEntries", () => {
    it("Input フェーズのエントリのみを返す", () => {
      const entries = mapper.getForwardEntries();
      expect(entries.length).toBeGreaterThan(0);
      entries.forEach((e) => expect(e.flowPhase).toBe("Input"));
    });
  });

  describe("getBackwardEntries", () => {
    it("Insight / Action / Learning フェーズのみを返す", () => {
      const entries = mapper.getBackwardEntries();
      expect(entries.length).toBeGreaterThan(0);
      const allowed = new Set(["Insight", "Action", "Learning"]);
      entries.forEach((e) => expect(allowed.has(e.flowPhase)).toBe(true));
    });

    it("Input フェーズは含まない", () => {
      const entries = mapper.getBackwardEntries();
      entries.forEach((e) => expect(e.flowPhase).not.toBe("Input"));
    });
  });

  describe("filterForwardRecord", () => {
    it("Input フェーズの Notion フィールドのみを残す", () => {
      const record = {
        "Company（会社名）": "ACME",
        "ストーリー": "some narrative", // Insight フェーズ（旧フィールド名）
        "不明": "x",
      };
      const result = mapper.filterForwardRecord(record);
      expect(result["Company（会社名）"]).toBe("ACME");
      expect(result["ストーリー"]).toBeUndefined();
      expect(result["不明"]).toBeUndefined();
    });
  });

  describe("filterBackwardRecord", () => {
    it("Insight/Action/Learning の canonical 名のみを残す", () => {
      const record = { "narrative": "story", "customerName": "ACME", "learning": "lesson" };
      const result = mapper.filterBackwardRecord(record);
      expect(result["narrative"]).toBe("story");      // Insight
      expect(result["learning"]).toBe("lesson");      // Learning
      expect(result["customerName"]).toBeUndefined(); // Input → 除外
    });
  });
});
