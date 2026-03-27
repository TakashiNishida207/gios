// middleware.ts
// GIOS 認証ミドルウェア — 未認証ユーザーを /auth/login にリダイレクト
// 因果ループ: Request → Session check → Allow | Redirect

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/auth/login", "/auth/callback"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 認証不要パスはそのまま通す
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Cookie から Supabase セッショントークンを取得
  const accessToken = req.cookies.get("sb-access-token")?.value
    ?? extractTokenFromCookies(req, "access_token");

  if (!accessToken) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    return NextResponse.redirect(loginUrl);
  }

  // トークンを検証
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { error } = await supabase.auth.getUser(accessToken);

  if (error) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Supabase v2 の cookie 名は動的 (sb-<ref>-auth-token) のためフォールバック
function extractTokenFromCookies(req: NextRequest, key: string): string | undefined {
  for (const [name, cookie] of req.cookies) {
    if (name.includes("auth-token")) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookie.value));
        if (parsed[key]) return parsed[key];
      } catch {}
    }
  }
  return undefined;
}

export const config = {
  matcher: [
    // _next/static, _next/image, favicon, api は除外
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
