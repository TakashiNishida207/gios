// src/lib/supabase-browser.ts
// Supabase browser-side client — クライアントコンポーネントからのみ使用する

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// シングルトン — 複数インスタンス防止
let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowser() {
  if (!client) {
    client = createClient(url, key);
  }
  return client;
}
