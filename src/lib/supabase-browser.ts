// src/lib/supabase-browser.ts
// ブラウザ用 Supabase クライアント — @supabase/ssr でセッションを cookie に保存
// cookie ベースにすることで middleware がサーバーサイドでセッションを読める

import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowser() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}
