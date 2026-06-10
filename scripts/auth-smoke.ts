import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import { verifyPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

const EXPECTED_USERS = [
  {
    email: "admin@resilience.local",
    password: "Admin123!",
    role: UserRole.ADMIN,
  },
  {
    email: "supervisor@resilience.local",
    password: "Supervisor123!",
    role: UserRole.SUPERVISOR,
  },
] as const;

async function assertLocalAccount(input: (typeof EXPECTED_USERS)[number]) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      email: true,
      role: true,
      isActive: true,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new Error(`AUTH_SMOKE_FAILED: user missing: ${input.email}`);
  }

  if (!user.isActive) {
    throw new Error(`AUTH_SMOKE_FAILED: user inactive: ${input.email}`);
  }

  if (user.role !== input.role) {
    throw new Error(
      `AUTH_SMOKE_FAILED: wrong role for ${input.email}. Expected ${input.role}, got ${user.role}.`,
    );
  }

  if (!user.passwordHash) {
    throw new Error(`AUTH_SMOKE_FAILED: missing passwordHash: ${input.email}`);
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new Error(`AUTH_SMOKE_FAILED: password mismatch: ${input.email}`);
  }

  console.log(
    JSON.stringify({
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      passwordMatches,
    }),
  );
}

async function main() {
  for (const user of EXPECTED_USERS) {
    await assertLocalAccount(user);
  }

  console.log("AUTH_SMOKE_OK");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
