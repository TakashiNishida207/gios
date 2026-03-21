// app/admin/layout.tsx
// Admin OS レイアウト — サブナビゲーション + コンテンツ領域
// 因果ループ: Tenant管理 → User/Role管理 → Intelligence有効化 → 監査証跡

import AdminNav from "@/admin/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", height: "100%", overflow: "hidden" }}>
      <AdminNav />
      <main style={{ overflowY: "auto", background: "var(--bg)" }}>
        {children}
      </main>
    </div>
  );
}
