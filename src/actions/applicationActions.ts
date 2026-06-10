"use server";

import {
  ApplicationStatus,
  AuditAction,
  NotificationType,
  Prisma,
  UserRole,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import {
  createNotification,
  createNotificationsForAdmins,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import {
  canApplyToProject,
  canReviewProjectApplications,
  canTransitionApplicationStatus,
  canWithdrawApplication,
} from "@/lib/project-access";
import { requireRole } from "@/lib/rbac";
import {
  applicationDecisionSchema,
  projectApplicationSchema,
  projectApplicationWithdrawalSchema,
} from "@/lib/validators/project";
import type { ApplicationActionState } from "@/actions/applicationActionState";

function formatActionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "Cette action existe déjà ou entre en conflit avec des données existantes.";
    }

    if (error.code === "P2003") {
      return "La référence demandée est invalide.";
    }

    return "La base de données a refusé cette opération.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur inattendue est survenue.";
}

export async function applyToProjectAction(
  _: ApplicationActionState,
  formData: FormData,
) {
  try {
    const actor = await requireRole(UserRole.STUDENT, "/dashboard/student/projects");
    const parsed = projectApplicationSchema.safeParse({
      projectId: formData.get("projectId"),
      motivation: formData.get("motivation"),
    });

    if (!parsed.success) {
      return {
        success: null,
        error: parsed.error.issues[0]?.message ?? "Candidature invalide.",
      } satisfies ApplicationActionState;
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: actor.id },
      select: {
        id: true,
        level: true,
        academicValidationStatus: true,
      },
    });

    if (!student) {
      return {
        success: null,
        error: "Profil étudiant introuvable.",
      } satisfies ApplicationActionState;
    }

    const project = await prisma.project.findUnique({
      where: { id: parsed.data.projectId },
      select: {
        id: true,
        title: true,
        status: true,
        targetLevel: true,
        supervisor: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!project) {
      return {
        success: null,
        error: "Projet introuvable.",
      } satisfies ApplicationActionState;
    }

    const [existingApplication, existingMembership] = await prisma.$transaction([
      prisma.projectApplication.findUnique({
        where: {
          projectId_studentId: {
            projectId: project.id,
            studentId: student.id,
          },
        },
        select: {
          status: true,
        },
      }),
      prisma.projectMembership.findUnique({
        where: {
          projectId_studentId: {
            projectId: project.id,
            studentId: student.id,
          },
        },
        select: {
          id: true,
        },
      }),
    ]);

    const decision = canApplyToProject({
      validationStatus: student.academicValidationStatus,
      studentLevel: student.level,
      projectStatus: project.status,
      projectTargetLevel: project.targetLevel,
      existingApplicationStatus: existingApplication?.status ?? null,
      existingMembership: Boolean(existingMembership),
    });

    if (!decision.allowed) {
      return {
        success: null,
        error: decision.reason,
      } satisfies ApplicationActionState;
    }

    await prisma.$transaction(async (tx) => {
      await tx.projectApplication.create({
        data: {
          projectId: project.id,
          studentId: student.id,
          motivation: parsed.data.motivation,
        },
      });

      await createNotificationsForAdmins(tx, {
        type: NotificationType.APPLICATION_SUBMITTED,
        title: "Nouvelle candidature reçue",
        message: `${actor.firstName} ${actor.lastName} a candidaté au projet ${project.title}.`,
        href: `/dashboard/admin/projects/${project.id}`,
        metadata: {
          projectId: project.id,
          studentId: student.id,
          actorId: actor.id,
        },
      });

      if (project.supervisor?.userId) {
        await createNotification(tx, {
          recipientId: project.supervisor.userId,
          type: NotificationType.APPLICATION_SUBMITTED,
          title: "Nouvelle candidature reçue",
          message: `${actor.firstName} ${actor.lastName} a candidaté au projet ${project.title}.`,
          href: `/dashboard/supervisor/projects/${project.id}`,
          metadata: {
            projectId: project.id,
            studentId: student.id,
            actorId: actor.id,
          },
        });
      }
    });

    revalidatePath("/dashboard/student/projects");
    revalidatePath(`/dashboard/student/projects/${project.id}`);
    revalidatePath("/dashboard/supervisor/projects");
    revalidatePath(`/dashboard/supervisor/projects/${project.id}`);
    revalidatePath("/dashboard/admin/projects");
    revalidatePath(`/dashboard/admin/projects/${project.id}`);

    return {
      success: "Candidature envoyée.",
      error: null,
    } satisfies ApplicationActionState;
  } catch (error) {
    return {
      success: null,
      error: formatActionError(error),
    } satisfies ApplicationActionState;
  }
}

