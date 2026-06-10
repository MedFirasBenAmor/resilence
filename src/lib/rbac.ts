import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { evaluateAccess } from "@/lib/auth/access";
import {
  getDashboardPathForRole,
  getLoginRedirectPath,
} from "@/lib/auth/routing";
import {
  getCurrentUserBySession,
  type AuthenticatedUser,
} from "@/lib/auth/session";

export async function getCurrentUser() {
  const session = await auth();
  return getCurrentUserBySession(session);
}

export { getDashboardPathForRole, getLoginRedirectPath };

export async function requireAuth(redirectTo?: string): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  const decision = evaluateAccess(user);

  if (decision.outcome === "redirect-login") {
    redirect(getLoginRedirectPath(redirectTo ?? "/dashboard"));
  }

  return user as AuthenticatedUser;
}

export async function requireRole(
  allowedRoles: UserRole | UserRole[],
  redirectTo?: string,
): Promise<AuthenticatedUser> {
  const user = await requireAuth(redirectTo);
  const decision = evaluateAccess(user, allowedRoles);

  if (decision.outcome === "forbidden") {
    redirect("/forbidden");
  }

  return user;
}
