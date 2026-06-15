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
  : '- なし'}

### Decision（意思決定）
${decisionItems.length > 0
  ? decisionItems.map((d: {id: string; title: string}) => `- ID: ${d.id} | "${d.title}"`).join('\n')
  : '- なし'}

### Story（コミュニケーション）
${storyItems.length > 0
  ? storyItems.map((s: {id: string; title: string; audience: string}) => `- ID: ${s.id} | ${s.audience}向け | "${s.title}"`).join('\n')
  : '- なし'}

## 出力ルール（厳守）
- 必ず JSON 配列のみを返すこと。説明文・前置き・後書きは一切不要。
- Growth・Decision・Story それぞれ最低1件ずつ、合計3件以上を返すこと。
- 上記リストに ID がない場合は "generic-growth"/"generic-decision"/"generic-story" を使うこと。
- JSON は以下の形式のみ。コードブロック不要、配列だけ返す。

[
  {
    "targetDomain": "growth",
    "targetItemId": "<上記Growth IDまたはgeneric-growth>",
    "impactLevel": "high" | "medium" | "low",
    "impactDirection": "positive" | "negative" | "neutral",
    "reasoning": "なぜこの影響があるか（日本語・2〜3文）",
    "confidence": 0.0〜1.0の数値
  },
  {
    "targetDomain": "decision",
    "targetItemId": "<上記Decision IDまたはgeneric-decision>",
    "impactLevel": "high" | "medium" | "low",
    "impactDirection": "positive" | "negative" | "neutral",
    "reasoning": "意思決定にどう影響するか（日本語・2〜3文）",
    "confidence": 0.0〜1.0の数値
  },
  {
    "targetDomain": "story",
    "targetItemId": "<上記Story IDまたはgeneric-story>",
    "impactLevel": "high" | "medium" | "low",
    "impactDirection": "positive" | "negative" | "neutral",
    "reasoning": "コミュニケーションをどう変えるべきか（日本語・2〜3文）",
    "confidence": 0.0〜1.0の数値
  }
]`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";

    // JSON 抽出（複数パターンに対応）
    let jsonStr = "";
    // 1) ```json ... ``` ブロック
    const codeMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeMatch) {
      jsonStr = codeMatch[1].trim();
    } else {
      // 2) JSON 配列を直接探す（最も外側の [ ] を取得）
      const arrayMatch = raw.match(/\[[\s\S]*\]/);
      jsonStr = arrayMatch ? arrayMatch[0] : raw.trim();
    }

    let items: object[] = [];
    try {
      const parsed = JSON.parse(jsonStr);
      items = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // JSON parse 失敗時: エラーを返してクライアント側で再試行できるようにする
      console.error("[impact-analysis] JSON parse failed. raw:", raw.slice(0, 500));
      return NextResponse.json(
        { ok: false, error: `AI応答のJSON解析に失敗しました。再分析を試みてください。(raw: ${raw.slice(0, 100)})` },
        { status: 500 }
      );
    }

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
