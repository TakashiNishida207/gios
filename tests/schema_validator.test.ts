// tests/schema_validator.test.ts
import { SchemaValidator } from "../src/sync/validators/schema_validator";

const validator = new SchemaValidator();

describe("SchemaValidator", () => {
  it("完全なレコードは例外を投げない", () => {
    const record = {
      "Company（会社名）": "ACME Corp",
      "Pain Points（ペインポイント）": "高コスト",
    };
    expect(() => validator.validate([record])).not.toThrow();
  });

  it("空レコード配列は例外を投げない", () => {
    expect(() => validator.validate([])).not.toThrow();
  });

  it("辞書に定義されていないフィールドのみのレコードは通過する", () => {
    expect(() => validator.validate([{ "未知フィールド": "value" }])).not.toThrow();
  });

  it("既知フィールドが undefined の場合は例外を投げる", () => {
    const record = { "Company（会社名）": undefined };
    expect(() => validator.validate([record])).toThrow("Company（会社名）");
  });

  it("既知フィールドが null は許容する（任意フィールド）", () => {
    const record = { "Company（会社名）": null };
    expect(() => validator.validate([record])).not.toThrow();
  });

  it("複数レコードを検証する", () => {
    const records = [
      { "Company（会社名）": "A社" },
      { "Company（会社名）": "B社" },
    ];
    expect(() => validator.validate(records)).not.toThrow();
  });
});
