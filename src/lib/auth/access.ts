import { UserRole } from "@prisma/client";

export type AccessUser = {
  id: string;
  role: UserRole;
  isActive: boolean;
} | null;

export type AccessDecision =
  | { outcome: "redirect-login" }
  | { outcome: "forbidden" }
  | { outcome: "allow" };

export function evaluateAccess(
  user: AccessUser,
  allowedRoles?: UserRole | UserRole[],
): AccessDecision {
  if (!user || !user.isActive) {
    return { outcome: "redirect-login" };
  }

  if (!allowedRoles) {
    return { outcome: "allow" };
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(user.role)) {
    return { outcome: "forbidden" };
  }

  return { outcome: "allow" };
}
