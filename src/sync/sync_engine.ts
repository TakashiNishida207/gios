// src/sync/sync_engine.ts
// Sync Engine — Notion ↔ GIOS 双方向同期の中枢
// Input は Notion → GIOS、Insight/Action/Learning は GIOS → Notion

import { NotionAdapter }      from "./adapters/notion_adapter";
import { GIOSAdapter }        from "./adapters/gios_adapter";
import { SchemaValidator }    from "./validators/schema_validator";
import { SemanticsValidator } from "./validators/semantics_validator";
import { FieldMapper }        from "./mappers/field_mapper";
import { IntelligenceMapper } from "./mappers/intelligence_mapper";

export class SyncEngine {
  constructor(
    private notionAdapter:      NotionAdapter,
    private giosAdapter:        GIOSAdapter,
    private schemaValidator:    SchemaValidator,
    private semanticsValidator: SemanticsValidator,
    private fieldMapper:        FieldMapper,
    private intelligenceMapper: IntelligenceMapper,
  ) {}

  // Notion → GIOS: Input フェーズのデータを同期
  async syncNotionToGIOS() {
    const notionRecords = await this.notionAdapter.fetch();

    this.schemaValidator.validate(notionRecords);
    this.semanticsValidator.validate(notionRecords);

    const mapped      = this.fieldMapper.mapToGIOS(notionRecords);
    const intelligence = this.intelligenceMapper.assign(mapped);

    await this.giosAdapter.update(intelligence);

    return intelligence;
  }

  // GIOS → Notion: Insight/Action/Learning フェーズのデータを逆同期
  async syncGIOSToNotion() {
    const diff = await this.giosAdapter.fetchDiff();
    if (!diff || diff.length === 0) return [];

    const mapped = this.fieldMapper.mapToNotion(diff);
    await this.notionAdapter.update(mapped);

    return mapped;
  }

  // 完全循環同期
  async runFullSync() {
    const forward  = await this.syncNotionToGIOS();
    const backward = await this.syncGIOSToNotion();
    return { forward, backward };
  }
}
