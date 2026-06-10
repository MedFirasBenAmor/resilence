import test from "node:test";
import assert from "node:assert/strict";
import { AuditAction, Prisma, UserRole } from "@prisma/client";
import { createSupervisorAccount, verifyPassword } from "@/lib/auth/supervisors";

function createFakeDb() {
  const auditRecords: Array<Record<string, unknown>> = [];
  let existingUser: { id: string } | null = null;

  const tx = {
    user: {
      async create({
        data,
      }: {
        data: {
          email: string;
          passwordHash: string;
          role: UserRole;
          firstName: string;
          lastName: string;
          isActive: boolean;
        };
        select: Record<string, boolean>;
      }) {
        return {
          id: "supervisor-1",
          email: data.email,
          role: data.role,
          firstName: data.firstName,
          lastName: data.lastName,
          isActive: data.isActive,
          passwordHash: data.passwordHash,
        };
      },
    },
    supervisorProfile: {
      async create({
        data,
      }: {
        data: {
          userId: string;
          title: string | null;
          department: string | null;
          expertiseArea: string | null;
          organization: string | null;
        };
        select: Record<string, boolean>;
      }) {
        return {
          id: "profile-1",
          ...data,
        };
      },
    },
    auditLog: {
      async create({ data }: { data: Record<string, unknown> }) {
        auditRecords.push(data);
        return data;
      },
    },
  };

  return {
    db: {
      user: {
        async findUnique() {
          return existingUser;
        },
      },
      async $transaction<T>(callback: (innerTx: typeof tx) => Promise<T>) {
        return callback(tx);
      },
    },
    auditRecords,
    setExistingUser(value: { id: string } | null) {
      existingUser = value;
    },
  };
}

test("admin can create supervisor", async () => {
  const fake = createFakeDb();

  const result = await createSupervisorAccount(
    fake.db as never,
    { id: "admin-1", role: UserRole.ADMIN, isActive: true },
    {
      firstName: "Awa",
      lastName: "Diallo",
      email: "awa.supervisor@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      title: "Lead mentor",
      department: "Engineering",
      expertiseArea: "Backend systems",
      organization: "Resilience Lab",
    },
  );

  assert.equal(result.user.role, UserRole.SUPERVISOR);
  assert.equal(result.user.isActive, true);
  assert.equal(result.supervisorProfile.title, "Lead mentor");
});

test("supervisor user has role SUPERVISOR", async () => {
  const fake = createFakeDb();

  const result = await createSupervisorAccount(
    fake.db as never,
    { id: "admin-1", role: UserRole.ADMIN, isActive: true },
    {
      firstName: "Mina",
      lastName: "Kone",
      email: "mina.supervisor@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      title: "",
      department: "",
      expertiseArea: "",
      organization: "",
    },
  );

  assert.equal(result.user.role, UserRole.SUPERVISOR);
});

test("supervisor is active", async () => {
  const fake = createFakeDb();

  const result = await createSupervisorAccount(
    fake.db as never,
    { id: "admin-1", role: UserRole.ADMIN, isActive: true },
    {
      firstName: "Idriss",
      lastName: "Fall",
      email: "idriss.supervisor@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      title: "",
      department: "",
      expertiseArea: "",
      organization: "",
    },
  );

  assert.equal(result.user.isActive, true);
});

test("password hash works with verifyPassword", async () => {
  const fake = createFakeDb();

  const result = await createSupervisorAccount(
    fake.db as never,
    { id: "admin-1", role: UserRole.ADMIN, isActive: true },
    {
      firstName: "Nina",
      lastName: "Barry",
      email: "nina.supervisor@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      title: "",
      department: "",
      expertiseArea: "",
      organization: "",
    },
  );

  assert.ok(result.user.passwordHash);
  assert.equal(await verifyPassword("Password123!", result.user.passwordHash!), true);
  assert.notEqual(result.user.passwordHash, "Password123!");
});

test("supervisor profile is created", async () => {
  const fake = createFakeDb();

  const result = await createSupervisorAccount(
    fake.db as never,
    { id: "admin-1", role: UserRole.ADMIN, isActive: true },
    {
      firstName: "Sana",
      lastName: "Traore",
      email: "sana.supervisor@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      title: "Coach",
      department: "Pedagogy",
      expertiseArea: "Frontend",
      organization: "Campus Studio",
    },
  );

  assert.equal(result.supervisorProfile.userId, "supervisor-1");
  assert.equal(result.supervisorProfile.organization, "Campus Studio");
});

test("duplicate email is rejected", async () => {
  const fake = createFakeDb();
  fake.setExistingUser({ id: "existing-user" });

  await assert.rejects(
    createSupervisorAccount(
      fake.db as never,
      { id: "admin-1", role: UserRole.ADMIN, isActive: true },
      {
        firstName: "Awa",
        lastName: "Diallo",
        email: "dup@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
        title: "",
        department: "",
        expertiseArea: "",
        organization: "",
      },
    ),
    /EMAIL_ALREADY_EXISTS/,
  );
});

test("non-admin cannot create supervisor", async () => {
  const fake = createFakeDb();

  await assert.rejects(
    createSupervisorAccount(
      fake.db as never,
      { id: "supervisor-2", role: UserRole.SUPERVISOR, isActive: true },
      {
        firstName: "Awa",
        lastName: "Diallo",
        email: "blocked@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
        title: "",
        department: "",
        expertiseArea: "",
        organization: "",
      },
    ),
    /FORBIDDEN/,
  );
});

test("password mismatch rejected", async () => {
  const fake = createFakeDb();

  await assert.rejects(
    createSupervisorAccount(
      fake.db as never,
      { id: "admin-1", role: UserRole.ADMIN, isActive: true },
      {
        firstName: "Awa",
        lastName: "Diallo",
        email: "mismatch@example.com",
        password: "Password123!",
        confirmPassword: "Password456!",
        title: "",
        department: "",
        expertiseArea: "",
        organization: "",
      },
    ),
    /Les mots de passe ne correspondent pas/,
  );
});

test("audit log created", async () => {
  const fake = createFakeDb();

  await createSupervisorAccount(
    fake.db as never,
    { id: "admin-1", role: UserRole.ADMIN, isActive: true },
    {
      firstName: "Moussa",
      lastName: "Ba",
      email: "moussa.supervisor@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      title: "",
      department: "",
      expertiseArea: "",
      organization: "",
    },
  );

  assert.equal(fake.auditRecords.length, 1);
  assert.equal(fake.auditRecords[0]?.action, AuditAction.SUPERVISOR_ACCOUNT_CREATED);
  assert.equal(fake.auditRecords[0]?.targetId, "supervisor-1");
});

test("duplicate unique constraint is sanitized to domain error", async () => {
  const duplicate = new Prisma.PrismaClientKnownRequestError(
    "Duplicate email",
    { code: "P2002", clientVersion: "test" },
  );

  const fakeDb = {
    user: {
      async findUnique() {
        return null;
      },
    },
    async $transaction() {
      throw duplicate;
    },
  };

  await assert.rejects(
    createSupervisorAccount(
      fakeDb as never,
      { id: "admin-1", role: UserRole.ADMIN, isActive: true },
      {
        firstName: "Awa",
        lastName: "Diallo",
        email: "unique@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
        title: "",
        department: "",
        expertiseArea: "",
        organization: "",
      },
    ),
    /UNIQUE_CONSTRAINT_FAILED/,
  );
});
