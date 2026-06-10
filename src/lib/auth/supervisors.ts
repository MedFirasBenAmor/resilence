import { AuditAction, Prisma, UserRole } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSupervisorAccountSchema,
  type CreateSupervisorAccountInput,
} from "@/lib/auth/validation";

type SupervisorActor = {
  id: string;
  role: UserRole;
  isActive: boolean;
};

type SupervisorAccountDb = {
  user: {
    findUnique(args: {
      where: { email: string };
      select: { id: true };
    }): Promise<{ id: string } | null>;
  };
  $transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T>;
};

export type CreatedSupervisorAccount = {
  user: {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    isActive: boolean;
    passwordHash: string | null;
  };
  supervisorProfile: {
    id: string;
    userId: string;
    title: string | null;
    department: string | null;
    expertiseArea: string | null;
    organization: string | null;
  };
};

export async function createSupervisorAccount(
  db: SupervisorAccountDb,
  actor: SupervisorActor,
  rawInput: CreateSupervisorAccountInput,
): Promise<CreatedSupervisorAccount> {
  if (actor.role !== UserRole.ADMIN || !actor.isActive) {
    throw new Error("FORBIDDEN");
  }

  const input = createSupervisorAccountSchema.parse(rawInput);
  const existingUser = await db.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await hashPassword(input.password);

  try {
    return await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: UserRole.SUPERVISOR,
          firstName: input.firstName,
          lastName: input.lastName,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          isActive: true,
          passwordHash: true,
        },
      });

      const supervisorProfile = await tx.supervisorProfile.create({
        data: {
          userId: user.id,
          title: input.title ?? null,
          department: input.department ?? null,
          expertiseArea: input.expertiseArea ?? null,
          organization: input.organization ?? null,
        },
        select: {
          id: true,
          userId: true,
          title: true,
          department: true,
          expertiseArea: true,
          organization: true,
        },
      });

      await createAuditLog(tx, {
        actorId: actor.id,
        action: AuditAction.SUPERVISOR_ACCOUNT_CREATED,
        targetType: "User",
        targetId: user.id,
        details: {
          email: user.email,
          createdByAdminId: actor.id,
          role: user.role,
        },
      });

      return {
        user,
        supervisorProfile,
      };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("UNIQUE_CONSTRAINT_FAILED");
    }

    throw error;
  }
}

export { verifyPassword };
