// src/ui/AuthProvider.tsx
// 認証プロバイダー — Supabase セッション変化を監視し、store に反映する
// 因果ループ: Supabase Auth → AuthStore → UI

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useAuthStore } from "@/store/auth";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clear } = useAuthStore();
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  useEffect(() => {
    // 初期セッション取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuth(session?.user ?? null, session);
    });

    // セッション変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuth(session.user, session);
      } else {
        clear();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