export async function withdrawApplicationAction(
  _: ApplicationActionState,
  formData: FormData,
) {
  try {
    const actor = await requireRole(UserRole.STUDENT, "/dashboard/student/projects");
    const parsed = projectApplicationWithdrawalSchema.safeParse({
      applicationId: formData.get("applicationId"),
      projectId: formData.get("projectId"),
    });

    if (!parsed.success) {
      return {
        success: null,
        error: parsed.error.issues[0]?.message ?? "Candidature invalide.",
      } satisfies ApplicationActionState;
    }

    const application = await prisma.projectApplication.findUnique({
      where: { id: parsed.data.applicationId },
      select: {
        id: true,
        status: true,
        student: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!application) {
      return {
        success: null,
        error: "Candidature introuvable.",
      } satisfies ApplicationActionState;
    }

    const decision = canWithdrawApplication(
      actor.id,
      application.student.userId,
      application.status,
    );

    if (!decision.allowed) {
      return {
        success: null,
        error: decision.reason,
      } satisfies ApplicationActionState;
    }

    await prisma.projectApplication.update({
      where: { id: application.id },
      data: {
        status: ApplicationStatus.WITHDRAWN,
        reviewedById: null,
        reviewedAt: null,
      },
    });

    revalidatePath("/dashboard/student/projects");
    revalidatePath(`/dashboard/student/projects/${parsed.data.projectId}`);
    revalidatePath(`/dashboard/supervisor/projects/${parsed.data.projectId}`);
    revalidatePath(`/dashboard/admin/projects/${parsed.data.projectId}`);

    return {
      success: "Candidature retirée.",
      error: null,
    } satisfies ApplicationActionState;
  } catch (error) {
    return {
      success: null,
      error: formatActionError(error),
    } satisfies ApplicationActionState;
  }
}

async function reviewApplication(
  formData: FormData,
  targetStatus: ApplicationStatus,
) {
  const actor = await requireRole(
    [UserRole.ADMIN, UserRole.SUPERVISOR],
    "/dashboard/supervisor/projects",
  );
  const parsed = applicationDecisionSchema.safeParse({
    applicationId: formData.get("applicationId"),
    status: targetStatus,
  });

  if (!parsed.success) {
    return {
      success: null,
      error: parsed.error.issues[0]?.message ?? "Décision invalide.",
    } satisfies ApplicationActionState;
  }

  const application = await prisma.projectApplication.findUnique({
    where: { id: parsed.data.applicationId },
    select: {
      id: true,
      status: true,
      projectId: true,
      studentId: true,
      project: {
        select: {
          id: true,
          status: true,
          capacity: true,
          companyId: true,
          supervisor: {
            select: {
              userId: true,
            },
          },
        },
      },
      student: {
        select: {
          id: true,
          userId: true,
        },
      },
    },
  });

  if (!application || !application.project) {
    return {
      success: null,
      error: "Candidature introuvable.",
    } satisfies ApplicationActionState;
  }

  const actorContext = await prisma.user.findUnique({
    where: { id: actor.id },
    select: {
      id: true,
      role: true,
      isActive: true,
      companyProfile: {
        select: {
          companyId: true,
        },
      },
    },
  });

  const canReview = canReviewProjectApplications(
    {
      id: actor.id,
      role: actor.role,
      isActive: actor.isActive,
      companyId: actorContext?.companyProfile?.companyId ?? null,
    },
    {
      id: application.project.id,
      status: application.project.status,
      companyId: application.project.companyId,
      supervisorUserId: application.project.supervisor?.userId ?? null,
    },
  );

  if (!canReview) {
    return {
      success: null,
      error: "Vous ne pouvez pas gérer les candidatures de ce projet.",
    } satisfies ApplicationActionState;
  }

  const [existingMembership, activeMembershipCount] = await prisma.$transaction([
    prisma.projectMembership.findUnique({
      where: {
        projectId_studentId: {
          projectId: application.projectId,
          studentId: application.studentId,
        },
      },
      select: {
        id: true,
        isActive: true,
      },
    }),
    prisma.projectMembership.count({
      where: {
        projectId: application.projectId,
        isActive: true,
      },
    }),
  ]);

  const transition = canTransitionApplicationStatus(
    application.status,
    targetStatus,
    Boolean(existingMembership?.isActive),
    activeMembershipCount,
    application.project.capacity,
  );

  if (!transition.allowed) {
    return {
      success: null,
      error: transition.reason,
    } satisfies ApplicationActionState;
  }

  await prisma.$transaction(async (tx) => {
    await tx.projectApplication.update({
      where: { id: application.id },
      data: {
        status: targetStatus,
        reviewedById: actor.id,
        reviewedAt: new Date(),
      },
    });

    if (transition.createMembership) {
      await tx.projectMembership.upsert({
        where: {
          projectId_studentId: {
            projectId: application.projectId,
            studentId: application.studentId,
          },
        },
        update: {
          isActive: true,
          endedAt: null,
          assignedById: actor.id,
        },
        create: {
          projectId: application.projectId,
          studentId: application.studentId,
          assignedById: actor.id,
          roleLabel: "Contributor",
        },
      });

      await createAuditLog(tx, {
        actorId: actor.id,
        action: existingMembership ? AuditAction.MEMBERSHIP_REACTIVATED : AuditAction.MEMBERSHIP_ASSIGNED,
        targetType: "ProjectMembership",
        targetId: existingMembership?.id ?? `${application.projectId}:${application.studentId}`,
        details: {
          projectId: application.projectId,
          studentId: application.studentId,
          applicationId: application.id,
        },
      });
    }

    await createAuditLog(tx, {
      actorId: actor.id,
      action:
        targetStatus === ApplicationStatus.ACCEPTED
          ? AuditAction.APPLICATION_ACCEPTED
          : AuditAction.APPLICATION_REJECTED,
      targetType: "ProjectApplication",
      targetId: application.id,
      details: {
        projectId: application.projectId,
        studentId: application.studentId,
        previousStatus: application.status,
        nextStatus: targetStatus,
      },
    });

    await createNotification(tx, {
      recipientId: application.student.userId,
      type: NotificationType.APPLICATION_STATUS_CHANGED,
      title:
        targetStatus === ApplicationStatus.ACCEPTED
          ? "Votre candidature a été acceptée"
          : "Votre candidature a été rejetée",
      message:
        targetStatus === ApplicationStatus.ACCEPTED
          ? "Vous pouvez maintenant accéder à la room projet et poursuivre la mission."
          : "La candidature n’a pas été retenue pour ce projet. Consultez le catalogue pour postuler à une autre opportunité.",
      href: `/dashboard/student/projects/${application.projectId}`,
      metadata: {
        projectId: application.projectId,
        applicationId: application.id,
        status: targetStatus,
      },
    });
  });

  revalidatePath(`/dashboard/supervisor/projects/${application.projectId}`);
  revalidatePath(`/dashboard/admin/projects/${application.projectId}`);
  revalidatePath(`/dashboard/student/projects/${application.projectId}`);
  revalidatePath("/dashboard/student/projects");

  return {
    success:
      targetStatus === ApplicationStatus.ACCEPTED
        ? "Candidature acceptée et membership créé."
        : "Candidature rejetée.",
    error: null,
  } satisfies ApplicationActionState;
}

export async function acceptApplicationAction(
  _: ApplicationActionState,
  formData: FormData,
) {
  try {
    return await reviewApplication(formData, ApplicationStatus.ACCEPTED);
  } catch (error) {
    return {
      success: null,
      error: formatActionError(error),
    } satisfies ApplicationActionState;
  }
}

export async function rejectApplicationAction(
  _: ApplicationActionState,
  formData: FormData,
) {
  try {
    return await reviewApplication(formData, ApplicationStatus.REJECTED);
  } catch (error) {
    return {
      success: null,
      error: formatActionError(error),
    } satisfies ApplicationActionState;
  }
}
