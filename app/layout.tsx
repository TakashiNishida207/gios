// app/layout.tsx
// GIOS Root Layout — OS grid: 200px sidebar | main, 44px topbar spans full width

import type { Metadata } from "next";
import Topbar from "@/ui/Topbar";
import Sidebar from "@/ui/Sidebar";
import { PreferencesProvider } from "@/ui/preferences";
import "./globals.css";

export const metadata: Metadata = {
  title: "GIOS — Growth Intelligence OS",
  description: "Business-first Growth Intelligence OS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" data-theme="dark">
      <body>
        <PreferencesProvider>
          <div style={{
            display: "grid",
            gridTemplateColumns: "200px 1fr",
            gridTemplateRows: "44px 1fr",
            height: "100vh",
            overflow: "hidden",
            background: "var(--bg)",
          }}>
            <Topbar />
            <Sidebar />
            <main style={{ overflow: "hidden", background: "var(--bg)" }}>{children}</main>
          </div>
        </PreferencesProvider>
      </body>
    </html>
  );
}
