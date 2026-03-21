// app/api/admin/roles/[id]/route.ts
// GET: ロール詳細 / PUT: 更新 / DELETE: 削除

import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { recordAuditLog }    from "@/admin/middleware/auditLog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("roles")
      .select("*, role_permissions(permission_id, permissions(code, description)), user_roles(user_id, users(name, email))")
      .eq("id", params.id)
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, role: data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();

    const { data: before } = await supabase.from("roles").select("*").eq("id", params.id).single();

    // ロール本体の更新
    const { data, error } = await supabase
      .from("roles")
      .update({ name: body.name, description: body.description, scope: body.scope, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();
    if (error) throw error;

    // 権限の付け替え（permission_ids が提供された場合）
    if (Array.isArray(body.permission_ids)) {
      await supabase.from("role_permissions").delete().eq("role_id", params.id);
      if (body.permission_ids.length > 0) {
        await supabase.from("role_permissions").insert(
          body.permission_ids.map((pid: string) => ({ role_id: params.id, permission_id: pid }))
        );
      }
    }

    await recordAuditLog({ tenant_id: data.tenant_id, entity_type: "role", entity_id: params.id, action: "update", before, after: data });
    return NextResponse.json({ ok: true, role: data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseClient();
    const { data: before } = await supabase.from("roles").select("*").eq("id", params.id).single();
    const { error } = await supabase.from("roles").delete().eq("id", params.id);
    if (error) throw error;

    await recordAuditLog({ tenant_id: before?.tenant_id, entity_type: "role", entity_id: params.id, action: "delete", before });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
