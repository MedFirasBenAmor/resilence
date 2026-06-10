"use server";

import {
  AuditAction,
  CompanyProjectRequestStatus,
  NotificationType,
  Prisma,
  ProjectStatus,
  ProjectType,
  UserRole,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import {
  createNotificationsForAdmins,
  createNotificationsForRecipients,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import {
  buildProjectRequestConversionDefaults,
  canManageCompanyProjectRequests,
  canMoveProjectRequestToStatus,
  canSubmitCompanyProjectRequest,
  canViewCompanyProjectRequest,
} from "@/lib/project-request-access";
import { requireRole } from "@/lib/rbac";
import { normalizeProjectSkills } from "@/lib/validators/project";
import {
  companyProjectRequestSchema,
  companyProjectRequestStatusSchema,
  convertProjectRequestSchema,
} from "@/lib/validators/project-request";
import type { ProjectRequestActionState } from "@/actions/projectRequestActionState";

export type CompanyProjectRequestListItem = {
  id: string;
  title: string;
  shortSummary: string;
  domain: string;
  desiredLevel: string;
  expectedTeamSize: number;
  estimatedDuration: string;
  specBookUrl: string;
  status: CompanyProjectRequestStatus;
  adminReviewNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  companyName: string;
  convertedProjectId: string | null;
};

export type CompanyProjectRequestDetail = CompanyProjectRequestListItem & {
  companyId: string;
  convertedProjectTitle: string | null;
};

function formatRequestActionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "Cette demande entre en conflit avec des données existantes.";
    }

    if (error.code === "P2003") {
      return "Une relation requise est invalide pour cette demande.";
    }

    return "La base de données a refusé cette opération.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur inattendue est survenue.";
}

async function requireCompanyActorContext(userId: string) {
  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
      companyProfile: {
        select: {
          companyId: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!actor) {
    throw new Error("Utilisateur introuvable.");
  }

  return {
    id: actor.id,
    role: actor.role,
    isActive: actor.isActive,
    companyId: actor.companyProfile?.companyId ?? null,
    companyName: actor.companyProfile?.company.name ?? null,
  };
}

function mapRequestListItem(
  request: {
    id: string;
    title: string;
    shortSummary: string;
    domain: string;
    desiredLevel: string;
    expectedTeamSize: number;
    estimatedDuration: string;
    specBookUrl: string;
    status: CompanyProjectRequestStatus;
    adminReviewNote: string | null;
    reviewedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    convertedProjectId: string | null;
    company: { id: string; name: string };
    convertedProject?: { title: string } | null;
  },
) {
  return {
    id: request.id,
    title: request.title,
    shortSummary: request.shortSummary,
    domain: request.domain,
    desiredLevel: request.desiredLevel,
    expectedTeamSize: request.expectedTeamSize,
    estimatedDuration: request.estimatedDuration,
    specBookUrl: request.specBookUrl,
    status: request.status,
    adminReviewNote: request.adminReviewNote,
    reviewedAt: request.reviewedAt,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    companyName: request.company.name,
    companyId: request.company.id,
    convertedProjectId: request.convertedProjectId,
    convertedProjectTitle: request.convertedProject?.title ?? null,
  };
}

export async function listCompanyProjectRequests() {
  const actor = await requireRole(UserRole.COMPANY, "/dashboard/company/project-requests");
  const actorContext = await requireCompanyActorContext(actor.id);

  if (!canSubmitCompanyProjectRequest(actorContext) || !actorContext.companyId) {
    throw new Error("Profil entreprise introuvable.");
  }

  const requests = await prisma.companyProjectRequest.findMany({
    where: {
      companyId: actorContext.companyId,
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      shortSummary: true,
      domain: true,
      desiredLevel: true,
      expectedTeamSize: true,
      estimatedDuration: true,
      specBookUrl: true,
      status: true,
      adminReviewNote: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true,
      convertedProjectId: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      convertedProject: {
        select: {
          title: true,
        },
      },
    },
  });

  return requests.map(mapRequestListItem) satisfies CompanyProjectRequestListItem[];
}

export async function listAdminProjectRequests() {
  await requireRole(UserRole.ADMIN, "/dashboard/admin/project-requests");

  const requests = await prisma.companyProjectRequest.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      shortSummary: true,
      domain: true,
      desiredLevel: true,
      expectedTeamSize: true,
      estimatedDuration: true,
      specBookUrl: true,
      status: true,
      adminReviewNote: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true,
      convertedProjectId: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      convertedProject: {
        select: {
          title: true,
        },
      },
    },
  });

  return requests.map(mapRequestListItem) satisfies CompanyProjectRequestListItem[];
}

