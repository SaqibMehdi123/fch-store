import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Admin panel layout — every /admin/* page (except /admin/login) is gated:
 * middleware checks the NextAuth JWT at the edge, this layout re-verifies
 * the session server-side (defense in depth) before rendering the shell.
 */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <AdminShell user={{ name: session.user.name ?? "", email: session.user.email ?? "", role: session.user.role ?? "admin" }}>
      {children}
    </AdminShell>
  );
}
