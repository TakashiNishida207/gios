// app/api/generate/route.ts
// AI生成エンドポイント — flow.Input をもとに Insight/Action/Learning のドラフトを生成する

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// --- プロンプト定義 ---

function buildPrompt(phase: string, input: Record<string, unknown>): string {
  const inputSummary = [
    input["customerName"]  && `顧客名: ${input["customerName"]}`,
    input["industry"]      && `業種: ${input["industry"]}`,
    input["contactPerson"] && `担当者: ${input["contactPerson"]}`,
    input["painPoint"]     && `課題・ペインポイント: ${input["painPoint"]}`,
    input["hypothesis"]    && `現在の仮説: ${input["hypothesis"]}`,
    input["valueMoment"]   && `バリューモーメント: ${input["valueMoment"]}`,
    input["context"]       && `文脈: ${input["context"]}`,
    input["agenda"]        && `アジェンダ: ${input["agenda"]}`,
    input["meetingGoal"]   && `会議の目的: ${input["meetingGoal"]}`,
  ].filter(Boolean).join("\n");

  if (phase === "Insight") {
    return `あなたはGTM（Go-To-Market）戦略の専門アドバイザーです。
以下の顧客情報をもとに、インサイトフェーズの各フィールドを日本語で生成してください。

## 顧客情報
${inputSummary}

## 出力形式（JSON）
以下のキーをすべて含むJSONオブジェクトを返してください。

{
  "narrative": "課題と価値の文脈を繋ぐストーリー（3〜5文）",
  "valueHypothesis": "〇〇によって〇〇が改善されるという価値仮説（1〜2文）",
  "decisionRationale": "この仮説・提案を選ぶ根拠（2〜3文）",
  "successMetric": "成功を測るKPI（1行）",
  "decisionOptions": "選択肢1\n選択肢2\n選択肢3",
  "gapLevel": 7.5,
  "priorityScore": 8.0,
  "painSeverity": 7.0,
  "opportunitySize": 8.5
}

スコアは0〜10の数値で、顧客情報から合理的に推定してください。
JSONのみ返し、説明文は不要です。`;
  }

  if (phase === "Action") {
    return `あなたはGTM（Go-To-Market）戦略の専門アドバイザーです。
以下の顧客情報をもとに、アクションフェーズの各フィールドを日本語で生成してください。

## 顧客情報
${inputSummary}

## 出力形式（JSON）
{
  "chosenOption": "採用した選択肢・意思決定内容（1〜2文）",
  "meetingDecisions": "会議で決まったこと（箇条書き可）",
  "nextAction": "次に取るべき最重要アクション（1〜2文）",
  "actionItems": "アクションアイテム1\nアクションアイテム2\nアクションアイテム3",
  "owner": "担当者名（顧客情報から推定、不明なら空文字）",
  "dueDate": ""
}

JSONのみ返し、説明文は不要です。`;
  }

  if (phase === "Learning") {
    return `あなたはGTM（Go-To-Market）戦略の専門アドバイザーです。
以下の顧客情報をもとに、学習フェーズの各フィールドを日本語で生成してください。
（まだアクションが完了していない段階での仮の学習・パターンとして記述してください）

## 顧客情報
${inputSummary}

## 出力形式（JSON）
{
  "learning": "この顧客ケースから得られる学び（3〜5文）",
  "updatedHypothesis": "更新後の仮説（1〜2文）",
  "updatedNarrative": "更新後のストーリー（2〜3文）",
  "playbookUpdate": "プレイブックに追加すべき知見（箇条書き可）",
  "bestPractice": "再現すべきベストプラクティス（1〜2文）",
  "antiPattern": "避けるべきアンチパターン（1〜2文）"
}

JSONのみ返し、説明文は不要です。`;
  }

  return "";
}

export async function POST(req: NextRequest) {
  try {
    const { phase, input } = (await req.json()) as {
      phase: string;
      input: Record<string, unknown>;
    };

    if (!["Insight", "Action", "Learning"].includes(phase)) {
      return NextResponse.json({ ok: false, error: "Invalid phase" }, { status: 400 });
    }

    const prompt = buildPrompt(phase, input);
    if (!prompt) {
      return NextResponse.json({ ok: false, error: "Prompt build failed" }, { status: 500 });
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // JSON部分を抽出（```json ... ``` ブロックに対応）
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] ?? jsonMatch[0] : text;

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(jsonStr.trim());
    } catch {
      return NextResponse.json({ ok: false, error: "JSON parse failed", raw: text }, { status: 500 });
    }

    return NextResponse.json({ ok: true, phase, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
