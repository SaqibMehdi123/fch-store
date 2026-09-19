import { withAuth } from "next-auth/middleware";

/**
 * Admin route protection — gates every /admin/* route at the edge.
 * (Next.js 16 "proxy" convention; was "middleware".)
 * The /admin layout additionally re-checks the session server-side
 * (defense in depth). Admin APIs (Phase 3+) are gated separately.
 */
export default withAuth(
  function proxy() {
    return;
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const { pathname } = req.nextUrl;
        if (pathname === "/admin/login") return true; // login page is public
        return !!token;
      },
    },
    pages: {
      signIn: "/admin/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};
