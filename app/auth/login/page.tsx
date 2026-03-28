// app/auth/login/page.tsx
// GIOS ログインページ — メール/パスワード認証
// Quiet × Clean × Executive Calm

"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const L = {
  title:       { en: "GIOS",                            ja: "GIOS"                             },
  subtitle:    { en: "Growth Intelligence OS",           ja: "Growth Intelligence OS"           },
  email:       { en: "Email",                            ja: "メールアドレス"                   },
  password:    { en: "Password",                         ja: "パスワード"                       },
  submit:      { en: "Sign in",                          ja: "サインイン"                       },
  submitting:  { en: "Signing in…",                      ja: "認証中…"                          },
  error_auth:  { en: "Email or password is incorrect.",  ja: "メールアドレスまたはパスワードが正しくありません。" },
  error_net:   { en: "Network error. Please retry.",     ja: "ネットワークエラーが発生しました。再度お試しください。" },
};

type Lang = "en" | "ja";

export default function LoginPage() {
  const router   = useRouter();
  const supabase = getSupabaseBrowser();

  const [lang, setLang]         = useState<Lang>("ja");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const t = (key: keyof typeof L) => L[key][lang];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(t("error_auth"));
      } else {
        // cookie がブラウザに書き込まれてから middleware が読めるよう、フルリロードで遷移する
        window.location.href = "/dashboard";
      }
    } catch {
      setError(t("error_net"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: 360 }}>
      {/* ロゴ */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{
          fontFamily: "var(--sans)",
          fontSize: 28,
          color: "var(--text-primary)",
          letterSpacing: "0.04em",
          marginBottom: 4,
        }}>
          {t("title")}
        </div>
        <div style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          color: "var(--text-tertiary)",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}>
          {t("subtitle")}
        </div>
      </div>

      {/* フォームカード */}
      <div style={{
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "32px 28px",
      }}>
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block",
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              marginBottom: 8,
            }}>
              {t("email")}
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bg3)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "10px 12px",
                color: "var(--text-primary)",
                fontFamily: "var(--sans)",
                fontSize: 13,
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-hover)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: "block",
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              marginBottom: 8,
            }}>
              {t("password")}
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bg3)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "10px 12px",
                color: "var(--text-primary)",
                fontFamily: "var(--sans)",
                fontSize: 13,
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-hover)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>

          {/* エラー */}
          {error && (
            <div style={{
              fontFamily: "var(--sans)",
              fontSize: 12,
              color: "var(--red)",
              marginBottom: 16,
              padding: "8px 12px",
              background: "var(--red-dim)",
              borderRadius: 4,
              border: "1px solid rgba(181,110,110,0.2)",
            }}>
              {error}
            </div>
          )}

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "11px 0",
              background: loading ? "var(--bg4)" : "var(--accent)",
              color: loading ? "var(--text-tertiary)" : "#0c0c0b",
              border: "none",
              borderRadius: 4,
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {loading ? t("submitting") : t("submit")}
          </button>
        </form>
      </div>

      {/* 言語トグル */}
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <button
          onClick={() => setLang(lang === "ja" ? "en" : "ja")}
          style={{
            background: "none",
            border: "none",
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "var(--text-tertiary)",
            letterSpacing: "0.1em",
            cursor: "pointer",
          }}
        >
          {lang === "ja" ? "EN" : "JP"}
        </button>
      </div>
    </div>
  );
}
