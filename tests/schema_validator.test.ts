// tests/schema_validator.test.ts
import { SchemaValidator } from "../src/sync/validators/schema_validator";
import { getInputEntries } from "../src/dictionary";

const validator = new SchemaValidator();

// Input フェーズの必須フィールド（Notion フィールド名）をすべて含む完全レコード
function fullRecord(): Record<string, unknown> {
  return Object.fromEntries(getInputEntries().map((e) => [e.notionField, "dummy"]));
}

describe("SchemaValidator", () => {
  it("全必須フィールドが揃っている場合は例外を投げない", () => {
    expect(() => validator.validate([fullRecord()])).not.toThrow();
  });

  it("空レコード配列は例外を投げない", () => {
    expect(() => validator.validate([])).not.toThrow();
  });

  it("必須フィールドが欠けている場合は例外を投げる", () => {
    const record = fullRecord();
    // 最初の Input フィールドを削除
    const firstField = getInputEntries()[0].notionField;
    delete record[firstField];

    expect(() => validator.validate([record])).toThrow(firstField);
  });

  it("余分なフィールドがあっても例外を投げない", () => {
    const record = { ...fullRecord(), "余分なフィールド": "extra" };
    expect(() => validator.validate([record])).not.toThrow();
  });

  it("複数レコードのうち1件が不正な場合は例外を投げる", () => {
    const valid   = fullRecord();
    const invalid = { "顧客名": "only this" }; // 他のフィールドが欠けている
    expect(() => validator.validate([valid, invalid])).toThrow();
  });
});