export async function getAdminProjectRequestDetails(
  requestId: string,
): Promise<CompanyProjectRequestDetail> {
  await requireRole(UserRole.ADMIN, "/dashboard/admin/project-requests");

  const request = await prisma.companyProjectRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      title: true,
      shortSummary: true,
      domain: true,
      desiredLevel: true,
      expectedTeamSize: true,
      estimatedDuration: true,
      specBookUrl: true,
      status: true,
      adminReviewNote: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true,
      convertedProjectId: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      convertedProject: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!request) {
    throw new Error("Demande entreprise introuvable.");
  }

  return mapRequestListItem(request);
}

export async function submitCompanyProjectRequestAction(
  _: ProjectRequestActionState,
  formData: FormData,
) {
  try {
    const actor = await requireRole(UserRole.COMPANY, "/dashboard/company/project-requests");
    const actorContext = await requireCompanyActorContext(actor.id);

    if (!canSubmitCompanyProjectRequest(actorContext) || !actorContext.companyId) {
      return {
        success: null,
        error: "Votre profil entreprise est incomplet.",
      } satisfies ProjectRequestActionState;
    }

    const parsed = companyProjectRequestSchema.safeParse({
      title: formData.get("title"),
      shortSummary: formData.get("shortSummary"),
      domain: formData.get("domain"),
      desiredLevel: formData.get("desiredLevel"),
      expectedTeamSize: formData.get("expectedTeamSize"),
      estimatedDuration: formData.get("estimatedDuration"),
      specBookUrl: formData.get("specBookUrl"),
    });

    if (!parsed.success) {
      return {
        success: null,
        error: parsed.error.issues[0]?.message ?? "Demande invalide.",
      } satisfies ProjectRequestActionState;
    }

    await prisma.$transaction(async (tx) => {
      const request = await tx.companyProjectRequest.create({
        data: {
          companyId: actorContext.companyId!,
          title: parsed.data.title,
          shortSummary: parsed.data.shortSummary,
          domain: parsed.data.domain,
          desiredLevel: parsed.data.desiredLevel,
          expectedTeamSize: parsed.data.expectedTeamSize,
          estimatedDuration: parsed.data.estimatedDuration,
          specBookUrl: parsed.data.specBookUrl,
        },
        select: {
          id: true,
        },
      });

      await createAuditLog(tx, {
        actorId: actor.id,
        action: AuditAction.PROJECT_REQUEST_SUBMITTED,
        targetType: "CompanyProjectRequest",
        targetId: request.id,
        details: {
          companyId: actorContext.companyId,
          companyName: actorContext.companyName,
        },
      });

      await createNotificationsForAdmins(tx, {
        type: NotificationType.PROJECT_REQUEST_SUBMITTED,
        title: "Nouveau cahier de charge soumis",
        message: `${actorContext.companyName ?? "Une entreprise"} a soumis une nouvelle demande de projet.`,
        href: "/dashboard/admin/project-requests",
        metadata: {
          companyId: actorContext.companyId,
          requestId: request.id,
        },
      });
    });

    revalidatePath("/dashboard/company");
    revalidatePath("/dashboard/company/project-requests");
    revalidatePath("/dashboard/admin/project-requests");
    revalidatePath("/dashboard/admin/audit");

    return {
      success: "Cahier de charge soumis avec succès.",
      error: null,
    } satisfies ProjectRequestActionState;
  } catch (error) {
    return {
      success: null,
      error: formatRequestActionError(error),
    } satisfies ProjectRequestActionState;
  }
}

