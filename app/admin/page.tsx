// app/admin/page.tsx
// /admin → /admin/tenants にリダイレクト

import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect("/admin/dashboard");
}
