// tests/gios_adapter.test.ts
import { GIOSAdapter } from "../src/sync/adapters/gios_adapter";
import { createInitialStore } from "../src/store/store";

function makeAdapter() {
  return new GIOSAdapter(createInitialStore());
}

describe("GIOSAdapter", () => {
  describe("update", () => {
    it("Intelligence バケットにデータを書き込む", async () => {
      const store   = createInitialStore();
      const adapter = new GIOSAdapter(store);

      await adapter.update([{ Growth: { painPoint: "高コスト", priorityScore: 9 } }]);

      expect(store.intelligence.Growth["painPoint"]).toBe("高コスト");
      expect(store.intelligence.Growth["priorityScore"]).toBe(9);
    });

    it("複数のバンドルをすべて書き込む", async () => {
      const store   = createInitialStore();
      const adapter = new GIOSAdapter(store);

      await adapter.update([
        { Growth: { painPoint: "課題A" }, Story: { narrative: "ストーリー" } },
      ]);

      expect(store.intelligence.Growth["painPoint"]).toBe("課題A");
      expect(store.intelligence.Story["narrative"]).toBe("ストーリー");
    });

    it("AIAgent など IntelligenceState にないキーはスキップする", async () => {
      const store   = createInitialStore();
      const adapter = new GIOSAdapter(store);

      // AIAgent は IntelligenceState にない → エラーにならずスキップ
      await expect(
        adapter.update([{ AIAgent: { something: "value" } } as any])
      ).resolves.not.toThrow();
    });
  });

  describe("fetchDiff", () => {
    it("__diff__ の内容を返す", async () => {
      const store   = createInitialStore();
      store.__diff__ = [{ narrative: "story", __notionPageId__: "p1" }];
      const adapter = new GIOSAdapter(store);

      const diff = await adapter.fetchDiff();
      expect(diff).toHaveLength(1);
      expect(diff[0]["narrative"]).toBe("story");
    });

    it("fetchDiff 後に __diff__ がクリアされる", async () => {
      const store   = createInitialStore();
      store.__diff__ = [{ learning: "重要な学び" }];
      const adapter = new GIOSAdapter(store);

      await adapter.fetchDiff();
      expect(store.__diff__).toHaveLength(0);
    });

    it("diff が空の場合は空配列を返す", async () => {
      const diff = await makeAdapter().fetchDiff();
      expect(diff).toEqual([]);
    });
  });

  describe("markDirty / writeToFlow", () => {
    it("markDirty が __diff__ にレコードを追加する", () => {
      const store   = createInitialStore();
      const adapter = new GIOSAdapter(store);
      adapter.markDirty({ narrative: "逆同期対象" });
      expect(store.__diff__).toHaveLength(1);
    });

    it("writeToFlow が指定フェーズに書き込む", () => {
      const store   = createInitialStore();
      const adapter = new GIOSAdapter(store);
      adapter.writeToFlow("Insight", { valueHypothesis: "価値仮説" });
      expect(store.flow.Insight["valueHypothesis"]).toBe("価値仮説");
    });
  });
});
