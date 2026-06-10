import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@prisma/client";
import {
  getDashboardPathForRole,
  getLoginRedirectPath,
  getRoleFromDashboardPath,
} from "@/lib/auth/routing";

type TokenUser = {
  role?: UserRole;
};

export async function middleware(request: NextRequest) {
  const token = (await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })) as TokenUser | null;

  const pathname = request.nextUrl.pathname;

  if ((pathname === "/login" || pathname === "/register") && token?.role) {
    return NextResponse.redirect(new URL(getDashboardPathForRole(token.role), request.url));
  }

  if (pathname.startsWith("/dashboard")) {
    if (!token?.role) {
      return NextResponse.redirect(new URL(getLoginRedirectPath(pathname), request.url));
    }

    const requiredRole = getRoleFromDashboardPath(pathname);

    if (requiredRole && requiredRole !== token.role) {
      return NextResponse.redirect(new URL("/forbidden", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/dashboard/:path*"],
};
