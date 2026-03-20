// src/sync/mappers/field_mapper.ts
// Field Mapper — Notion フィールド名 ↔ GIOS canonical 名の双方向変換
// 因果ループ: validators の後、intelligence_mapper の前に位置する

import { getCanonicalByNotionField, getNotionField } from "../../dictionary";
import { AutoMapper } from "./auto_mapper";

export class FieldMapper {
  private autoMapper = new AutoMapper();

  /**
   * Notion レコード（Notion フィールド名）→ GIOS レコード（canonical 名）
   * Input フェーズのフィールドのみを変換する。AutoMapper がフィルタリングを担う。
   */
  mapToGIOS(notionRecords: Record<string, unknown>[]): Record<string, unknown>[] {
    return notionRecords.map((record) => {
      // AutoMapper で Input フェーズのフィールドのみに絞る
      const filtered = this.autoMapper.filterForwardRecord(record);

      const giosRecord: Record<string, unknown> = {};
      for (const [notionField, value] of Object.entries(filtered)) {
        const canonical = getCanonicalByNotionField(notionField);
        if (canonical) {
          giosRecord[canonical] = value;
        }
      }
      return giosRecord;
    });
  }

  /**
   * GIOS レコード（canonical 名）→ Notion レコード（Notion フィールド名）
   * Insight / Action / Learning フェーズのフィールドのみを変換する。
   */
  mapToNotion(giosRecords: Record<string, unknown>[]): Record<string, unknown>[] {
    return giosRecords.map((record) => {
      // AutoMapper で逆同期対象のフィールドのみに絞る
      const filtered = this.autoMapper.filterBackwardRecord(record);

      const notionRecord: Record<string, unknown> = {};
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
