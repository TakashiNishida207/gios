// tests/intelligence_mapper.test.ts
import { IntelligenceMapper } from "../src/sync/mappers/intelligence_mapper";

const mapper = new IntelligenceMapper();

describe("IntelligenceMapper", () => {
  it("painPoint を Growth と Evidence に配布する", () => {
    const result = mapper.assign([{ painPoint: "高コスト" }]);
    expect(result[0].Growth?.["painPoint"]).toBe("高コスト");
    expect(result[0].Evidence?.["painPoint"]).toBe("高コスト");
  });

  it("narrative は Story のみに配布される", () => {
    const result = mapper.assign([{ narrative: "顧客のストーリー" }]);
    expect(result[0].Story?.["narrative"]).toBe("顧客のストーリー");
    expect(result[0].Growth?.["narrative"]).toBeUndefined();
  });

  it("actionItems は PowerMeeting のみに配布される", () => {
    const result = mapper.assign([{ actionItems: ["タスク1", "タスク2"] }]);
    expect(result[0].PowerMeeting?.["actionItems"]).toEqual(["タスク1", "タスク2"]);
    expect(result[0].Decision?.["actionItems"]).toBeUndefined();
  });

  it("Data Dictionary にない canonical はスキップする", () => {
    const result = mapper.assign([{ unknownVar: "value" }]);
    // すべてのバケットが空
    const buckets = Object.values(result[0]);
    const total = buckets.reduce((sum, b) => sum + (b ? Object.keys(b).length : 0), 0);
    expect(total).toBe(0);
  });

  it("複数レコードを独立してマッピングする", () => {
    const result = mapper.assign([
      { customerName: "A社" },
      { customerName: "B社" },
    ]);
    expect(result[0].Growth?.["customerName"]).toBe("A社");
    expect(result[1].Growth?.["customerName"]).toBe("B社");
  });

  it("空配列は空配列を返す", () => {
    expect(mapper.assign([])).toEqual([]);
  });
});
