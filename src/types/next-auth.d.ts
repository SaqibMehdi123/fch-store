import "next-auth";
import type { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: "owner" | "admin";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "owner" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "owner" | "admin";
    uid?: string;
  }
}
