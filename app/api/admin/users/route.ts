// app/api/admin/users/route.ts
// GET: ユーザー一覧 / POST: ユーザー作成

import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { recordAuditLog }    from "@/admin/middleware/auditLog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get("tenant_id");
    const supabase  = getSupabaseClient();

    let query = supabase.from("users").select("*, tenants(name)").order("created_at", { ascending: false });
    if (tenant_id) query = query.eq("tenant_id", tenant_id);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ ok: true, users: data ?? [] });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.email) return NextResponse.json({ ok: false, error: "email は必須です。" }, { status: 400 });

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .insert({ email: body.email, name: body.name ?? "", tenant_id: body.tenant_id ?? null,
                status: body.status ?? "active", is_super_admin: body.is_super_admin ?? false })
      .select()
      .single();
    if (error) throw error;

    await recordAuditLog({ tenant_id: data.tenant_id, entity_type: "user", entity_id: data.id, action: "create", after: data });
    return NextResponse.json({ ok: true, user: data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
