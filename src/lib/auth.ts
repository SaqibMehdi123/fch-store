import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/** Login rate limit: 5 attempts per email+IP per 15 minutes */
const LOGIN_MAX = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // admin sessions expire after 8 hours
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  providers: [
    Credentials({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const email = (credentials?.email ?? "").toLowerCase().trim();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        // rate limit by email + IP
        const ip = clientIp(req?.headers ?? new Headers());
        const rl = rateLimit(`login:${ip}:${email}`, LOGIN_MAX, LOGIN_WINDOW_MS);
        if (!rl.ok) {
          const mins = Math.max(1, Math.ceil(rl.retryAfterSec / 60));
          throw new Error(`Too many login attempts. Please try again in ${mins} minute${mins > 1 ? "s" : ""}.`);
        }

        const user = await db.adminUser.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.uid;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/** Server-side session helper (admin layouts/pages) */
export function auth() {
  return getServerSession(authOptions);
}
