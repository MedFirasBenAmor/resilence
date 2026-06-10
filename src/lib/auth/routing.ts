import type { UserRole } from "@prisma/client";
import { DASHBOARD_PATHS } from "@/lib/auth/constants";

export function getDashboardPathForRole(role: UserRole) {
  return DASHBOARD_PATHS[role];
}

export function getRoleFromDashboardPath(pathname: string) {
  const segment = pathname.split("/")[2];

  if (segment === "student") return "STUDENT";
  if (segment === "supervisor") return "SUPERVISOR";
  if (segment === "company") return "COMPANY";
  if (segment === "admin") return "ADMIN";
  return null;
}

export function getLoginRedirectPath(pathname: string) {
  const next = encodeURIComponent(pathname);
  return `/login?next=${next}`;
}

export function resolveSafeInternalRedirect(
  candidatePath: string | null | undefined,
  fallbackPath: string,
) {
  if (!candidatePath) {
    return fallbackPath;
  }

  if (!candidatePath.startsWith("/") || candidatePath.startsWith("//")) {
    return fallbackPath;
  }

  return candidatePath;
}
