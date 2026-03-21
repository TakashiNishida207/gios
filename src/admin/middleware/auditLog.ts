// src/admin/middleware/auditLog.ts
// 監査ログミドルウェア — すべてのミューテーションを自動記録する
// 因果ループ: mutation → before/after capture → audit_logs INSERT

import { getSupabaseClient } from "@/lib/supabase";

export type AuditContext = {
  actor_user_id?:    string;
  tenant_id?:        string;
  intelligence_code?: string;
  feature_key?:      string;
  entity_type:       string;
  entity_id:         string;
  action:            "create" | "update" | "delete";
  before?:           unknown;
  after?:            unknown;
  correlation_id?:   string;
  causal_chain_id?:  string;
};

/**
 * ミューテーションを audit_logs テーブルに記録する
 * すべての POST / PUT / DELETE ハンドラから呼び出すこと
 */
export async function recordAuditLog(ctx: AuditContext): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.from("audit_logs").insert({
      tenant_id:         ctx.tenant_id        ?? null,
      actor_user_id:     ctx.actor_user_id    ?? null,
      intelligence_code: ctx.intelligence_code ?? null,
      feature_key:       ctx.feature_key       ?? null,
      action:            ctx.action,
      entity_type:       ctx.entity_type,
      entity_id:         ctx.entity_id,
      before:            ctx.before           ?? null,
      after:             ctx.after            ?? null,
      correlation_id:    ctx.correlation_id   ?? crypto.randomUUID(),
      causal_chain_id:   ctx.causal_chain_id  ?? null,
      sync_status:       "pending",
    });
  } catch {
    // 監査ログの失敗はサイレントに処理する（メイン処理を止めない）
    console.error("[auditLog] Failed to record audit log:", ctx.entity_type, ctx.action);
  }
}
