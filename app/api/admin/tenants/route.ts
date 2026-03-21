// app/api/admin/tenants/route.ts
// GET: テナント一覧 / POST: テナント作成

import { NextResponse } from "next/server";
import { getSupabaseClient }  from "@/lib/supabase";
import { recordAuditLog }     from "@/admin/middleware/auditLog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ ok: true, tenants: data ?? [] });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name) return NextResponse.json({ ok: false, error: "name は必須です。" }, { status: 400 });

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("tenants")
      .insert({ name: body.name, status: body.status ?? "trial", plan: body.plan ?? "starter" })
      .select()
      .single();
    if (error) throw error;

    await recordAuditLog({ entity_type: "tenant", entity_id: data.id, action: "create", after: data });
    return NextResponse.json({ ok: true, tenant: data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
