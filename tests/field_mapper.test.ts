// tests/field_mapper.test.ts
import { FieldMapper } from "../src/sync/mappers/field_mapper";

const mapper = new FieldMapper();

describe("FieldMapper", () => {
  describe("mapToGIOS", () => {
    it("Notion フィールド名を canonical 名に変換する", () => {
      const records = [{
        "Company（会社名）": "ACME Corp",
        "Pain Points（ペインポイント）": "高コスト",
      }];
      const result  = mapper.mapToGIOS(records);
      expect(result[0]["customerName"]).toBe("ACME Corp");
      expect(result[0]["painPoint"]).toBe("高コスト");
    });

    it("Insight フェーズのフィールドは含まない（Input のみ）", () => {
      const records = [{ "ストーリー": "some narrative", "Company（会社名）": "ACME" }];
      const result  = mapper.mapToGIOS(records);
      expect(result[0]["narrative"]).toBeUndefined();
      expect(result[0]["customerName"]).toBe("ACME");
    });

    it("Data Dictionary にない Notion フィールドは無視する", () => {
      const records = [{ "存在しないフィールド": "value", "Company（会社名）": "X" }];
      const result  = mapper.mapToGIOS(records);
      expect(result[0]["存在しないフィールド"]).toBeUndefined();
      expect(result[0]["customerName"]).toBe("X");
    });

    it("空のレコード配列は空配列を返す", () => {
      expect(mapper.mapToGIOS([])).toEqual([]);
    });
  });

  describe("mapToNotion", () => {
    it("canonical 名を Notion フィールド名に変換する", () => {
      const records = [{ "narrative": "成功事例のストーリー", "learning": "重要な学び" }];
      const result  = mapper.mapToNotion(records);
      expect(result[0]["ストーリー"]).toBe("成功事例のストーリー");
      expect(result[0]["学び"]).toBe("重要な学び");
    });

    it("Input フェーズの canonical は含まない（逆同期しない）", () => {
      const records = [{ "customerName": "ACME", "narrative": "story" }];
      const result  = mapper.mapToNotion(records);
      expect(result[0]["顧客名"]).toBeUndefined();
      expect(result[0]["ストーリー"]).toBe("story");
    });
  });
});
