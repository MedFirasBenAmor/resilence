import test from "node:test";
import assert from "node:assert/strict";
import { UserRole } from "@prisma/client";
import { authConfig } from "@/lib/auth/config";
import {
  extractAuthRole,
  getAuthDebugSnapshot,
  resolveAuthRedirect,
} from "@/lib/auth/middleware";

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

test("middleware extracts role from auth user", () => {
  assert.equal(
    extractAuthRole({
      user: {
        role: UserRole.ADMIN,
      },
    }),
    UserRole.ADMIN,
  );
});

test("middleware extracts role from auth token fallback", () => {
  assert.equal(
    extractAuthRole({
      token: {
        role: UserRole.STUDENT,
      },
    }),
    UserRole.STUDENT,
  );
});

test("middleware debug snapshot logs only safe metadata", () => {
  const snapshot = getAuthDebugSnapshot({
    pathname: "/dashboard/admin",
    auth: {
      user: {
        role: UserRole.ADMIN,
        email: "admin@example.com",
      },
      token: {
        sub: "admin-1",
        role: UserRole.ADMIN,
      },
    },
    cookies: {
      getAll() {
        return [
          { name: "__Secure-authjs.session-token" },
          { name: "theme" },
        ];
      },
    },
  });

  assert.equal(snapshot.pathname, "/dashboard/admin");
  assert.equal(snapshot.hasAuth, true);
  assert.deepEqual(snapshot.authKeys.sort(), ["token", "user"]);
  assert.deepEqual(snapshot.userKeys.sort(), ["email", "role"]);
  assert.deepEqual(snapshot.tokenKeys.sort(), ["role", "sub"]);
  assert.equal(snapshot.role, UserRole.ADMIN);
  assert.deepEqual(snapshot.cookieNames, ["__Secure-authjs.session-token", "theme"]);
  assert.equal("secret" in snapshot, false);
});

test("jwt callback persists sub role email and name", async () => {
  const token = await authConfig.callbacks!.jwt!({
    token: {},
    user: {
      id: "admin-1",
      role: UserRole.ADMIN,
      email: "admin@example.com",
      name: "Admin User",
    },
    account: null,
    profile: undefined,
    trigger: "signIn",
    isNewUser: false,
    session: undefined,
  });

  assert.equal(token.sub, "admin-1");
  assert.equal(token.role, UserRole.ADMIN);
  assert.equal(token.email, "admin@example.com");
  assert.equal(token.name, "Admin User");
});

test("session callback maps role from token", async () => {
  const session = await authConfig.callbacks!.session!({
    session: {
      user: {
        name: undefined,
        email: undefined,
      },
      expires: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    },
    token: {
      sub: "student-1",
      role: UserRole.STUDENT,
      email: "student@example.com",
      name: "Student User",
    },
    user: undefined,
    newSession: undefined,
    trigger: undefined,
  });

  assert.equal(session.user.id, "student-1");
  assert.equal(session.user.role, UserRole.STUDENT);
  assert.equal(session.user.email, "student@example.com");
  assert.equal(session.user.name, "Student User");
});
