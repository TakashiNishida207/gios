// app/api/admin/intelligence/route.ts
// GET: 全8インテリジェンスとテナント別有効化状況

import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const [intelRes, activationRes, tenantsRes] = await Promise.all([
      supabase.from("intelligences").select("*").order("code"),
      supabase.from("tenant_intelligence_activation").select("*"),
      supabase.from("tenants").select("id, name, status"),
    ]);
    if (intelRes.error)      throw intelRes.error;
    if (activationRes.error) throw activationRes.error;
    if (tenantsRes.error)    throw tenantsRes.error;

    return NextResponse.json({
      ok:           true,
      intelligences: intelRes.data ?? [],
      activations:   activationRes.data ?? [],
      tenants:       tenantsRes.data ?? [],
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
