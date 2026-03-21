// src/lib/supabase.ts
// Supabase server-side client — API routes からのみ使用する

import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL または SUPABASE_SERVICE_ROLE_KEY が未設定です。");
  }

  return createClient(url, key);
}
