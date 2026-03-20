// src/sync/mappers/intelligence_mapper.ts
// Intelligence Mapper — GIOS データを担当 Intelligence に配布する
// 因果ループ: field_mapper の後、giosAdapter.update() の前に位置する

import { getEntry } from "../../dictionary";
import type { IntelligenceType } from "../../dictionary/types";

export type IntelligenceBundle = {
  [K in IntelligenceType]?: Record<string, unknown>;
};

export class IntelligenceMapper {
  /**
   * canonical 名でマッピングされた GIOS レコード群を、
   * Data Dictionary の intelligence 定義に従い各 Intelligence Module に配布する。
   * 1 つの変数が複数の Intelligence に属す場合は、すべてのバケットに複製される。
   */
  assign(giosRecords: Record<string, unknown>[]): IntelligenceBundle[] {
    return giosRecords.map((record) => {
      const bundle: IntelligenceBundle = {};

      for (const [canonical, value] of Object.entries(record)) {
        const entry = getEntry(canonical);
        if (!entry) continue; // Data Dictionary にない変数は無視

        for (const intel of entry.intelligence) {
          if (!bundle[intel]) bundle[intel] = {};
          bundle[intel]![canonical] = value;
        }
      }

      return bundle;
    });
  }
}
