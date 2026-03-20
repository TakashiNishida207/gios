// app/layout.tsx
// GIOS Root Layout — Quiet × Clean × Executive Calm

import type { Metadata } from "next";
import Nav from "@/ui/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "GIOS — Growth Intelligence OS",
  description: "Business-first Growth Intelligence Operating System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-white text-gray-900 antialiased">
        <Nav lang="ja" />
        <main>{children}</main>
      </body>
    </html>
  );
}