async function updateProjectRequestStatus(
  requestId: string,
  actorId: string,
  targetStatus: CompanyProjectRequestStatus,
  note: string | null,
) {
  const actor = await requireCompanyActorContext(actorId);

  if (!canManageCompanyProjectRequests(actor)) {
    throw new Error("Seul un administrateur peut gérer les demandes entreprise.");
  }

  const request = await prisma.companyProjectRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      companyId: true,
      status: true,
      title: true,
    },
  });

  if (!request) {
    throw new Error("Demande entreprise introuvable.");
  }

  if (!canMoveProjectRequestToStatus(request.status, targetStatus)) {
    throw new Error("Cette transition de statut n'est pas autorisée.");
  }

  const auditAction =
    targetStatus === CompanyProjectRequestStatus.UNDER_REVIEW
      ? AuditAction.PROJECT_REQUEST_REVIEWED
      : targetStatus === CompanyProjectRequestStatus.APPROVED
        ? AuditAction.PROJECT_REQUEST_APPROVED
        : AuditAction.PROJECT_REQUEST_REJECTED;

  await prisma.$transaction(async (tx) => {
    await tx.companyProjectRequest.update({
      where: { id: request.id },
      data: {
        status: targetStatus,
        adminReviewNote: note,
        reviewedAt: new Date(),
      },
    });

    await createAuditLog(tx, {
      actorId,
      action: auditAction,
      targetType: "CompanyProjectRequest",
      targetId: request.id,
      details: {
        companyId: request.companyId,
        previousStatus: request.status,
        nextStatus: targetStatus,
        note,
      },
    });

    const companyRecipients = await tx.companyProfile.findMany({
      where: {
        companyId: request.companyId,
        user: {
          isActive: true,
        },
      },
      select: {
        userId: true,
      },
    });

    await createNotificationsForRecipients(
      tx,
      companyRecipients.map((profile) => profile.userId),
      {
        type: NotificationType.PROJECT_REQUEST_STATUS_CHANGED,
        title:
          targetStatus === CompanyProjectRequestStatus.APPROVED
            ? "Votre demande de projet est approuvée"
            : targetStatus === CompanyProjectRequestStatus.REJECTED
              ? "Votre demande de projet a été rejetée"
              : "Votre demande de projet est en revue",
        message:
          targetStatus === CompanyProjectRequestStatus.APPROVED
            ? "L’administration a validé votre cahier de charge."
            : targetStatus === CompanyProjectRequestStatus.REJECTED
              ? "L’administration a mis à jour votre demande avec une décision de rejet."
              : "L’administration a commencé la revue de votre cahier de charge.",
        href: "/dashboard/company/project-requests",
        metadata: {
          requestId: request.id,
          status: targetStatus,
        },
      },
    );
  });

  revalidatePath("/dashboard/admin/project-requests");
  revalidatePath(`/dashboard/admin/project-requests/${request.id}`);
  revalidatePath("/dashboard/company");
  revalidatePath("/dashboard/company/project-requests");
  revalidatePath("/dashboard/admin/audit");
}

export async function markProjectRequestUnderReviewAction(
  _: ProjectRequestActionState,
  formData: FormData,
) {
  try {
    const actor = await requireRole(UserRole.ADMIN, "/dashboard/admin/project-requests");
    const parsed = companyProjectRequestStatusSchema.safeParse({
      requestId: formData.get("requestId"),
      status: CompanyProjectRequestStatus.UNDER_REVIEW,
      note: formData.get("note"),
    });

    if (!parsed.success) {
      return {
        success: null,
        error: parsed.error.issues[0]?.message ?? "Action invalide.",
      } satisfies ProjectRequestActionState;
    }

    await updateProjectRequestStatus(
      parsed.data.requestId,
      actor.id,
      CompanyProjectRequestStatus.UNDER_REVIEW,
      parsed.data.note || null,
    );

    return {
      success: "La demande est maintenant en revue.",
      error: null,
    } satisfies ProjectRequestActionState;
  } catch (error) {
    return {
      success: null,
      error: formatRequestActionError(error),
    } satisfies ProjectRequestActionState;
  }
}

