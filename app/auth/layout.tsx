// app/auth/layout.tsx
// 認証ページ専用レイアウト — Topbar / Sidebar を持たない全画面レイアウト

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "var(--bg)",
    }}>
      {children}
    </div>
  );
}
