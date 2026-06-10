import {
  DeliverableStatus,
  ProjectStatus,
  ProjectType,
  StudentLevel,
  TaskStatus,
  UserRole,
} from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  canCommentInProjectRoom,
  canManageProjectTasks,
  canReviewDeliverable,
  canSubmitDeliverable,
  canUpdateProjectTaskStatus,
  canViewProjectRoom,
} from "@/lib/project-room-access";
import { requireAuth } from "@/lib/rbac";

export type ProjectRoomData = {
  viewerRole: UserRole;
  project: {
    id: string;
    title: string;
    summary: string;
    description: string | null;
    type: ProjectType;
    status: ProjectStatus;
    targetLevel: StudentLevel;
    endDate: Date | null;
    supervisorName: string | null;
    companyName: string | null;
  };
  progress: {
    completedTasks: number;
    totalTasks: number;
    percentage: number;
  };
  permissions: {
    canManageTasks: boolean;
    canUpdateTaskStatus: boolean;
    canSubmitDeliverable: boolean;
    canReviewDeliverable: boolean;
    canComment: boolean;
    isReadOnlyCompany: boolean;
  };
  members: Array<{
    id: string;
    name: string;
    email: string;
    level: StudentLevel;
    roleLabel: string | null;
    isActive: boolean;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    dueDate: Date | null;
    completedAt: Date | null;
    createdAt: Date;
  }>;
  deliverables: Array<{
    id: string;
    title: string;
    description: string | null;
    submissionUrl: string | null;
    repositoryUrl: string | null;
    status: DeliverableStatus;
    submittedAt: Date | null;
    reviewedAt: Date | null;
    reviewComment: string | null;
    authorName: string | null;
    taskTitle: string | null;
  }>;
  comments: Array<{
    id: string;
    body: string;
    createdAt: Date;
    authorName: string;
    deliverableTitle: string | null;
  }>;
};

export type RoomActorContext = {
  id: string;
  role: UserRole;
  isActive: boolean;
  companyId: string | null;
  studentProfileId: string | null;
};

export type ProjectRoomScope = {
  id: string;
  companyId: string | null;
  supervisorUserId: string | null;
  hasActiveMembership: boolean;
};

const COMMENT_LIMIT = 20;
const DELIVERABLE_LIMIT = 20;

export function getRoomPath(projectId: string) {
  return `/dashboard/projects/${projectId}/room`;
}

export async function getRoomActorContext(userId: string) {
  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
      studentProfile: {
        select: {
          id: true,
        },
      },
      companyProfile: {
        select: {
          companyId: true,
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
    studentProfileId: actor.studentProfile?.id ?? null,
  } satisfies RoomActorContext;
}

export async function getProjectRoomScope(
  projectId: string,
  actor: RoomActorContext,
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      companyId: true,
      supervisor: {
        select: {
          userId: true,
        },
      },
      memberships: actor.studentProfileId
        ? {
            where: {
              studentId: actor.studentProfileId,
              isActive: true,
            },
            select: {
              id: true,
            },
          }
        : false,
    },
  });

  if (!project) {
    throw new Error("Projet introuvable.");
  }

  return {
    id: project.id,
    companyId: project.companyId,
    supervisorUserId: project.supervisor?.userId ?? null,
    hasActiveMembership: Array.isArray(project.memberships)
      ? project.memberships.length > 0
      : false,
  } satisfies ProjectRoomScope;
}

export async function requireRoomAccess(projectId: string) {
  const actor = await requireAuth(getRoomPath(projectId));
  const actorContext = await getRoomActorContext(actor.id);
  const roomScope = await getProjectRoomScope(projectId, actorContext);

  if (!canViewProjectRoom(actorContext, roomScope)) {
    redirect("/forbidden");
  }

  return {
    actor: actorContext,
    roomScope,
  };
}

export async function getProjectRoomData(projectId: string) {
  const { actor, roomScope } = await requireRoomAccess(projectId);

  const [project, tasks, deliverables, comments] = await prisma.$transaction([
    prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        summary: true,
        description: true,
        type: true,
        status: true,
        targetLevel: true,
        endDate: true,
        company: {
          select: {
            name: true,
          },
        },
        supervisor: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        memberships: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            roleLabel: true,
            isActive: true,
            student: {
              select: {
                level: true,
                displayName: true,
                user: {
                  select: {
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    }),
    prisma.projectTask.findMany({
      where: { projectId },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        dueDate: true,
        completedAt: true,
        createdAt: true,
      },
    }),
    prisma.deliverable.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "desc" }],
      take: DELIVERABLE_LIMIT,
      select: {
        id: true,
        title: true,
        description: true,
        submissionUrl: true,
        repositoryUrl: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
        reviewComment: true,
        membership: {
          select: {
            student: {
              select: {
                displayName: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        task: {
          select: {
            title: true,
          },
        },
      },
    }),
    prisma.projectComment.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "desc" }],
      take: COMMENT_LIMIT,
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        deliverable: {
          select: {
            title: true,
          },
        },
      },
    }),
  ]);

  if (!project) {
    redirect("/forbidden");
  }

  const completedTasks = tasks.filter((task) => task.status === TaskStatus.DONE).length;

  return {
    viewerRole: actor.role,
    project: {
      id: project.id,
      title: project.title,
      summary: project.summary,
      description: project.description,
      type: project.type,
      status: project.status,
      targetLevel: project.targetLevel,
      endDate: project.endDate,
      supervisorName: project.supervisor
        ? `${project.supervisor.user.firstName} ${project.supervisor.user.lastName}`.trim()
        : null,
      companyName: project.company?.name ?? null,
    },
    progress: {
      completedTasks,
      totalTasks: tasks.length,
      percentage: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
    },
    permissions: {
      canManageTasks: canManageProjectTasks(actor, roomScope),
      canUpdateTaskStatus: canUpdateProjectTaskStatus(actor, roomScope),
      canSubmitDeliverable: canSubmitDeliverable(actor, roomScope),
      canReviewDeliverable: canReviewDeliverable(actor, roomScope),
      canComment: canCommentInProjectRoom(actor, roomScope),
      isReadOnlyCompany: actor.role === UserRole.COMPANY,
    },
    members: project.memberships.map((membership) => ({
      id: membership.id,
      name:
        membership.student.displayName ??
        `${membership.student.user.firstName} ${membership.student.user.lastName}`.trim(),
      email: membership.student.user.email,
      level: membership.student.level,
      roleLabel: membership.roleLabel,
      isActive: membership.isActive,
    })),
    tasks,
    deliverables: deliverables.map((deliverable) => ({
      id: deliverable.id,
      title: deliverable.title,
      description: deliverable.description,
      submissionUrl: deliverable.submissionUrl,
      repositoryUrl: deliverable.repositoryUrl,
      status: deliverable.status,
      submittedAt: deliverable.submittedAt,
      reviewedAt: deliverable.reviewedAt,
      reviewComment: deliverable.reviewComment,
      authorName: deliverable.membership
        ? deliverable.membership.student.displayName ??
          `${deliverable.membership.student.user.firstName} ${deliverable.membership.student.user.lastName}`.trim()
        : null,
      taskTitle: deliverable.task?.title ?? null,
    })),
    comments: comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      authorName: `${comment.author.firstName} ${comment.author.lastName}`.trim(),
      deliverableTitle: comment.deliverable?.title ?? null,
    })),
  } satisfies ProjectRoomData;
}
