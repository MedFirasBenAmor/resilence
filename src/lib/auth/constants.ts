import { UserRole } from "@prisma/client";

export const PUBLIC_REGISTRATION_ROLES = [
  UserRole.STUDENT,
] as const;

export const DASHBOARD_PATHS: Record<UserRole, string> = {
  [UserRole.STUDENT]: "/dashboard/student",
  [UserRole.SUPERVISOR]: "/dashboard/supervisor",
  [UserRole.COMPANY]: "/dashboard/company",
  [UserRole.ADMIN]: "/dashboard/admin",
};

export const DASHBOARD_ROLE_BY_SEGMENT = {
  student: UserRole.STUDENT,
  supervisor: UserRole.SUPERVISOR,
  company: UserRole.COMPANY,
  admin: UserRole.ADMIN,
} as const;

export type DashboardSegment = keyof typeof DASHBOARD_ROLE_BY_SEGMENT;
