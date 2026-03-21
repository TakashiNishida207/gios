// app/api/admin/intelligence/[code]/activate/route.ts
// POST: テナントに対してインテリジェンスを有効化 / 無効化する

import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { recordAuditLog }    from "@/admin/middleware/auditLog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { code: string } }) {
  try {
    const body = await req.json();
    if (!body.tenant_id) return NextResponse.json({ ok: false, error: "tenant_id は必須です。" }, { status: 400 });

    const status    = body.status === "inactive" ? "inactive" : "active";
    const supabase  = getSupabaseClient();
    const now       = new Date().toISOString();

    const { data: before } = await supabase
      .from("tenant_intelligence_activation")
      .select("*")
      .eq("tenant_id", body.tenant_id)
      .eq("intelligence_code", params.code)
      .single();

    const upsertData = {
      tenant_id:          body.tenant_id,
      intelligence_code:  params.code,
      status,
      config:             body.config ?? before?.config ?? {},
      activated_at:       status === "active" ? now : (before?.activated_at ?? null),
      deactivated_at:     status === "inactive" ? now : null,
    };

    const { data, error } = await supabase
      .from("tenant_intelligence_activation")
      .upsert(upsertData, { onConflict: "tenant_id,intelligence_code" })
      .select()
      .single();
    if (error) throw error;

    await recordAuditLog({
      tenant_id:         body.tenant_id,
      intelligence_code: params.code,
      entity_type:       "intelligence_activation",
      entity_id:         `${body.tenant_id}:${params.code}`,
      action:            before ? "update" : "create",
      before,
      after:             data,
    });

    return NextResponse.json({ ok: true, activation: data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
