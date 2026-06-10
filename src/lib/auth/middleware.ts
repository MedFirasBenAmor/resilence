import type { UserRole } from "@prisma/client";
import {
  getDashboardPathForRole,
  getLoginRedirectPath,
  getRoleFromDashboardPath,
} from "@/lib/auth/routing";

type AuthLikeRecord = Record<string, unknown>;

type MiddlewareRedirectInput = {
  pathname: string;
  search?: string;
  role?: UserRole | null;
};

export function extractAuthRole(auth: unknown): UserRole | null {
  if (!auth || typeof auth !== "object") {
    return null;
  }

  const authRecord = auth as AuthLikeRecord;
  const userRole = readRoleValue(authRecord.user);

  if (userRole) {
    return userRole;
  }

  const tokenRole = readRoleValue(authRecord.token);

  if (tokenRole) {
    return tokenRole;
  }

  return isUserRole(authRecord.role) ? authRecord.role : null;
}

export function getAuthDebugSnapshot(input: {
  pathname: string;
  auth: unknown;
  cookies: { getAll(): Array<{ name: string }> };
}) {
  const authRecord = input.auth && typeof input.auth === "object"
    ? (input.auth as AuthLikeRecord)
    : null;
  const userRecord = authRecord?.user && typeof authRecord.user === "object"
    ? (authRecord.user as AuthLikeRecord)
    : null;
  const tokenRecord = authRecord?.token && typeof authRecord.token === "object"
    ? (authRecord.token as AuthLikeRecord)
    : null;

  return {
    pathname: input.pathname,
    hasAuth: Boolean(input.auth),
    authKeys: authRecord ? Object.keys(authRecord) : [],
    userKeys: userRecord ? Object.keys(userRecord) : [],
    tokenKeys: tokenRecord ? Object.keys(tokenRecord) : [],
    role: extractAuthRole(input.auth),
    cookieNames: input.cookies.getAll().map((cookie) => cookie.name),
    hasAuthSecret: Boolean(process.env.AUTH_SECRET),
    hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
  };
}

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

function readRoleValue(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const role = (value as AuthLikeRecord).role;
  return isUserRole(role) ? role : null;
}

function isUserRole(value: unknown): value is UserRole {
  return value === "STUDENT" || value === "SUPERVISOR" || value === "COMPANY" || value === "ADMIN";
}
