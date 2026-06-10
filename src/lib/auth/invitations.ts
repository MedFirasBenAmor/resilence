import { randomUUID } from "node:crypto";
import { InvitationStatus, Prisma, UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

export type InvitationLifecycleStatus = InvitationStatus | "EXPIRED";

const nameSchema = z
  .string()
  .trim()
  .min(2, "Au moins 2 caracteres.")
  .max(80, "Maximum 80 caracteres.");

const passwordSchema = z
  .string()
  .min(8, "Au moins 8 caracteres.")
  .max(72, "Maximum 72 caracteres.");

export const createRoleInvitationSchema = z
  .object({
    email: z.email("Email invalide.").trim().toLowerCase(),
    role: z.enum([UserRole.SUPERVISOR, UserRole.COMPANY]),
    companyName: z.preprocess(
      (value) => (value == null ? "" : value),
      z.string().trim().max(120, "Maximum 120 caracteres."),
    ),
    expiresInDays: z.coerce.number().int().min(1, "Minimum 1 jour.").max(30, "Maximum 30 jours."),
  })
  .superRefine((input, ctx) => {
    if (input.role === UserRole.COMPANY && !input.companyName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyName"],
        message: "Le nom de l'entreprise est requis.",
      });
    }
  });

export const acceptRoleInvitationSchema = z
  .object({
    token: z.string().min(1, "Invitation invalide."),
    firstName: nameSchema,
    lastName: nameSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirmation requise."),
  })
  .superRefine((input, ctx) => {
    if (input.password !== input.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Les mots de passe ne correspondent pas.",
      });
    }
  });

export type CreateRoleInvitationInput = z.infer<typeof createRoleInvitationSchema>;
export type AcceptRoleInvitationInput = z.infer<typeof acceptRoleInvitationSchema>;

export async function getInvitationByToken(token: string) {
  return prisma.roleInvitation.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      role: true,
      companyName: true,
      status: true,
      expiresAt: true,
      acceptedAt: true,
    },
  });
}

export function resolveInvitationLifecycleStatus(
  status: InvitationStatus,
  expiresAt: Date,
  now = new Date(),
): InvitationLifecycleStatus {
  if (status !== InvitationStatus.PENDING) {
    return status;
  }

  return expiresAt < now ? "EXPIRED" : InvitationStatus.PENDING;
}

export async function listRoleInvitations() {
  return prisma.roleInvitation.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      email: true,
      role: true,
      companyName: true,
      token: true,
      status: true,
      expiresAt: true,
      acceptedAt: true,
      createdAt: true,
      invitedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      acceptedByUser: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function revokeRoleInvitationRecord(invitationId: string) {
  const invitation = await prisma.roleInvitation.findUnique({
    where: { id: invitationId },
    select: {
      id: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!invitation) {
    throw new Error("Invitation introuvable.");
  }

  if (invitation.status !== InvitationStatus.PENDING) {
    throw new Error("Seule une invitation en attente peut etre revoquee.");
  }

  return prisma.roleInvitation.update({
    where: { id: invitationId },
    data: {
      status: InvitationStatus.REVOKED,
    },
    select: {
      id: true,
      email: true,
      role: true,
      companyName: true,
      status: true,
      expiresAt: true,
      token: true,
    },
  });
}

export async function expireRoleInvitationRecord(invitationId: string) {
  const invitation = await prisma.roleInvitation.findUnique({
    where: { id: invitationId },
    select: {
      id: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!invitation) {
    throw new Error("Invitation introuvable.");
  }

  if (invitation.status !== InvitationStatus.PENDING) {
    throw new Error("Seule une invitation en attente peut etre expiree.");
  }

  return prisma.roleInvitation.update({
    where: { id: invitationId },
    data: {
      expiresAt: invitation.expiresAt < new Date() ? invitation.expiresAt : new Date(),
    },
    select: {
      id: true,
      email: true,
      role: true,
      companyName: true,
      status: true,
      expiresAt: true,
      token: true,
    },
  });
}

export async function createRoleInvitationRecord(
  actorId: string,
  rawInput: CreateRoleInvitationInput,
) {
  const input = createRoleInvitationSchema.parse(rawInput);
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error("Un compte existe déjà avec cet e-mail.");
  }

  return prisma.roleInvitation.create({
    data: {
      email: input.email,
      role: input.role,
      companyName: input.companyName?.trim() || null,
      invitedById: actorId,
      token: randomUUID(),
      status: InvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000),
    },
    select: {
      id: true,
      email: true,
      role: true,
      companyName: true,
      token: true,
      expiresAt: true,
    },
  });
}

export async function acceptRoleInvitation(rawInput: AcceptRoleInvitationInput) {
  const input = acceptRoleInvitationSchema.parse(rawInput);
  const invitation = await prisma.roleInvitation.findUnique({
    where: { token: input.token },
    select: {
      id: true,
      email: true,
      role: true,
      companyName: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!invitation) {
    throw new Error("Invitation introuvable.");
  }

  if (invitation.status !== InvitationStatus.PENDING) {
    throw new Error("Cette invitation n'est plus disponible.");
  }

  if (invitation.expiresAt < new Date()) {
    throw new Error("Cette invitation a expire.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: invitation.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error("Un compte existe déjà avec cet e-mail.");
  }

  const passwordHash = await hashPassword(input.password);

  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          role: invitation.role,
          firstName: input.firstName,
          lastName: input.lastName,
        },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
        },
      });

      if (invitation.role === UserRole.SUPERVISOR) {
        await tx.supervisorProfile.create({
          data: {
            userId: user.id,
          },
        });
      }

      if (invitation.role === UserRole.COMPANY) {
        const company = await tx.company.upsert({
          where: {
            name: invitation.companyName ?? invitation.email,
          },
          update: {
            isActive: true,
          },
          create: {
            name: invitation.companyName ?? invitation.email,
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        await tx.companyProfile.create({
          data: {
            userId: user.id,
            companyId: company.id,
          },
        });
      }

      await tx.roleInvitation.update({
        where: { id: invitation.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
          acceptedByUserId: user.id,
        },
      });

      return {
        ...user,
        invitationId: invitation.id,
      };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Une invitation ou un compte existe déjà avec ces informations.");
    }

    throw error;
  }
}
