# CLAUDE.md — GIOS（Growth Intelligence OS）

## 1. Core Philosophy — Business-first Intelligence

GIOS は **Business-first Intelligence** を中核に置く。
すべての実装は以下を満たすこと。

- ビジネス構造・因果関係を最優先に設計する
- UI/UX・データ構造・API は「意思決定の質を最大化する」ために存在する
- 機能は「ビジネスの現実世界の動き」を正確に写像すること
- すべての変数・データは「意味論（Semantics）」を持ち、曖昧さを排除する

---

## 2. Aesthetic & Structural Principles — Quiet × Clean × Executive Calm

- **Quiet**: 余計なノイズを排除し、必要最小限の情報のみを提示
- **Clean**: 構造が明確で、依存関係が透明
- **Executive Calm**: 意思決定者が迷わない静かな UI と情報設計
- **Causal**: 因果関係が一目で理解できる構造

コードも同様に、**静かで、透明で、因果が読み取れる構造**でなければならない。

---

## 3. Intelligence Flow — 因果ループの原則

```
Input → Processing → Insight → Action → Feedback → Learning → (次のInput)
```

- すべての Intelligence はこのループを共有する
- 各 Intelligence は「独立したレイヤー」ではなく「因果ループの役割」
- 変数は必ず「どの因果ループのどの段階に属するか」を明示する
- **因果ループを破壊する実装を行ってはならない**

---

## 4. Data Dictionary — 意味論の厳格な遵守

`/skills/data_dictionary.md` が **OS の憲法** である。

- 変数名は Data Dictionary の意味論に完全準拠
- 新しい変数を勝手に作らない
- 既存変数の意味を変えない
- 変数は「ビジネスの現実世界の構造」を反映する
- 未定義概念が必要な場合：**提案 → 承認 → 追加** のプロセスを踏む

---

## 5. Sync Layer — Notion ↔ GIOS の双方向同期原則

- Notion のデータ構造を正確に写像する
- GIOS 側の変数は Data Dictionary に準拠
- 双方向同期は「意味論の整合性」を最優先
- 変換ロジックは透明で、追跡可能であること
- Sync Layer 外で同期処理を行ってはならない

---

## 6. i18n — EN/JP パリティの絶対遵守

- すべての UI テキストは EN/JP のペアで存在する
- 変数名は英語のみ
- 翻訳は直訳ではなく「意味論の一致」を優先

---

## 7. Directory Structure

```
gios/
├── CLAUDE.md                    # この世界観ファイル（最優先）
├── package.json
├── tsconfig.json
├── skills/                      # Claude Code スキル定義
│   ├── data_dictionary.md       # OS の憲法（変数意味論）
│   ├── sync_layer.md
│   ├── intelligence_flow.md
│   └── ui_design.md
├── src/
│   ├── dictionary/              # Data Dictionary（JSON）
│   │   ├── types.ts
│   │   ├── index.ts
│   │   └── data_dictionary.json
│   ├── sync/                    # Sync Layer
│   │   ├── sync_engine.ts
│   │   ├── adapters/
│   │   │   ├── notion_adapter.ts
│   │   │   └── gios_adapter.ts
│   │   ├── validators/
│   │   │   ├── schema_validator.ts
│   │   │   └── semantics_validator.ts
│   │   └── mappers/
│   │       ├── auto_mapper.ts
│   │       ├── field_mapper.ts
│   │       └── intelligence_mapper.ts
│   ├── intelligence/            # Intelligence Flow
│   │   ├── flow_engine.ts
│   │   ├── intelligence_router.ts
│   │   ├── intelligence_engine.ts
│   │   ├── growth_intelligence.ts
│   │   ├── evidence_intelligence.ts
│   │   ├── story_intelligence.ts
│   │   ├── decision_intelligence.ts
│   │   ├── power_meeting_intelligence.ts
│   │   └── types.ts
│   ├── store/                   # Internal DB
│   │   ├── store.ts
│   │   ├── updateFlow.ts
│   │   ├── updateIntelligence.ts
│   │   └── updateDiff.ts
│   └── ui/                      # UI screens (Next.js pages)
│       └── screens/
│           ├── Dashboard.tsx
│           ├── InputScreen.tsx
│           ├── InsightScreen.tsx
│           ├── PowerMeetingScreen.tsx
│           ├── ActionScreen.tsx
│           └── LearningScreen.tsx
└── tests/
    ├── schema_validator.test.ts
    ├── semantics_validator.test.ts
    ├── field_mapper.test.ts
    ├── auto_mapper.test.ts
    ├── intelligence_mapper.test.ts
    ├── notion_adapter.test.ts
    ├── gios_adapter.test.ts
    ├── flow_engine.test.ts
    ├── intelligence_router.test.ts
    ├── intelligence_engine.test.ts
    ├── growth_intelligence.test.ts
    ├── evidence_intelligence.test.ts
    ├── story_intelligence.test.ts
    ├── decision_intelligence.test.ts
    ├── power_meeting_intelligence.test.ts
    ├── sync_engine.e2e.test.ts
    └── full_cycle.e2e.test.ts
```

---

## 8. Implementation Rules

- OS の哲学・美学・因果ルールを最優先
- 依存関係を破壊しない
- 変数の意味論を変更しない
- 構造を複雑化しない
- 冗長なコードを生成しない
- コメントは「因果の説明」を中心に書く
- 自律的に ToDo を生成し、順序立てて実装する

---

## 9. Forbidden Actions

- 世界観・哲学に反する実装
- Data Dictionary にない変数の追加（承認なし）
- 意味論の変更
- i18n の欠落
- Intelligence Flow を破壊する構造
- Sync Layer の整合性を壊す変更
- UI のノイズ増加
- 冗長なロジック
- 暗黙的な依存関係の追加
- Sync Layer 外での同期処理

---

## 10. Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript（strict mode）
- **Styling**: Tailwind CSS
- **State**: Zustand
- **DB**: Supabase / PostgreSQL
- **Sync**: Notion API
- **AI**: Claude API（claude-sonnet-4-5）
- **Testing**: Jest + Testing Library
- **Deploy**: Vercel

---

## 11. Output Quality

すべてのアウトプットは以下を満たす。

- 静かで、透明で、因果が読める
- ビジネスの現実世界を正確に写像
- 意思決定者が迷わない構造
- 未来のスケールを阻害しない
- OS としての秩序を保つ
