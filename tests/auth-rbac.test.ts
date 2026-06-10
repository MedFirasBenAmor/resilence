import test from "node:test";
import assert from "node:assert/strict";
import { UserRole } from "@prisma/client";
import { evaluateAccess } from "@/lib/auth/access";
import { loginSchema, registerSchema } from "@/lib/auth/validation";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  getDashboardPathForRole,
  getLoginRedirectPath,
  getRoleFromDashboardPath,
  resolveSafeInternalRedirect,
} from "@/lib/auth/routing";
import { getNavigationForRole, isNavigationItemActive } from "@/lib/navigation";

test("register rejects invalid email", () => {
  const result = registerSchema.safeParse({
    firstName: "Ada",
    lastName: "Lovelace",
    email: "not-an-email",
    password: "Password123!",
    confirmPassword: "Password123!",
    role: UserRole.STUDENT,
    companyName: "",
  });

  assert.equal(result.success, false);
});

test("public register rejects supervisor role", () => {
  const result = registerSchema.safeParse({
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    password: "Password123!",
    confirmPassword: "Password123!",
    role: UserRole.SUPERVISOR,
  });

  assert.equal(result.success, false);
});

test("login rejects malformed email", () => {
  const result = loginSchema.safeParse({
    email: "broken-email",
    password: "secret",
  });

  assert.equal(result.success, false);
});

test("password verification fails with wrong password", async () => {
  const passwordHash = await hashPassword("Password123!");
  const isValid = await verifyPassword("WrongPassword123!", passwordHash);

  assert.equal(isValid, false);
});

test("unauthenticated dashboard access redirects to login with next param", () => {
  assert.equal(
    getLoginRedirectPath("/dashboard/admin"),
    "/login?next=%2Fdashboard%2Fadmin",
  );
});

test("wrong role dashboard path resolves to the protected role", () => {
  assert.equal(getRoleFromDashboardPath("/dashboard/admin"), UserRole.ADMIN);
  assert.equal(getRoleFromDashboardPath("/dashboard/student"), UserRole.STUDENT);
  assert.equal(getRoleFromDashboardPath("/dashboard/student-admin"), null);
});

test("good role maps to its dashboard", () => {
  assert.equal(getDashboardPathForRole(UserRole.ADMIN), "/dashboard/admin");
  assert.equal(getDashboardPathForRole(UserRole.COMPANY), "/dashboard/company");
});

test("login redirect path rejects unsafe external style values", () => {
  assert.equal(resolveSafeInternalRedirect("//evil.test", "/dashboard"), "/dashboard");
  assert.equal(resolveSafeInternalRedirect("https://evil.test", "/dashboard"), "/dashboard");
  assert.equal(resolveSafeInternalRedirect("/dashboard/admin", "/dashboard"), "/dashboard/admin");
});

test("non authenticated access is rejected", () => {
  const decision = evaluateAccess(null, UserRole.STUDENT);

  assert.equal(decision.outcome, "redirect-login");
});

test("student cannot access admin area", () => {
  const decision = evaluateAccess(
    { id: "student-1", role: UserRole.STUDENT, isActive: true },
    UserRole.ADMIN,
  );

  assert.equal(decision.outcome, "forbidden");
});

test("admin can access admin area", () => {
  const decision = evaluateAccess(
    { id: "admin-1", role: UserRole.ADMIN, isActive: true },
    UserRole.ADMIN,
  );

  assert.equal(decision.outcome, "allow");
});

test("supervisor can access supervisor area", () => {
  const decision = evaluateAccess(
    { id: "supervisor-1", role: UserRole.SUPERVISOR, isActive: true },
    UserRole.SUPERVISOR,
  );

  assert.equal(decision.outcome, "allow");
});

test("company can access only company area", () => {
  const companyAccess = evaluateAccess(
    { id: "company-1", role: UserRole.COMPANY, isActive: true },
    UserRole.COMPANY,
  );
  const adminAccess = evaluateAccess(
    { id: "company-1", role: UserRole.COMPANY, isActive: true },
    UserRole.ADMIN,
  );

  assert.equal(companyAccess.outcome, "allow");
  assert.equal(adminAccess.outcome, "forbidden");
});

test("supervisor navigation highlights evaluations without double-highlighting projects", () => {
  const items = getNavigationForRole(UserRole.SUPERVISOR);
  const projects = items.find((item) => item.label === "Projets");
  const evaluations = items.find((item) => item.label === "Évaluations");

  assert.ok(projects);
  assert.ok(evaluations);
  assert.equal(
    isNavigationItemActive("/dashboard/supervisor/projects/project-1/evaluate", projects),
    false,
  );
  assert.equal(
    isNavigationItemActive("/dashboard/supervisor/projects/project-1/evaluate", evaluations),
    true,
  );
});

test("admin navigation exposes audit observability page", () => {
  const items = getNavigationForRole(UserRole.ADMIN);
  const auditItem = items.find((item) => item.href === "/dashboard/admin/audit");

  assert.ok(auditItem);
  assert.equal(isNavigationItemActive("/dashboard/admin/audit", auditItem), true);
});

test("supervisor navigation no longer exposes project creation entry", () => {
  const items = getNavigationForRole(UserRole.SUPERVISOR);
  const createItem = items.find((item) => item.href === "/dashboard/supervisor/projects/new");

  assert.equal(createItem, undefined);
});

test("inactive session is treated as unauthenticated", () => {
  const decision = evaluateAccess(
    { id: "user-1", role: UserRole.ADMIN, isActive: false },
    UserRole.ADMIN,
  );

  assert.equal(decision.outcome, "redirect-login");
});
