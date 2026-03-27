// src/store/auth.ts
// 認証状態管理 — Supabase session を Zustand で保持
// 因果ループ: Auth → Session → User → Permission → Intelligence

import { create } from "zustand";
import type { User, Session } from "@supabase/supabase-js";

type AuthState = {
  user:    User | null;
  session: Session | null;
  loading: boolean;
  setAuth: (user: User | null, session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user:    null,
  session: null,
  loading: true,
  setAuth:    (user, session) => set({ user, session, loading: false }),
  setLoading: (loading)       => set({ loading }),
  clear:      ()              => set({ user: null, session: null, loading: false }),
}));
