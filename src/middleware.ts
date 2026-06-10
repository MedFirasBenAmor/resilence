import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/config";
import {
  extractAuthRole,
  getAuthDebugSnapshot,
  resolveAuthRedirect,
} from "@/lib/auth/middleware";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const role = extractAuthRole(request.auth);

  if (process.env.AUTH_DEBUG_MIDDLEWARE === "true") {
    console.info("[auth-middleware]", getAuthDebugSnapshot({
      pathname: request.nextUrl.pathname,
      auth: request.auth,
      cookies: request.cookies,
    }));
  }

  const redirectPath = resolveAuthRedirect({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    role,
  });

  if (redirectPath) {
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/login", "/register", "/dashboard/:path*"],
};
