// src/sync/validators/semantics_validator.ts
// Semantics Validator — 変数の型と意味論の整合性を検証する
// 因果ループ: schema_validator の直後、field_mapper の前に位置する

import { getCanonicalByNotionField, getEntry } from "../../dictionary";
import type { FieldType } from "../../dictionary/types";

export class SemanticsValidator {
  /**
   * Notion フィールド値が Data Dictionary の型定義に準拠しているかを検証する。
   * 意味論の違反はここで止め、Intelligence Flow に不正データを流さない。
   */
  validate(records: Record<string, unknown>[]): void {
    for (const record of records) {
      for (const [notionField, value] of Object.entries(record)) {
        // Data Dictionary に登録されていないフィールドはスキップ（Notion 固有メタ等）
        const canonical = getCanonicalByNotionField(notionField);
        if (!canonical) continue;

        const entry = getEntry(canonical);
        if (!entry) continue;

        this.assertType(canonical, value, entry.type);
      }
    }
  }

  private assertType(canonical: string, value: unknown, expected: FieldType): void {
    if (value === null || value === undefined) return; // null は許容（任意フィールド）

    const actual = Array.isArray(value) ? "string[]" : typeof value;

    const compatible =
      (expected === "string"   && actual === "string")   ||
      (expected === "number"   && actual === "number")   ||
      (expected === "boolean"  && actual === "boolean")  ||
      (expected === "string[]" && actual === "string[]") ||
      (expected === "date"     && actual === "string");   // date は ISO 文字列で受け取る

    if (!compatible) {
      throw new Error(
        `[SemanticsValidator] Type mismatch for "${canonical}": ` +
        `expected "${expected}", got "${actual}".`
      );
    }
  }
}
