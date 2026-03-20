// tests/sync_engine.e2e.test.ts
// E2E: Notion ↔ GIOS 双方向同期の完全パイプラインを検証する

import { SyncEngine }          from "../src/sync/sync_engine";
import { NotionAdapter }       from "../src/sync/adapters/notion_adapter";
import { GIOSAdapter }         from "../src/sync/adapters/gios_adapter";
import { SchemaValidator }     from "../src/sync/validators/schema_validator";
import { SemanticsValidator }  from "../src/sync/validators/semantics_validator";
import { FieldMapper }         from "../src/sync/mappers/field_mapper";
import { IntelligenceMapper }  from "../src/sync/mappers/intelligence_mapper";
import { createInitialStore }  from "../src/store/store";
import { getInputEntries }     from "../src/dictionary";

// Notion Adapter をモック化
jest.mock("../src/sync/adapters/notion_adapter");
const MockNotionAdapter = NotionAdapter as jest.MockedClass<typeof NotionAdapter>;

// Input フェーズの全 Notion フィールドを含む最小有効レコード
function makeNotionRecord(): Record<string, unknown> {
  const record: Record<string, unknown> = { __notionPageId__: "page-001" };
  getInputEntries().forEach((e) => {
    record[e.notionField] = e.type === "number" ? 3 : e.type === "string[]" ? [] : "テスト値";
  });
  return record;
}

describe("SyncEngine E2E", () => {
  let engine: SyncEngine;
  let store: ReturnType<typeof createInitialStore>;
  let giosAdapter: GIOSAdapter;

  beforeEach(() => {
    store = createInitialStore();

    MockNotionAdapter.prototype.fetch = jest.fn().mockResolvedValue([makeNotionRecord()]);
    MockNotionAdapter.prototype.update = jest.fn().mockResolvedValue(undefined);

    const notionAdapter = new MockNotionAdapter("secret", "db-001");
    giosAdapter = new GIOSAdapter(store);

    engine = new SyncEngine(
      notionAdapter,
      giosAdapter,
      new SchemaValidator(),
      new SemanticsValidator(),
      new FieldMapper(),
      new IntelligenceMapper(),
    );
  });

  describe("syncNotionToGIOS (正同期)", () => {
    it("Notion から取得したデータが IntelligenceBundle として返る", async () => {
      const bundles = await engine.syncNotionToGIOS();
      expect(bundles).toHaveLength(1);
      expect(bundles[0]).toBeDefined();
    });

    it("customerName が Growth Intelligence に格納される", async () => {
      await engine.syncNotionToGIOS();
      expect(store.intelligence.Growth["customerName"]).toBe("テスト値");
    });
  });

  describe("syncGIOSToNotion (逆同期)", () => {
    it("diff が空の場合は空配列を返す", async () => {
      const result = await engine.syncGIOSToNotion();
      expect(result).toEqual([]);
    });

    it("diff があれば NotionAdapter.update が呼ばれる", async () => {
      store.__diff__ = [{ narrative: "ストーリー", __notionPageId__: "page-001" }];
      await engine.syncGIOSToNotion();
      expect(MockNotionAdapter.prototype.update).toHaveBeenCalled();
    });
  });

  describe("runFullSync (完全循環同期)", () => {
    it("forward と backward の両方を返す", async () => {
      const result = await engine.runFullSync();
      expect(result).toHaveProperty("forward");
      expect(result).toHaveProperty("backward");
    });

    it("forward には Notion からの Intelligence Bundle が含まれる", async () => {
      const result = await engine.runFullSync();
      expect(Array.isArray(result.forward)).toBe(true);
    });
  });
});
