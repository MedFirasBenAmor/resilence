import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema, type RegisterInput } from "@/lib/auth/validation";

export async function registerUser(rawInput: RegisterInput) {
  const input = registerSchema.parse(rawInput);
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await hashPassword(input.password);

  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: input.role,
          firstName: input.firstName,
          lastName: input.lastName,
        },
      });

      await tx.studentProfile.create({
        data: {
          userId: user.id,
        },
      });

      return user;
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
