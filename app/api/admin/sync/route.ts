// app/api/admin/sync/route.ts
// GET: 同期レコード一覧 / POST: 失敗レコードのリトライ

import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { recordAuditLog }    from "@/admin/middleware/auditLog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status    = searchParams.get("status");
    const tenant_id = searchParams.get("tenant_id");
    const supabase  = getSupabaseClient();

    let query = supabase
      .from("sync_records")
      .select("*, tenants(name)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (status)    query = query.eq("status", status);
    if (tenant_id) query = query.eq("tenant_id", tenant_id);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ ok: true, records: data ?? [] });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

// POST: 失敗レコードを pending にリセット（リトライ）
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ ok: false, error: "id は必須です。" }, { status: 400 });

    const supabase = getSupabaseClient();
    const { data: before } = await supabase.from("sync_records").select("*").eq("id", body.id).single();
    const { data, error }  = await supabase
      .from("sync_records")
      .update({ status: "pending", error_message: null, updated_at: new Date().toISOString() })
      .eq("id", body.id)
      .select()
      .single();
    if (error) throw error;

    await recordAuditLog({
      tenant_id:   data.tenant_id,
      entity_type: "sync_record",
      entity_id:   body.id,
      action:      "update",
      before,
      after:       data,
    });
    return NextResponse.json({ ok: true, record: data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
