import type { UserRole } from "@prisma/client";
import {
  getDashboardPathForRole,
  getLoginRedirectPath,
  getRoleFromDashboardPath,
} from "@/lib/auth/routing";

type MiddlewareRedirectInput = {
  pathname: string;
  search?: string;
  role?: UserRole | null;
};

export function resolveAuthRedirect({ pathname, search = "", role }: MiddlewareRedirectInput) {
  if ((pathname === "/login" || pathname === "/register") && role) {
    return getDashboardPathForRole(role);
  }

  if (!pathname.startsWith("/dashboard")) {
    return null;
  }

  if (!role) {
    return getLoginRedirectPath(`${pathname}${search}`);
  }

  const requiredRole = getRoleFromDashboardPath(pathname);

  if (requiredRole && requiredRole !== role) {
    return "/forbidden";
  }

  return null;
}
