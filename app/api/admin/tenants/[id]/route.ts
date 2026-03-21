// app/api/admin/tenants/[id]/route.ts
// GET: テナント詳細 / PUT: 更新 / DELETE: 削除

import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { recordAuditLog }    from "@/admin/middleware/auditLog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("*, users(*), tenant_intelligence_activation(*)")
      .eq("id", params.id)
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, tenant: data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();

    const { data: before } = await supabase.from("tenants").select("*").eq("id", params.id).single();
    const { data, error } = await supabase
      .from("tenants")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();
    if (error) throw error;

    await recordAuditLog({ entity_type: "tenant", entity_id: params.id, action: "update", before, after: data });
    return NextResponse.json({ ok: true, tenant: data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseClient();
    const { data: before } = await supabase.from("tenants").select("*").eq("id", params.id).single();
    const { error } = await supabase.from("tenants").delete().eq("id", params.id);
    if (error) throw error;

    await recordAuditLog({ entity_type: "tenant", entity_id: params.id, action: "delete", before });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
