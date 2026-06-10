"use server";

import {
  AuditAction,
  DeliverableStatus,
  NotificationType,
  TaskStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import {
  createNotification,
  createNotificationsForAdmins,
} from "@/lib/notifications";
import {
  canCommentInProjectRoom,
  canManageProjectTasks,
  canReviewDeliverable,
  canReviewDeliverableStatus,
  canSetTaskStatus,
  canSubmitDeliverable,
  canUpdateProjectTaskStatus,
} from "@/lib/project-room-access";
import { getRoomPath, requireRoomAccess } from "@/lib/project-room-data";
import { sanitizeProjectRoomActionError } from "@/lib/project-room-errors";
import {
  deliverableReviewSchema,
  deliverableSubmitSchema,
  projectCommentSchema,
  projectTaskMutationSchema,
  projectTaskStatusSchema,
  toOptionalDate,
} from "@/lib/validators/project-room";
import type { ProjectRoomActionState } from "@/actions/projectRoomActionState";

export async function createProjectTaskAction(
  _: ProjectRoomActionState,
  formData: FormData,
) {
  try {
    const parsed = projectTaskMutationSchema.safeParse({
      projectId: formData.get("projectId"),
      taskId: "",
      title: formData.get("title"),
      description: formData.get("description"),
      dueDate: formData.get("dueDate"),
      status: formData.get("status"),
    });

    if (!parsed.success) {
      return {
        success: null,
        error: parsed.error.issues[0]?.message ?? "Tâche invalide.",
      } satisfies ProjectRoomActionState;
    }

    const { actor, roomScope } = await requireRoomAccess(parsed.data.projectId);

    if (!canManageProjectTasks(actor, roomScope)) {
      return {
        success: null,
        error: "Vous ne pouvez pas créer de tâche sur ce projet.",
      } satisfies ProjectRoomActionState;
    }

    await prisma.projectTask.create({
      data: {
        projectId: parsed.data.projectId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        dueDate: toOptionalDate(parsed.data.dueDate),
        status: parsed.data.status,
        createdById: actor.id,
        completedAt: parsed.data.status === TaskStatus.DONE ? new Date() : null,
      },
    });

    revalidatePath(getRoomPath(parsed.data.projectId));

    return {
      success: "Tâche créée.",
      error: null,
    } satisfies ProjectRoomActionState;
  } catch (error) {
    return {
      success: null,
      error: sanitizeProjectRoomActionError(error),
    } satisfies ProjectRoomActionState;
  }
}

export async function updateProjectTaskAction(
  _: ProjectRoomActionState,
  formData: FormData,
) {
  try {
    const parsed = projectTaskMutationSchema.safeParse({
      projectId: formData.get("projectId"),
      taskId: formData.get("taskId"),
      title: formData.get("title"),
      description: formData.get("description"),
      dueDate: formData.get("dueDate"),
      status: formData.get("status"),
    });

    if (!parsed.success || !parsed.data.taskId) {
      return {
        success: null,
        error: parsed.success
          ? "Tâche invalide."
          : parsed.error.issues[0]?.message ?? "Tâche invalide.",
      } satisfies ProjectRoomActionState;
    }

    const { actor, roomScope } = await requireRoomAccess(parsed.data.projectId);

    if (!canManageProjectTasks(actor, roomScope)) {
      return {
        success: null,
        error: "Vous ne pouvez pas modifier cette tâche.",
      } satisfies ProjectRoomActionState;
    }

    const task = await prisma.projectTask.findUnique({
      where: { id: parsed.data.taskId },
      select: { id: true, projectId: true },
    });

    if (!task || task.projectId !== parsed.data.projectId) {
      return {
        success: null,
        error: "Tâche introuvable.",
      } satisfies ProjectRoomActionState;
    }

    await prisma.projectTask.update({
      where: { id: task.id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        dueDate: toOptionalDate(parsed.data.dueDate),
        status: parsed.data.status,
        completedAt: parsed.data.status === TaskStatus.DONE ? new Date() : null,
      },
    });

    revalidatePath(getRoomPath(parsed.data.projectId));

    return {
      success: "Tâche mise à jour.",
      error: null,
    } satisfies ProjectRoomActionState;
  } catch (error) {
    return {
      success: null,
      error: sanitizeProjectRoomActionError(error),
    } satisfies ProjectRoomActionState;
  }
}

export async function updateProjectTaskStatusAction(
  _: ProjectRoomActionState,
  formData: FormData,
) {
  try {
    const parsed = projectTaskStatusSchema.safeParse({
      projectId: formData.get("projectId"),
      taskId: formData.get("taskId"),
      status: formData.get("status"),
    });

    if (!parsed.success) {
      return {
        success: null,
        error: parsed.error.issues[0]?.message ?? "Changement de statut invalide.",
      } satisfies ProjectRoomActionState;
    }

    const { actor, roomScope } = await requireRoomAccess(parsed.data.projectId);

    if (!canUpdateProjectTaskStatus(actor, roomScope)) {
      return {
        success: null,
        error: "Vous ne pouvez pas mettre à jour cette tâche.",
      } satisfies ProjectRoomActionState;
    }

    const task = await prisma.projectTask.findUnique({
      where: { id: parsed.data.taskId },
      select: {
        id: true,
        projectId: true,
        status: true,
      },
    });

    if (!task || task.projectId !== parsed.data.projectId) {
      return {
        success: null,
        error: "Tâche introuvable.",
      } satisfies ProjectRoomActionState;
    }

    if (!canSetTaskStatus(task.status, parsed.data.status)) {
      return {
        success: null,
        error: "Transition de statut non autorisée.",
      } satisfies ProjectRoomActionState;
    }

    await prisma.projectTask.update({
      where: { id: task.id },
      data: {
        status: parsed.data.status,
        completedAt: parsed.data.status === TaskStatus.DONE ? new Date() : null,
      },
    });

    revalidatePath(getRoomPath(parsed.data.projectId));

    return {
      success: "Statut de la tâche mis à jour.",
      error: null,
    } satisfies ProjectRoomActionState;
  } catch (error) {
    return {
      success: null,
      error: sanitizeProjectRoomActionError(error),
    } satisfies ProjectRoomActionState;
  }
}

export async function submitDeliverableAction(
  _: ProjectRoomActionState,
  formData: FormData,
) {
  try {
    const parsed = deliverableSubmitSchema.safeParse({
      projectId: formData.get("projectId"),
      taskId: formData.get("taskId"),
      title: formData.get("title"),
      description: formData.get("description"),
      submissionUrl: formData.get("submissionUrl"),
      repositoryUrl: formData.get("repositoryUrl"),
    });

    if (!parsed.success) {
      return {
        success: null,
        error: parsed.error.issues[0]?.message ?? "Livrable invalide.",
      } satisfies ProjectRoomActionState;
    }

    const { actor, roomScope } = await requireRoomAccess(parsed.data.projectId);

    if (!canSubmitDeliverable(actor, roomScope) || !actor.studentProfileId) {
      return {
        success: null,
        error: "Vous ne pouvez pas soumettre de livrable sur ce projet.",
      } satisfies ProjectRoomActionState;
    }

    const membership = await prisma.projectMembership.findUnique({
      where: {
        projectId_studentId: {
          projectId: parsed.data.projectId,
          studentId: actor.studentProfileId,
        },
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!membership?.isActive) {
      return {
        success: null,
        error: "Membership projet introuvable.",
      } satisfies ProjectRoomActionState;
    }

    if (parsed.data.taskId) {
      const task = await prisma.projectTask.findUnique({
        where: { id: parsed.data.taskId },
        select: {
          id: true,
          projectId: true,
        },
      });

      if (!task || task.projectId !== parsed.data.projectId) {
        return {
          success: null,
          error: "La tâche sélectionnée est invalide.",
        } satisfies ProjectRoomActionState;
      }
    }

    await prisma.$transaction(async (tx) => {
      const deliverable = await tx.deliverable.create({
        data: {
          projectId: parsed.data.projectId,
          membershipId: membership.id,
          taskId: parsed.data.taskId || null,
          title: parsed.data.title,
          description: parsed.data.description || null,
          submissionUrl: parsed.data.submissionUrl,
          repositoryUrl: parsed.data.repositoryUrl || null,
          status: DeliverableStatus.SUBMITTED,
          submittedAt: new Date(),
        },
        select: {
          id: true,
        },
      });

      await createAuditLog(tx, {
        actorId: actor.id,
        action: AuditAction.DELIVERABLE_SUBMITTED,
        targetType: "Deliverable",
        targetId: deliverable.id,
        details: {
          projectId: parsed.data.projectId,
          membershipId: membership.id,
          taskId: parsed.data.taskId || null,
        },
      });

      await createNotificationsForAdmins(tx, {
        type: NotificationType.DELIVERABLE_SUBMITTED,
        title: "Un livrable attend votre revue",
        message: `${parsed.data.title} a été soumis dans la room projet.`,
        href: getRoomPath(parsed.data.projectId),
        metadata: {
          projectId: parsed.data.projectId,
          membershipId: membership.id,
          taskId: parsed.data.taskId || null,
        },
      });

      if (roomScope.supervisorUserId) {
        await createNotification(tx, {
          recipientId: roomScope.supervisorUserId,
          type: NotificationType.DELIVERABLE_SUBMITTED,
          title: "Un livrable attend votre revue",
          message: `${parsed.data.title} a été soumis dans la room projet.`,
          href: getRoomPath(parsed.data.projectId),
          metadata: {
            projectId: parsed.data.projectId,
            membershipId: membership.id,
            taskId: parsed.data.taskId || null,
          },
        });
      }
    });

    revalidatePath(getRoomPath(parsed.data.projectId));

    return {
      success: "Livrable soumis.",
      error: null,
    } satisfies ProjectRoomActionState;
  } catch (error) {
    return {
      success: null,
      error: sanitizeProjectRoomActionError(error),
    } satisfies ProjectRoomActionState;
  }
}

export async function reviewDeliverableAction(
  _: ProjectRoomActionState,
  formData: FormData,
) {
  try {
    const parsed = deliverableReviewSchema.safeParse({
      projectId: formData.get("projectId"),
      deliverableId: formData.get("deliverableId"),
      status: formData.get("status"),
      reviewComment: formData.get("reviewComment"),
    });

    if (!parsed.success) {
      return {
        success: null,
        error: parsed.error.issues[0]?.message ?? "Review invalide.",
      } satisfies ProjectRoomActionState;
    }

    const { actor, roomScope } = await requireRoomAccess(parsed.data.projectId);

    if (!canReviewDeliverable(actor, roomScope)) {
      return {
        success: null,
        error: "Vous ne pouvez pas évaluer ce livrable.",
      } satisfies ProjectRoomActionState;
    }

    if (!canReviewDeliverableStatus(parsed.data.status)) {
      return {
        success: null,
        error: "Statut de revue invalide.",
      } satisfies ProjectRoomActionState;
    }

    const deliverable = await prisma.deliverable.findUnique({
      where: { id: parsed.data.deliverableId },
      select: {
        id: true,
        projectId: true,
        title: true,
        membership: {
          select: {
            student: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!deliverable || deliverable.projectId !== parsed.data.projectId) {
      return {
        success: null,
        error: "Livrable introuvable.",
      } satisfies ProjectRoomActionState;
    }

    await prisma.$transaction(async (tx) => {
      await tx.deliverable.update({
        where: { id: deliverable.id },
        data: {
          status: parsed.data.status,
          reviewComment: parsed.data.reviewComment || null,
          reviewedById: actor.id,
          reviewedAt: new Date(),
        },
      });

      await createAuditLog(tx, {
        actorId: actor.id,
        action: AuditAction.DELIVERABLE_REVIEWED,
        targetType: "Deliverable",
        targetId: deliverable.id,
        details: {
          projectId: parsed.data.projectId,
          status: parsed.data.status,
        },
      });

      if (deliverable.membership?.student.userId) {
        await createNotification(tx, {
          recipientId: deliverable.membership.student.userId,
          type: NotificationType.DELIVERABLE_REVIEWED,
          title: "Votre livrable a été évalué",
          message: `${deliverable.title} a reçu une revue. Consultez la room pour voir le statut et le commentaire.`,
          href: getRoomPath(parsed.data.projectId),
          metadata: {
            projectId: parsed.data.projectId,
            deliverableId: deliverable.id,
            status: parsed.data.status,
          },
        });
      }
    });

    revalidatePath(getRoomPath(parsed.data.projectId));

    return {
      success: "Livrable relu.",
      error: null,
    } satisfies ProjectRoomActionState;
  } catch (error) {
    return {
      success: null,
      error: sanitizeProjectRoomActionError(error),
    } satisfies ProjectRoomActionState;
  }
}

export async function createProjectCommentAction(
  _: ProjectRoomActionState,
  formData: FormData,
) {
  try {
    const parsed = projectCommentSchema.safeParse({
      projectId: formData.get("projectId"),
      deliverableId: formData.get("deliverableId"),
      body: formData.get("body"),
    });

    if (!parsed.success) {
      return {
        success: null,
        error: parsed.error.issues[0]?.message ?? "Commentaire invalide.",
      } satisfies ProjectRoomActionState;
    }

    const { actor, roomScope } = await requireRoomAccess(parsed.data.projectId);

    if (!canCommentInProjectRoom(actor, roomScope)) {
      return {
        success: null,
        error: "Vous ne pouvez pas commenter dans cette room.",
      } satisfies ProjectRoomActionState;
    }

    if (parsed.data.deliverableId) {
      const deliverable = await prisma.deliverable.findUnique({
        where: { id: parsed.data.deliverableId },
        select: {
          id: true,
          projectId: true,
        },
      });

      if (!deliverable || deliverable.projectId !== parsed.data.projectId) {
        return {
          success: null,
          error: "Le livrable cible est invalide.",
        } satisfies ProjectRoomActionState;
      }
    }

    await prisma.projectComment.create({
      data: {
        projectId: parsed.data.projectId,
        authorId: actor.id,
        deliverableId: parsed.data.deliverableId || null,
        body: parsed.data.body,
      },
    });

    revalidatePath(getRoomPath(parsed.data.projectId));

    return {
      success: "Commentaire ajouté.",
      error: null,
    } satisfies ProjectRoomActionState;
  } catch (error) {
    return {
      success: null,
      error: sanitizeProjectRoomActionError(error),
    } satisfies ProjectRoomActionState;
  }
}
