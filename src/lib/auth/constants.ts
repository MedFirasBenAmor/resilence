import type { UserRole } from "@prisma/client";
import { DEFAULT_USER_ROLE } from "@/lib/auth/roles";

export const PUBLIC_REGISTRATION_ROLES = [
  DEFAULT_USER_ROLE,
] as const;

export const DASHBOARD_PATHS: Record<UserRole, string> = {
  STUDENT: "/dashboard/student",
  SUPERVISOR: "/dashboard/supervisor",
  COMPANY: "/dashboard/company",
  ADMIN: "/dashboard/admin",
};

export const DASHBOARD_ROLE_BY_SEGMENT = {
  student: "STUDENT",
  supervisor: "SUPERVISOR",
  company: "COMPANY",
  admin: "ADMIN",
} as const;

export type DashboardSegment = keyof typeof DASHBOARD_ROLE_BY_SEGMENT;
