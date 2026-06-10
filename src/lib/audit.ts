import { AuditAction, Prisma, type PrismaClient } from "@prisma/client";

export type AuditDetails = Prisma.InputJsonValue | null | undefined;

type AuditWriter = Pick<PrismaClient, "auditLog"> | Prisma.TransactionClient;

export type AuditLogInput = {
  actorId?: string | null;
  action: AuditAction;
  targetType: string;
  targetId?: string | null;
  details?: AuditDetails;
};

export async function createAuditLog(writer: AuditWriter, input: AuditLogInput) {
  await writer.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      details: input.details ?? undefined,
    },
  });
}
