// src/sync/mappers/field_mapper.ts
// Field Mapper — Notion フィールド名 ↔ GDIOS canonical 名の双方向変換
// 因果ループ: validators の後、intelligence_mapper の前に位置する

import { getCanonicalByNotionField, getNotionField, getEntry } from "../../dictionary";
import { AutoMapper } from "./auto_mapper";

export class FieldMapper {
  private autoMapper = new AutoMapper();

  /**
   * Notion レコード（Notion フィールド名）→ GDIOS レコード（canonical 名）
   * Input フェーズのフィールドのみを変換する。AutoMapper がフィルタリングを担う。
   */
  mapToGDIOS(notionRecords: Record<string, unknown>[]): Record<string, unknown>[] {
    return notionRecords.map((record) => {
      // AutoMapper で Input フェーズのフィールドのみに絞る
      const filtered = this.autoMapper.filterForwardRecord(record);

      const gdiosRecord: Record<string, unknown> = {};
      for (const [notionField, value] of Object.entries(filtered)) {
        const canonical = getCanonicalByNotionField(notionField);
        if (canonical) {
          const entry = getEntry(canonical);
          // string[] 型のフィールドが Notion から string で来た場合は改行で分割して配列化
          if (entry?.type === "string[]" && typeof value === "string") {
            gdiosRecord[canonical] = value.split("\n").map((s) => s.trim()).filter(Boolean);
          } else {
            gdiosRecord[canonical] = value;
          }
        }
      }
      return gdiosRecord;
    });
  }

  /**
   * GDIOS レコード（canonical 名）→ Notion レコード（Notion フィールド名）
   * Insight / Action / Learning フェーズのフィールドのみを変換する。
   */
  mapToNotion(gdiosRecords: Record<string, unknown>[]): Record<string, unknown>[] {
    return gdiosRecords.map((record) => {
      // AutoMapper で逆同期対象のフィールドのみに絞る
      const filtered = this.autoMapper.filterBackwardRecord(record);

      const notionRecord: Record<string, unknown> = {};

      // __notionPageId__ は Notion 書き戻し先の識別に必須 — 必ず引き継ぐ
      if (record["__notionPageId__"]) {
        notionRecord["__notionPageId__"] = record["__notionPageId__"];
      }

      for (const [canonical, value] of Object.entries(filtered)) {
        const notionField = getNotionField(canonical);
        if (notionField) {
          notionRecord[notionField] = value;
        }
      }
      return notionRecord;
    });
  }
}
