"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", { redirect: false, email, password });
      if (res?.error) {
        setError(
          res.error === "CredentialsSignin"
            ? "Invalid email or password."
            : res.error
        );
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email" className="label-caps text-muted-foreground">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="owner@fch.pk"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-11 border-stone focus-visible:ring-gold"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="label-caps text-muted-foreground">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-11 border-stone focus-visible:ring-gold"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-sm">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground text-[12px] font-medium uppercase tracking-[0.18em] rounded-sm"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
}
