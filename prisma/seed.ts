import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

const LOCAL_DEV_ADMIN = {
  email: process.env.SEED_ADMIN_EMAIL ?? "admin@resilience.local",
  password: process.env.SEED_ADMIN_PASSWORD ?? "Admin123!",
  firstName: process.env.SEED_ADMIN_FIRST_NAME ?? "Ines",
  lastName: process.env.SEED_ADMIN_LAST_NAME ?? "Mansouri",
  phone: process.env.SEED_ADMIN_PHONE ?? "+21670000001",
};

const LOCAL_DEV_SUPERVISOR = {
  email: process.env.SEED_SUPERVISOR_EMAIL ?? "supervisor@resilience.local",
  password: process.env.SEED_SUPERVISOR_PASSWORD ?? "Supervisor123!",
  firstName: process.env.SEED_SUPERVISOR_FIRST_NAME ?? "Test",
  lastName: process.env.SEED_SUPERVISOR_LAST_NAME ?? "Supervisor",
  phone: process.env.SEED_SUPERVISOR_PHONE ?? null,
  title: process.env.SEED_SUPERVISOR_TITLE ?? "Test Supervisor",
  department: process.env.SEED_SUPERVISOR_DEPARTMENT ?? "MVP Testing",
  expertiseArea: process.env.SEED_SUPERVISOR_EXPERTISE_AREA ?? "Local QA and platform review",
  organization: process.env.SEED_SUPERVISOR_ORGANIZATION ?? "Resilience Local",
};

async function upsertUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
}) {
  const passwordHash = await hashPassword(input.password);

  return prisma.user.upsert({
    where: {
      email: input.email,
    },
    update: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: input.role,
      isActive: true,
      passwordHash,
    },
    create: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: input.role,
      isActive: true,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      passwordHash: true,
    },
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run prisma/seed.ts");
  }

  const admin = await upsertUser({
    ...LOCAL_DEV_ADMIN,
    role: UserRole.ADMIN,
  });

  const supervisor = await upsertUser({
    ...LOCAL_DEV_SUPERVISOR,
    role: UserRole.SUPERVISOR,
  });

  const supervisorProfile = await prisma.supervisorProfile.upsert({
    where: {
      userId: supervisor.id,
    },
    update: {
      title: LOCAL_DEV_SUPERVISOR.title,
      department: LOCAL_DEV_SUPERVISOR.department,
      expertiseArea: LOCAL_DEV_SUPERVISOR.expertiseArea,
      organization: LOCAL_DEV_SUPERVISOR.organization,
    },
    create: {
      userId: supervisor.id,
      title: LOCAL_DEV_SUPERVISOR.title,
      department: LOCAL_DEV_SUPERVISOR.department,
      expertiseArea: LOCAL_DEV_SUPERVISOR.expertiseArea,
      organization: LOCAL_DEV_SUPERVISOR.organization,
    },
    select: {
      userId: true,
      title: true,
      department: true,
      expertiseArea: true,
      organization: true,
    },
  });

  const passwordMatches = await verifyPassword(
    LOCAL_DEV_SUPERVISOR.password,
    supervisor.passwordHash ?? "",
  );

  console.log("Bootstrap admin ready", {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    isActive: admin.isActive,
  });
  console.log(`Local dev admin password: ${LOCAL_DEV_ADMIN.password}`);

  console.log("Bootstrap supervisor ready", {
    id: supervisor.id,
    email: supervisor.email,
    role: supervisor.role,
    isActive: supervisor.isActive,
  });
  console.log("Bootstrap supervisor profile ready", supervisorProfile);
  console.log(`Local dev supervisor password: ${LOCAL_DEV_SUPERVISOR.password}`);
  console.log("Bootstrap supervisor password verification", {
    email: supervisor.email,
    passwordMatches,
  });
}

main()
  .catch((error) => {
    console.error("Bootstrap seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
