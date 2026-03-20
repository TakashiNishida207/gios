// tests/semantics_validator.test.ts
import { SemanticsValidator } from "../src/sync/validators/semantics_validator";

const validator = new SemanticsValidator();

describe("SemanticsValidator", () => {
  it("string 型フィールドが文字列なら通過する", () => {
    expect(() =>
      validator.validate([{ "顧客名": "ACME Corp" }])
    ).not.toThrow();
  });

  it("number 型フィールドが数値なら通過する", () => {
    expect(() =>
      validator.validate([{ "Gap Level": 3 }])
    ).not.toThrow();
  });

  it("string[] 型フィールドが配列なら通過する", () => {
    expect(() =>
      validator.validate([{ "参加者": ["Alice", "Bob"] }])
    ).not.toThrow();
  });

  it("date 型フィールドが文字列（ISO）なら通過する", () => {
    expect(() =>
      validator.validate([{ "期限": "2025-01-01" }])
    ).not.toThrow();
  });

  it("null 値は型チェックをスキップする", () => {
    expect(() =>
      validator.validate([{ "顧客名": null }])
    ).not.toThrow();
  });

  it("number 型フィールドに文字列が来た場合は例外を投げる", () => {
    expect(() =>
      validator.validate([{ "Gap Level": "high" }])
    ).toThrow("gapLevel"); // エラーは canonical 名で報告される
  });

  it("string 型フィールドに数値が来た場合は例外を投げる", () => {
    expect(() =>
      validator.validate([{ "Company（会社名）": 123 }])
    ).toThrow("customerName");
  });

  it("Data Dictionary にないフィールドはスキップする", () => {
    expect(() =>
      validator.validate([{ "不明なフィールド": 9999 }])
    ).not.toThrow();
  });
});
