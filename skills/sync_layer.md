# skills/sync_layer.md
# Sync Layer Skill — GIOS 専用

## 目的

Notion（データレイヤー）と GIOS（意思決定レイヤー）を結ぶ唯一の同期レイヤー。

## 原則

1. 意味論の優先（Data Dictionary 準拠）
2. Input → Notion→GIOS / Insight,Action,Learning → GIOS→Notion
3. Intelligence Flow の整合性を破壊しない
4. Sync Layer 外で同期処理を行わない
5. i18n（EN/JP）を保持する

## 処理フロー

### Notion → GIOS
```
fetch() → schemaValidator → semanticsValidator → fieldMapper → intelligenceMapper → giosAdapter.update()
```

### GIOS → Notion
```
giosAdapter.fetchDiff() → fieldMapper.mapToNotion() → notionAdapter.update()
```

## AutoMapper のルール

```ts
// Notion → GIOS: flowPhase === "Input" のみ同期
if (entry.flowPhase !== "Input") continue;

// GIOS → Notion: Insight/Action/Learning のみ同期
if (!["Insight","Action","Learning"].includes(entry.flowPhase)) continue;
```

## 禁止事項

- Data Dictionary にない変数を作る
- 意味論の異なるフィールドを同一扱いする
- Sync Layer 外で同期処理を行う
- i18n の欠落
- 暗黙的な依存関係の追加
