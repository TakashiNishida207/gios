# GIOS — Growth Intelligence OS

> Business-first Growth Intelligence OS  
> Quiet × Clean × Executive Calm × Causal Loop Intelligence

---

## Quick Start（Claude Code での開発開始）

```bash
# 1. リポジトリのセットアップ
git init
git add .
git commit -m "feat: GIOS scaffold — Quiet × Clean × Causal Loop Intelligence"

# 2. 依存関係のインストール
npm install

# 3. 環境変数の設定
cp .env.example .env.local
# NOTION_API_KEY, NOTION_DATABASE_ID, SUPABASE_URL, SUPABASE_ANON_KEY を設定

# 4. 開発サーバー起動
npm run dev

# 5. テスト実行
npm test
```

---

## Claude Code への指示

Claude Code を起動したら、まず以下を読み込ませる。

```
Read CLAUDE.md first. This is the OS philosophy and must be followed.
Then read skills/data_dictionary.md, skills/sync_layer.md, skills/intelligence_flow.md.
Start implementing from src/sync/adapters/notion_adapter.ts.
```

---

## 実装の優先順序

### Phase 1 — Core OS（最初に実装）
1. `src/dictionary/index.ts` — Data Dictionary の読み込み
2. `src/sync/adapters/notion_adapter.ts` — Notion API 接続
3. `src/sync/validators/schema_validator.ts` — スキーマ検証
4. `src/sync/validators/semantics_validator.ts` — 意味論検証
5. `src/sync/mappers/auto_mapper.ts` — 自動マッピング
6. `src/sync/mappers/field_mapper.ts` — フィールド写像
7. `src/sync/mappers/intelligence_mapper.ts` — Intelligence 配布
8. `src/sync/adapters/gios_adapter.ts` — GIOS 内部更新
9. `src/sync/sync_engine.ts` — 同期エンジン統合

### Phase 2 — Intelligence Flow
10. `src/intelligence/flow_engine.ts` — Flow 分類・因果ルール
11. `src/intelligence/intelligence_router.ts` — Intelligence への配布
12. `src/intelligence/growth_intelligence.ts`
13. `src/intelligence/evidence_intelligence.ts`
14. `src/intelligence/story_intelligence.ts`
15. `src/intelligence/decision_intelligence.ts`
16. `src/intelligence/power_meeting_intelligence.ts`
17. `src/intelligence/intelligence_engine.ts` — 統合エンジン

### Phase 3 — UI（Next.js）
18. `src/ui/screens/Dashboard.tsx`
19. `src/ui/screens/InputScreen.tsx`
20. `src/ui/screens/InsightScreen.tsx`
21. `src/ui/screens/PowerMeetingScreen.tsx`
22. `src/ui/screens/ActionScreen.tsx`
23. `src/ui/screens/LearningScreen.tsx`

### Phase 4 — Tests
24. 全モジュールの Jest テスト
25. E2E テスト（完全循環）

---

## Architecture Overview

```
Notion ──────────────────────────────────────────────────────────┐
  ↓ (fetch)                                                       │
NotionAdapter → SchemaValidator → SemanticsValidator             │
  ↓                                                              │
FieldMapper (AutoMapper) → IntelligenceMapper                   │
  ↓                                                              │
GIOSAdapter → IntelligenceEngine → FlowEngine → Modules          │
  ↓                                                              │
GIOSStore (flow + intelligence + __diff__)                       │
  ↓                                                              │
UI (Next.js) ← Zustand ← Store                                  │
  ↓                                                              │
SyncEngine.syncGIOSToNotion() ───────────────────────────────────┘
```

---

## File Structure

```
gios/
├── CLAUDE.md                 ← OS の哲学（最優先で読む）
├── README.md
├── package.json
├── tsconfig.json
├── skills/                   ← Claude Code スキル定義
│   ├── data_dictionary.md    ← OS の憲法
│   ├── sync_layer.md
│   ├── intelligence_flow.md
│   └── ui_design.md
├── src/
│   ├── dictionary/           ← 変数意味論
│   ├── sync/                 ← Sync Layer
│   ├── intelligence/         ← Intelligence Flow
│   ├── store/                ← Internal DB
│   └── ui/                   ← Next.js screens
└── tests/                    ← Jest テスト
```

---

## Environment Variables

```bash
# .env.local
NOTION_API_KEY=secret_xxx
NOTION_DATABASE_ID=xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
ANTHROPIC_API_KEY=sk-ant-xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Design Principles

| Principle      | 意味                                      |
|----------------|-------------------------------------------|
| Quiet          | ノイズを排除し、必要最小限の情報のみ      |
| Clean          | 構造が明確で依存関係が透明                |
| Executive Calm | 意思決定者が迷わない静かな UI             |
| Causal         | 因果関係が一目で理解できる構造            |

---

Built with Claude Code × GIOS World View.
