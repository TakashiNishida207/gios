// src/sync/mappers/auto_mapper.ts
// AutoMapper — Data Dictionary の flowPhase に基づく同期対象フィルタリング
// 因果ループ: field_mapper が内部的に参照する同期方向ルールの定義層

import { getInputEntries, getOutputEntries } from "../../dictionary";
import type { DictionaryEntry } from "../../dictionary/types";

export class AutoMapper {
  /**
   * Notion → GIOS 正同期の対象エントリ。
   * Input フェーズのみ。Processing 以降は GIOS 内部で生成されるため同期しない。
   */
  getForwardEntries(): DictionaryEntry[] {
    return getInputEntries();
  }

  /**
   * GIOS → Notion 逆同期の対象エントリ。
   * Insight / Action / Learning のみ。
   * Input と Processing は Notion 起点であるため逆同期しない。
   */
  getBackwardEntries(): DictionaryEntry[] {
    return getOutputEntries();
  }

  /**
   * 指定レコードから正同期対象（Input）のフィールドのみを抽出する。
   * Notion フィールド名でフィルタリングする。
   */
  filterForwardRecord(record: Record<string, unknown>): Record<string, unknown> {
    const allowed = new Set(this.getForwardEntries().map((e) => e.notionField));
    return Object.fromEntries(
      Object.entries(record).filter(([field]) => allowed.has(field))
    );
  }

  /**
   * 指定レコードから逆同期対象（Insight/Action/Learning）のフィールドのみを抽出する。
   * canonical 名でフィルタリングする。
   */
  filterBackwardRecord(record: Record<string, unknown>): Record<string, unknown> {
    const allowed = new Set(this.getBackwardEntries().map((e) => e.canonical));
    return Object.fromEntries(
      Object.entries(record).filter(([canonical]) => allowed.has(canonical))
    );
  }
}