export async function approveProjectRequestAction(
  _: ProjectRequestActionState,
  formData: FormData,
) {
  try {
    const actor = await requireRole(UserRole.ADMIN, "/dashboard/admin/project-requests");
    const parsed = companyProjectRequestStatusSchema.safeParse({
      requestId: formData.get("requestId"),
      status: CompanyProjectRequestStatus.APPROVED,
      note: formData.get("note"),
    });

    if (!parsed.success) {
      return {
        success: null,
        error: parsed.error.issues[0]?.message ?? "Action invalide.",
      } satisfies ProjectRequestActionState;
    }

    await updateProjectRequestStatus(
      parsed.data.requestId,
      actor.id,
      CompanyProjectRequestStatus.APPROVED,
      parsed.data.note || null,
    );

    return {
      success: "La demande est approuvée.",
      error: null,
    } satisfies ProjectRequestActionState;
  } catch (error) {
    return {
      success: null,
      error: formatRequestActionError(error),
    } satisfies ProjectRequestActionState;
  }
}

export async function rejectProjectRequestAction(
  _: ProjectRequestActionState,
  formData: FormData,
) {
  try {
    const actor = await requireRole(UserRole.ADMIN, "/dashboard/admin/project-requests");
    const parsed = companyProjectRequestStatusSchema.safeParse({
      requestId: formData.get("requestId"),
      status: CompanyProjectRequestStatus.REJECTED,
      note: formData.get("note"),
    });

    if (!parsed.success) {
      return {
        success: null,
        error: parsed.error.issues[0]?.message ?? "Action invalide.",
      } satisfies ProjectRequestActionState;
    }

    await updateProjectRequestStatus(
      parsed.data.requestId,
      actor.id,
      CompanyProjectRequestStatus.REJECTED,
      parsed.data.note || null,
    );

    return {
      success: "La demande est rejetée.",
      error: null,
    } satisfies ProjectRequestActionState;
  } catch (error) {
    return {
      success: null,
      error: formatRequestActionError(error),
    } satisfies ProjectRequestActionState;
  }
}

