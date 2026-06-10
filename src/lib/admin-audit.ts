import { AuditAction, type Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const auditActionValues = Object.values(AuditAction) as [AuditAction, ...AuditAction[]];

export const auditLogFiltersSchema = z.object({
  action: z.enum(auditActionValues).optional().or(z.literal("")),
  targetType: z.string().trim().max(120).optional().or(z.literal("")),
  query: z.string().trim().max(120).optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).default(1),
});

export type AuditLogLifecycleStatus = "pending" | "accepted" | "revoked" | "expired";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  ROLE_APPROVED: "Invitation approuvee",
  SUPERVISOR_ACCOUNT_CREATED: "Compte superviseur cree",
  INVITATION_REVOKED: "Invitation revoquee",
  INVITATION_EXPIRED: "Invitation expiree",
  PROJECT_REQUEST_SUBMITTED: "Demande de projet soumise",
  PROJECT_REQUEST_REVIEWED: "Demande de projet en revue",
  PROJECT_REQUEST_APPROVED: "Demande de projet approuvee",
  PROJECT_REQUEST_REJECTED: "Demande de projet rejetée",
  PROJECT_REQUEST_CONVERTED: "Demande convertie en projet",
  APPLICATION_ACCEPTED: "Candidature acceptee",
  APPLICATION_REJECTED: "Candidature rejetee",
  MEMBERSHIP_ASSIGNED: "Affectation creee",
  MEMBERSHIP_REACTIVATED: "Affectation reactivee",
  DELIVERABLE_SUBMITTED: "Livrable soumis",
  DELIVERABLE_REVIEWED: "Livrable relu",
  FEEDBACK_CREATED: "Feedback enregistre",
  CERTIFICATE_CREATED: "Attestation creee",
  CERTIFICATE_VERIFIED: "Attestation verifiee",
};

const AUDIT_LOG_PAGE_SIZE = 20;

export function normalizeAuditLogFilters(rawFilters: Record<string, string | string[] | undefined>) {
  const normalized = auditLogFiltersSchema.parse({
    action: Array.isArray(rawFilters.action) ? rawFilters.action[0] : rawFilters.action,
    targetType: Array.isArray(rawFilters.targetType)
      ? rawFilters.targetType[0]
      : rawFilters.targetType,
    query: Array.isArray(rawFilters.query) ? rawFilters.query[0] : rawFilters.query,
    page: Array.isArray(rawFilters.page) ? rawFilters.page[0] : rawFilters.page,
  });

  return {
    action: normalized.action ?? "",
    targetType: normalized.targetType ?? "",
    query: normalized.query ?? "",
    page: normalized.page,
  };
}

export function formatAuditDetails(details: Prisma.JsonValue | null) {
  if (!details) {
    return "Aucun detail supplementaire.";
  }

  if (typeof details !== "object") {
    return String(details);
  }

  const entries = Object.entries(details as Record<string, Prisma.JsonValue>)
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${formatAuditScalar(value)}`);

  return entries.length ? entries.join(" | ") : "Aucun detail supplementaire.";
}

function formatAuditScalar(value: Prisma.JsonValue): string {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return value.map((entry) => formatAuditScalar(entry)).join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export async function listAuditLogs(rawFilters: Record<string, string | string[] | undefined>) {
  const filters = normalizeAuditLogFilters(rawFilters);
  const skip = (filters.page - 1) * AUDIT_LOG_PAGE_SIZE;

  const where: Prisma.AuditLogWhereInput = {
    ...(filters.action ? { action: filters.action as AuditAction } : {}),
    ...(filters.targetType
      ? {
          targetType: {
            contains: filters.targetType,
            mode: "insensitive",
          },
        }
      : {}),
    ...(filters.query
      ? {
          OR: [
            {
              targetId: {
                contains: filters.query,
                mode: "insensitive",
              },
            },
            {
              targetType: {
                contains: filters.query,
                mode: "insensitive",
              },
            },
            {
              actor: {
                email: {
                  contains: filters.query,
                  mode: "insensitive",
                },
              },
            },
          ],
        }
      : {}),
  };

  const [items, totalItems, recentCount] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: AUDIT_LOG_PAGE_SIZE,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        details: true,
        createdAt: true,
        actor: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      actionLabel: AUDIT_ACTION_LABELS[item.action],
      actorName: item.actor
        ? `${item.actor.firstName} ${item.actor.lastName}`.trim()
        : "Systeme",
      actorEmail: item.actor?.email ?? null,
      actorRole: item.actor?.role ?? null,
      detailsSummary: formatAuditDetails(item.details),
    })),
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / AUDIT_LOG_PAGE_SIZE)),
    recentCount,
    filters,
    pageSize: AUDIT_LOG_PAGE_SIZE,
  };
}
