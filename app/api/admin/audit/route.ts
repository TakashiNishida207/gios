// app/api/admin/audit/route.ts
// GET: 監査ログ一覧（フィルタ付き）

import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenant_id        = searchParams.get("tenant_id");
    const actor_user_id    = searchParams.get("actor_user_id");
    const intelligence_code = searchParams.get("intelligence_code");
    const action           = searchParams.get("action");
    const entity_type      = searchParams.get("entity_type");
    const limit            = parseInt(searchParams.get("limit") ?? "50", 10);

    const supabase = getSupabaseClient();
    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (tenant_id)         query = query.eq("tenant_id", tenant_id);
    if (actor_user_id)     query = query.eq("actor_user_id", actor_user_id);
    if (intelligence_code) query = query.eq("intelligence_code", intelligence_code);
    if (action)            query = query.eq("action", action);
    if (entity_type)       query = query.eq("entity_type", entity_type);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ ok: true, logs: data ?? [] });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
