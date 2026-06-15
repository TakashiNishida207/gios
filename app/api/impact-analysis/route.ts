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

    const growthList = ghsItems.length > 0
      ? ghsItems.map((g: {id: string; title: string; category: string}) => `- ID: ${g.id} | ${g.category} | "${g.title}"`).join('\n')
      : '- なし';
    const decisionList = decisionItems.length > 0
      ? decisionItems.map((d: {id: string; title: string}) => `- ID: ${d.id} | "${d.title}"`).join('\n')
      : '- なし';
    const storyList = storyItems.length > 0
      ? storyItems.map((s: {id: string; title: string; audience: string}) => `- ID: ${s.id} | ${s.audience}向け | "${s.title}"`).join('\n')
      : '- なし';

    const prompt = `あなたはGTMインテリジェンス分析AIです。以下のVoiceが各要素に与える影響をJSON配列で返してください。

Voice: "${voiceText}"

Growth要素:
${growthList}

Decision要素:
${decisionList}

Story要素:
${storyList}

【必須ルール】
1. Growth・Decision・Storyそれぞれ1件以上、合計3件以上を出力する
2. IDがない場合は "generic-growth"/"generic-decision"/"generic-story" を使う
3. JSONのみ返す（説明文・コードブロック記号は一切不要）
4. impactLevelは "high" "medium" "low" のいずれか1つの文字列
5. impactDirectionは "positive" "negative" "neutral" のいずれか1つの文字列
6. confidenceは0.0〜1.0の数値

出力形式（この形式のみ、余計なテキスト不要）:
[{"targetDomain":"growth","targetItemId":"IDをここに","impactLevel":"high","impactDirection":"positive","reasoning":"日本語の説明文","confidence":0.8},{"targetDomain":"decision","targetItemId":"IDをここに","impactLevel":"medium","impactDirection":"positive","reasoning":"日本語の説明文","confidence":0.75},{"targetDomain":"story","targetItemId":"IDをここに","impactLevel":"high","impactDirection":"positive","reasoning":"日本語の説明文","confidence":0.85}]`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";

    // JSON 抽出（複数パターンに対応）
    let jsonStr = "";
    // 1) ```json ... ``` ブロック（モデルがコードブロックを返した場合）
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
