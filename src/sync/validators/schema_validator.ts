// src/sync/validators/schema_validator.ts
// Schema Validator — Notion レコードの構造的整合性を検証する
// 因果ループ: fetch() の直後、意味論検証の前に位置する

import { getInputEntries } from "../../dictionary";

export class SchemaValidator {
  /**
   * Notion から取得した生レコード群が、Input フェーズの必須フィールドを
   * すべて持っているかを検証する。
   * 構造が壊れている場合は早期に例外を投げ、以降のパイプラインを守る。
   */
  validate(records: Record<string, unknown>[]): void {
    const required = getInputEntries().map((e) => e.notionField);

    for (const record of records) {
      for (const field of required) {
        if (!(field in record)) {
          throw new Error(
            `[SchemaValidator] Missing required Notion field: "${field}". ` +
            `Check Notion database schema.`
          );
        }
      }
    }
  }
}
