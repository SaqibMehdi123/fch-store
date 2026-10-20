import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Admin panel layout — every /admin/* page (except /admin/login) is gated:
 * middleware checks the NextAuth JWT at the edge, this layout re-verifies
 * the session server-side (defense in depth) before rendering the shell.
 *
 * The noindex meta is belt-and-braces on top of the robots.txt disallow:
 * crawlers that never fetch robots.txt (or see a stray admin URL linked
 * somewhere) still get an explicit "keep this out of the index".
 */
export const metadata: Metadata = {
  title: { absolute: "Admin — FCH" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <AdminShell user={{ name: session.user.name ?? "", email: session.user.email ?? "", role: session.user.role ?? "admin" }}>
      {children}
    </AdminShell>
  );
}
