// app/api/admin/roles/route.ts
// GET: ロール一覧（権限付き） / POST: ロール作成

import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { recordAuditLog }    from "@/admin/middleware/auditLog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const [rolesRes, permsRes] = await Promise.all([
      supabase.from("roles").select("*, role_permissions(permission_id, permissions(code, description))").order("scope").order("name"),
      supabase.from("permissions").select("*").order("code"),
    ]);
    if (rolesRes.error) throw rolesRes.error;
    if (permsRes.error) throw permsRes.error;
    return NextResponse.json({ ok: true, roles: rolesRes.data ?? [], permissions: permsRes.data ?? [] });
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
      .from("roles")
      .insert({ name: body.name, description: body.description ?? "", scope: body.scope ?? "tenant", tenant_id: body.tenant_id ?? null })
      .select()
      .single();
    if (error) throw error;

    await recordAuditLog({ tenant_id: data.tenant_id, entity_type: "role", entity_id: data.id, action: "create", after: data });
    return NextResponse.json({ ok: true, role: data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
