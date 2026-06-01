// src/sync/sync_engine.ts
// Sync Engine — Notion ↔ GDIOS 双方向同期の中枢
// Input は Notion → GDIOS、Insight/Action/Learning は GDIOS → Notion

import { NotionAdapter }      from "./adapters/notion_adapter";
import { GDIOSAdapter }       from "./adapters/gios_adapter";
import { SchemaValidator }    from "./validators/schema_validator";
import { SemanticsValidator } from "./validators/semantics_validator";
import { FieldMapper }        from "./mappers/field_mapper";
import { IntelligenceMapper } from "./mappers/intelligence_mapper";

export class SyncEngine {
  constructor(
    private notionAdapter:      NotionAdapter,
    private gdiosAdapter:       GDIOSAdapter,
    private schemaValidator:    SchemaValidator,
    private semanticsValidator: SemanticsValidator,
    private fieldMapper:        FieldMapper,
    private intelligenceMapper: IntelligenceMapper,
  ) {}

  // Notion → GDIOS: Input フェーズのデータを同期
  async syncNotionToGDIOS() {
    const notionRecords = await this.notionAdapter.fetch();

    this.schemaValidator.validate(notionRecords);
    this.semanticsValidator.validate(notionRecords);

    // Notion ページ ID を保存して逆同期時の書き戻し先を追跡する
    const pageIds = notionRecords
      .map((r) => r["__notionPageId__"] as string | undefined)
      .filter((id): id is string => !!id);
    if (pageIds.length > 0) {
      this.gdiosAdapter.storePageIds(pageIds);
    }

    // customerId → pageId マップを構築して保存する
    // （逆同期時に「顧客Z」→ 顧客Z の pageId を正確に解決するため）
    const pageIdMap: Record<string, string> = {};
    for (const record of notionRecords) {
      const pageId     = record["__notionPageId__"] as string | undefined;
      const customerId = record["顧客ID"] as string | undefined;  // Notion タイトル列
      if (pageId && customerId) {
        pageIdMap[customerId] = pageId;
      }
    }
    if (Object.keys(pageIdMap).length > 0) {
      this.gdiosAdapter.storePageIdMap(pageIdMap);
    }

    const mapped      = this.fieldMapper.mapToGDIOS(notionRecords);
    const intelligence = this.intelligenceMapper.assign(mapped);

    await this.gdiosAdapter.update(intelligence);

    return intelligence;
  }

  // GDIOS → Notion: Insight/Action/Learning フェーズのデータを逆同期
  async syncGDIOSToNotion() {
    const diff = await this.gdiosAdapter.fetchDiff();
    if (!diff || diff.length === 0) return [];

    // customerId → pageId マップと配列を取得
    const pageIdMap = this.gdiosAdapter.getPageIdMap();
    const pageIds   = this.gdiosAdapter.getPageIds();

    // diff レコードの customerId でマップを引き、正確な書き戻し先を特定する
    const diffWithPageId = diff.map((record) => {
      const cid      = record["customerId"] as string | undefined;
      const resolved = (cid && pageIdMap[cid]) ? pageIdMap[cid] : pageIds[0];
      return {
        ...record,
        __notionPageId__: record["__notionPageId__"] ?? resolved,
      };
    });

    const mapped = this.fieldMapper.mapToNotion(diffWithPageId);
    await this.notionAdapter.update(mapped);

    return mapped;
  }

  // 完全循環同期
  async runFullSync() {
    const forward  = await this.syncNotionToGDIOS();
    const backward = await this.syncGDIOSToNotion();
    return { forward, backward };
  }
}
