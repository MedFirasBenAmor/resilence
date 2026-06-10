import test from "node:test";
import assert from "node:assert/strict";
import { UserRole } from "@prisma/client";
import { resolveAuthRedirect } from "@/lib/auth/middleware";

test("middleware sees authenticated admin session", () => {
  const redirectPath = resolveAuthRedirect({
    pathname: "/dashboard/admin",
    role: UserRole.ADMIN,
  });

  assert.equal(redirectPath, null);
});

test("middleware sees authenticated student session", () => {
  const redirectPath = resolveAuthRedirect({
    pathname: "/dashboard/student",
    role: UserRole.STUDENT,
  });

  assert.equal(redirectPath, null);
});

test("login page with session redirects to dashboard", () => {
  const redirectPath = resolveAuthRedirect({
    pathname: "/login",
    role: UserRole.SUPERVISOR,
  });

  assert.equal(redirectPath, "/dashboard/supervisor");
});

test("dashboard without session redirects to login", () => {
  const redirectPath = resolveAuthRedirect({
    pathname: "/dashboard/admin",
  });

  assert.equal(redirectPath, "/login?next=%2Fdashboard%2Fadmin");
});

test("no infinite redirect for login next dashboard path without session", () => {
  const redirectPath = resolveAuthRedirect({
    pathname: "/login",
    search: "?next=%2Fdashboard%2Fstudent",
  });

  assert.equal(redirectPath, null);
});
