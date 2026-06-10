export const USER_ROLES = ["STUDENT", "SUPERVISOR", "COMPANY", "ADMIN"] as const;

export type UserRoleValue = (typeof USER_ROLES)[number];

export const DEFAULT_USER_ROLE: UserRoleValue = "STUDENT";
