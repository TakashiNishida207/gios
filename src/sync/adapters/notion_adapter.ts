// src/sync/adapters/notion_adapter.ts
// Notion Adapter — Notion API との入出力を担う唯一のゲートウェイ
// 因果ループ: Sync Layer の最外縁。Notion の生データをここで正規化する。

import { Client, isFullPage } from "@notionhq/client";
import type {
  PageObjectResponse,
  UpdatePageParameters,
} from "@notionhq/client/build/src/api-endpoints";

type NotionProperties = NonNullable<UpdatePageParameters["properties"]>;

export class NotionAdapter {
  private client: Client;
  private databaseId: string;

  constructor(apiKey: string, databaseId: string) {
    this.client = new Client({ auth: apiKey });
    this.databaseId = databaseId;
  }

  /**
   * Notion データベースから全ページを取得し、
   * Notion フィールド名（JP）→ JS 値 のフラットなレコード配列に変換する。
   * ページ ID も `__notionPageId__` として保持し、逆同期時の書き戻し先として使う。
   */
  async fetch(): Promise<Record<string, unknown>[]> {
    const pages: PageObjectResponse[] = [];
    let cursor: string | undefined;

    // Notion API のページネーションを透過的に処理する
    do {
      const response = await this.client.databases.query({
        database_id: this.databaseId,
        ...(cursor ? { start_cursor: cursor } : {}),
      });
      pages.push(...response.results.filter(isFullPage));
      cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
    } while (cursor);

    return pages.map((page) => this.extractProperties(page));
  }

  /**
   * GIOS → Notion 逆同期: Notion ページのプロパティを更新する。
   * records に `__notionPageId__` が必要。Sync Layer 外からは呼び出さない。
   */
  async update(records: Record<string, unknown>[]): Promise<void> {
    for (const record of records) {
      const pageId = record["__notionPageId__"] as string | undefined;
      if (!pageId) continue;

      const properties = this.buildProperties(record);
      if (Object.keys(properties).length === 0) continue;

      await this.client.pages.update({ page_id: pageId, properties });
    }
  }

  // --- プライベート: Notion プロパティ値の正規化 ---

  private extractProperties(page: PageObjectResponse): Record<string, unknown> {
    const record: Record<string, unknown> = { __notionPageId__: page.id };

    for (const [field, prop] of Object.entries(page.properties)) {
      record[field] = this.extractValue(prop);
    }
    return record;
  }

  private extractValue(prop: PageObjectResponse["properties"][string]): unknown {
    switch (prop.type) {
      case "title":
        return prop.title[0]?.plain_text ?? null;
      case "rich_text":
        return prop.rich_text[0]?.plain_text ?? null;
      case "number":
        return prop.number;
      case "select":
        return prop.select?.name ?? null;
      case "multi_select":
        return prop.multi_select.map((o) => o.name);
      case "date":
        return prop.date?.start ?? null;
      case "email":
        return prop.email;
      case "checkbox":
        return prop.checkbox;
      case "people":
        return prop.people
          .map((p) => ("name" in p ? p.name : null))
          .filter(Boolean);
      default:
        return null;
    }
  }

  private buildProperties(record: Record<string, unknown>): NotionProperties {
    const properties: NotionProperties = {};

    for (const [field, value] of Object.entries(record)) {
      if (field === "__notionPageId__") continue;
      if (value === null || value === undefined) continue;

      // Insight / Action / Learning の値は rich_text として書き戻す
      properties[field] = {
        rich_text: [{ text: { content: String(value) } }],
      };
    }
    return properties;
  }
}