export async function convertProjectRequestToProjectAction(
  _: ProjectRequestActionState,
  formData: FormData,
) {
  try {
    const actor = await requireRole(UserRole.ADMIN, "/dashboard/admin/project-requests");
    const parsed = convertProjectRequestSchema.safeParse({
      requestId: formData.get("requestId"),
      title: formData.get("title"),
      summary: formData.get("summary"),
      description: formData.get("description"),
      targetLevel: formData.get("targetLevel"),
      capacity: formData.get("capacity"),
      requiredSkillsInput: formData.get("requiredSkillsInput"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    });

    if (!parsed.success) {
      return {
        success: null,
        error: parsed.error.issues[0]?.message ?? "Conversion invalide.",
      } satisfies ProjectRequestActionState;
    }

    const request = await prisma.companyProjectRequest.findUnique({
      where: { id: parsed.data.requestId },
      select: {
        id: true,
        companyId: true,
        title: true,
        shortSummary: true,
        domain: true,
        desiredLevel: true,
        expectedTeamSize: true,
        estimatedDuration: true,
        specBookUrl: true,
        status: true,
      },
    });

    if (!request) {
      return {
        success: null,
        error: "Demande entreprise introuvable.",
      } satisfies ProjectRequestActionState;
    }

    if (!canMoveProjectRequestToStatus(request.status, CompanyProjectRequestStatus.CONVERTED)) {
      return {
        success: null,
        error: "Seule une demande approuvée peut être convertie en projet.",
      } satisfies ProjectRequestActionState;
    }

    await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          title: parsed.data.title,
          summary: parsed.data.summary,
          description: parsed.data.description,
          type: ProjectType.REAL,
          status: ProjectStatus.OPEN,
          targetLevel: parsed.data.targetLevel,
          companyId: request.companyId,
          supervisorId: null,
          createdById: actor.id,
          capacity: parsed.data.capacity,
          startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
          endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
          requiredSkills: normalizeProjectSkills(parsed.data.requiredSkillsInput ?? ""),
        },
        select: {
          id: true,
        },
      });

      await tx.companyProjectRequest.update({
        where: { id: request.id },
        data: {
          status: CompanyProjectRequestStatus.CONVERTED,
          convertedProjectId: project.id,
          reviewedAt: new Date(),
        },
      });

      await createAuditLog(tx, {
        actorId: actor.id,
        action: AuditAction.PROJECT_REQUEST_CONVERTED,
        targetType: "CompanyProjectRequest",
        targetId: request.id,
        details: {
          companyId: request.companyId,
          projectId: project.id,
          specBookUrl: request.specBookUrl,
        },
      });

      const companyRecipients = await tx.companyProfile.findMany({
        where: {
          companyId: request.companyId,
          user: {
            isActive: true,
          },
        },
        select: {
          userId: true,
        },
      });

      await createNotificationsForRecipients(
        tx,
        companyRecipients.map((profile) => profile.userId),
        {
          type: NotificationType.PROJECT_REQUEST_STATUS_CHANGED,
          title: "Votre demande a été convertie en projet",
          message: "L’administration a publié votre demande sous forme de projet disponible dans la plateforme.",
          href: "/dashboard/company/project-requests",
          metadata: {
            requestId: request.id,
            projectId: project.id,
            status: CompanyProjectRequestStatus.CONVERTED,
          },
        },
      );
    });

    revalidatePath("/dashboard/admin/projects");
    revalidatePath("/dashboard/admin/project-requests");
    revalidatePath(`/dashboard/admin/project-requests/${parsed.data.requestId}`);
    revalidatePath("/dashboard/company");
    revalidatePath("/dashboard/company/project-requests");
    revalidatePath("/dashboard/student/projects");
    revalidatePath("/dashboard/admin/audit");

    return {
      success: "La demande a été convertie en projet publié.",
      error: null,
    } satisfies ProjectRequestActionState;
  } catch (error) {
    return {
      success: null,
      error: formatRequestActionError(error),
    } satisfies ProjectRequestActionState;
  }
}

export async function getProjectRequestConversionDefaults(requestId: string) {
  await requireRole(UserRole.ADMIN, "/dashboard/admin/project-requests");

  const request = await prisma.companyProjectRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      title: true,
      shortSummary: true,
      domain: true,
      desiredLevel: true,
      expectedTeamSize: true,
      estimatedDuration: true,
      specBookUrl: true,
      status: true,
    },
  });

  if (!request) {
    throw new Error("Demande entreprise introuvable.");
  }

  return {
    requestId: request.id,
    status: request.status,
    ...buildProjectRequestConversionDefaults(request),
  };
}

export async function listProjectRequestsForCompanyDashboard() {
  const actor = await requireRole(UserRole.COMPANY, "/dashboard/company");
  const actorContext = await requireCompanyActorContext(actor.id);

  if (!actorContext.companyId) {
    return [];
  }

  const requests = await prisma.companyProjectRequest.findMany({
    where: {
      companyId: actorContext.companyId,
    },
    orderBy: [{ createdAt: "desc" }],
    take: 5,
    select: {
      id: true,
      title: true,
      shortSummary: true,
      domain: true,
      desiredLevel: true,
      expectedTeamSize: true,
      estimatedDuration: true,
      specBookUrl: true,
      status: true,
      adminReviewNote: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true,
      convertedProjectId: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      convertedProject: {
        select: {
          title: true,
        },
      },
    },
  });

  return requests.map(mapRequestListItem) satisfies CompanyProjectRequestListItem[];
}

export async function canCompanyActorViewRequest(requestId: string) {
  const actor = await requireRole(UserRole.COMPANY, "/dashboard/company/project-requests");
  const actorContext = await requireCompanyActorContext(actor.id);
  const request = await prisma.companyProjectRequest.findUnique({
    where: { id: requestId },
    select: {
      companyId: true,
      status: true,
    },
  });

  if (!request) {
    return false;
  }

  return canViewCompanyProjectRequest(actorContext, request);
}
