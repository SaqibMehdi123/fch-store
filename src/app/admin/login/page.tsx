import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user) redirect("/admin");

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="flex flex-col items-center mb-8">
          { }
          <img src="/logo.svg" alt="FCH logo" className="h-16 w-16" />
          <h1 className="font-display text-2xl mt-4">Fashion and Collection House</h1>
          <p className="label-caps text-muted-foreground mt-2">Admin Panel</p>
        </div>
        <div className="border border-stone bg-card p-8 rounded-sm shadow-[0_1px_2px_rgba(26,26,26,0.04)]">
          <LoginForm />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Authorized personnel only. All login attempts are rate-limited and logged.
        </p>
      </div>
    </main>
  );
}
