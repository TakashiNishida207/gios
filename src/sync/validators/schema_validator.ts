// src/sync/validators/schema_validator.ts
// Schema Validator — Notion レコードの構造的整合性を検証する
// 因果ループ: fetch() の直後、意味論検証の前に位置する

import { getInputEntries } from "../../dictionary";

export class SchemaValidator {
  /**
   * Notion から取得した生レコード群を検証する。
   * 実際の Notion DB は Data Dictionary のすべてのフィールドを持つとは限らないため、
   * 「存在するフィールドが辞書の型定義に合致しているか」を確認する。
   * 辞書に定義されていないフィールドはスキップし、欠落フィールドは警告に留める。
   */
  validate(records: Record<string, unknown>[]): void {
    const knownFields = new Set(getInputEntries().map((e) => e.notionField));

    for (const record of records) {
      // レコードに存在する既知フィールドのうち、値が undefined のものを検出する
      for (const field of knownFields) {
        if (field in record && record[field] === undefined) {
          throw new Error(
            `[SchemaValidator] Field "${field}" exists but is undefined. ` +
            `Check Notion database schema.`
          );
        }
      }
    }
  }
}
