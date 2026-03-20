// tests/notion_adapter.test.ts
import { NotionAdapter } from "../src/sync/adapters/notion_adapter";

// @notionhq/client をモック化する
jest.mock("@notionhq/client", () => ({
  Client: jest.fn().mockImplementation(() => ({
    databases: {
      query: jest.fn().mockResolvedValue({
        results: [
          {
            id: "page-001",
            object: "page",
            parent: { type: "database_id", database_id: "db-001" },
            created_time: "2024-01-01T00:00:00.000Z",
            last_edited_time: "2024-01-01T00:00:00.000Z",
            archived: false,
            icon: null,
            cover: null,
            url: "https://notion.so/page-001",
            public_url: null,
            created_by: { object: "user", id: "u1" },
            last_edited_by: { object: "user", id: "u1" },
            properties: {
              "顧客名": {
                type: "title",
                title: [{ plain_text: "ACME Corp", annotations: {}, href: null, type: "text", text: { content: "ACME Corp", link: null } }],
              },
              "業種": {
                type: "rich_text",
                rich_text: [{ plain_text: "SaaS", annotations: {}, href: null, type: "text", text: { content: "SaaS", link: null } }],
              },
              "Gap Level": { type: "number", number: 3 },
              "参加者": {
                type: "multi_select",
                multi_select: [{ id: "s1", name: "Alice", color: "blue" }, { id: "s2", name: "Bob", color: "gray" }],
              },
            },
          },
        ],
        has_more: false,
        next_cursor: null,
        type: "page_or_database",
        page_or_database: {},
        object: "list",
      }),
    },
    pages: {
      update: jest.fn().mockResolvedValue({ id: "page-001" }),
    },
  })),
  isFullPage: jest.fn((p) => p.object === "page"),
}));

const adapter = new NotionAdapter("secret_test", "db-001");

describe("NotionAdapter", () => {
  describe("fetch", () => {
    it("Notion ページを取得してフラットなレコードに変換する", async () => {
      const records = await adapter.fetch();
      expect(records).toHaveLength(1);
      expect(records[0]["顧客名"]).toBe("ACME Corp");
      expect(records[0]["業種"]).toBe("SaaS");
      expect(records[0]["Gap Level"]).toBe(3);
      expect(records[0]["参加者"]).toEqual(["Alice", "Bob"]);
    });

    it("__notionPageId__ がレコードに含まれる", async () => {
      const records = await adapter.fetch();
      expect(records[0]["__notionPageId__"]).toBe("page-001");
    });
  });

  describe("update", () => {
    it("__notionPageId__ がないレコードはスキップする", async () => {
      const { Client } = require("@notionhq/client");
      const mockUpdate = Client.mock.results[0].value.pages.update;
      mockUpdate.mockClear();

      await adapter.update([{ narrative: "story" }]); // no pageId
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("__notionPageId__ があるレコードは Notion に書き込む", async () => {
      const { Client } = require("@notionhq/client");
      const mockUpdate = Client.mock.results[0].value.pages.update;
      mockUpdate.mockClear();

      await adapter.update([{ __notionPageId__: "page-001", "ストーリー": "test" }]);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ page_id: "page-001" })
      );
    });
  });
});
