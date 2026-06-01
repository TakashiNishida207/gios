// app/api/impact-analysis/route.ts
// Voice Impact Analysis — Voice 1件が Growth/Decision/Story に与える影響を AI で分析する

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      voiceId,
      voiceText,
      ghsItems    = [],   // [{id, title, category}]
      decisionItems = [], // [{id, title}]
      storyItems    = [], // [{id, title, audience}]
    } = body;

    if (!voiceId || !voiceText) {
      return NextResponse.json({ ok: false, error: "voiceId と voiceText は必須です" }, { status: 400 });
    }

    const prompt = `あなたは GTM（Go-to-Market）インテリジェンス分析AIです。
以下の「顧客・市場の声（Voice）」が、各インテリジェンス要素に与える影響を分析してください。

## 分析対象の Voice
"${voiceText}"

## 現在のインテリジェンス要素

### Growth（成長健全性スコア）
${ghsItems.length > 0
  ? ghsItems.map((g: {id: string; title: string; category: string}) => `- ID: ${g.id} | ${g.category} | "${g.title}"`).join('\n')
  : '- なし（汎用分析を実施）'}

### Decision（意思決定）
${decisionItems.length > 0
  ? decisionItems.map((d: {id: string; title: string}) => `- ID: ${d.id} | "${d.title}"`).join('\n')
  : '- なし（汎用分析を実施）'}

### Story（コミュニケーション）
${storyItems.length > 0
  ? storyItems.map((s: {id: string; title: string; audience: string}) => `- ID: ${s.id} | ${s.audience}向け | "${s.title}"`).join('\n')
  : '- なし（汎用分析を実施）'}

## 出力形式
以下の JSON 配列を出力してください（\`\`\`json ブロックで囲んでください）。
影響があると判断した要素のみを含めてください（影響なしは除外）。

\`\`\`json
[
  {
    "targetDomain": "growth" | "decision" | "story",
    "targetItemId": "<上記リストのID、または 'generic-growth'/'generic-decision'/'generic-story'>",
    "impactLevel": "high" | "medium" | "low",
    "impactDirection": "positive" | "negative" | "neutral",
    "reasoning": "なぜこの影響があるか（日本語・2〜3文）",
    "confidence": <0.0〜1.0>
  }
]
\`\`\`

分析のポイント：
- Voice テキストが示す顧客の感情・ニーズ・問題を読み取る
- それが Growth スコア（チャーン・リテンション・エクスパンション）にどう影響するか
- 意思決定の判断材料として有益か
- ストーリー（顧客/内部向けコミュニケーション）をどう変えるべきか`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";

    // JSON ブロック抽出
    const match = raw.match(/```json\s*([\s\S]*?)```/);
    const jsonStr = match ? match[1].trim() : raw.trim();
    const items: object[] = JSON.parse(jsonStr);

    // VoiceImpactIntelligence 形式に変換
    const now = new Date().toISOString();
    const result = items.map((item: Record<string, unknown>, i: number) => ({
      id:              `impact-${voiceId}-${Date.now()}-${i}`,
      voiceId,
      targetDomain:    item.targetDomain,
      targetItemId:    item.targetItemId,
      impactLevel:     item.impactLevel,
      impactDirection: item.impactDirection,
      reasoning:       item.reasoning,
      confidence:      item.confidence,
      generatedAt:     now,
      generatedBy:     "auto" as const,
    }));

    return NextResponse.json({ ok: true, items: result });
  } catch (e) {
    console.error("[impact-analysis]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
