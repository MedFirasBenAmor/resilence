import {
  FeedbackSource,
  Prisma,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  canAdminListFeedback,
  canViewStudentProgress,
} from "@/lib/feedback-access";
import {
  calculateGlobalScore,
  calculateMaturityAverage,
  calculateTechnicalAverage,
} from "@/lib/scoring";
import { requireAuth, requireRole } from "@/lib/rbac";
import { adminFeedbackFiltersSchema } from "@/lib/validators/scoring";

const ADMIN_FEEDBACK_PAGE_SIZE = 12;

export type EvaluationMemberRow = {
  membershipId: string;
  studentId: string;
  studentUserId: string;
  studentName: string;
  studentEmail: string;
  level: string;
  roleLabel: string | null;
  deliverables: Array<{
    id: string;
    title: string;
    status: string;
  }>;
  feedbackCount: number;
  technicalAverage: number;
  maturityAverage: number;
  globalScore: number;
};

export type ProjectEvaluationMembersResult = {
  project: {
    id: string;
    title: string;
    status: string;
    targetLevel: string;
    companyName: string | null;
    supervisorName: string | null;
  };
  members: EvaluationMemberRow[];
};

export type ProjectEvaluationSummaryRow = {
  studentId: string;
  studentName: string;
  technicalAverage: number;
  maturityAverage: number;
  globalScore: number;
  feedbackCount: number;
  lastFeedbackAt: Date | null;
};

export type ProjectEvaluationSummaryResult = {
  projectId: string;
  totalMembers: number;
  evaluatedMembers: number;
  rows: ProjectEvaluationSummaryRow[];
};

export type StudentProgressResult = {
  studentName: string;
  technicalAverage: number;
  maturityAverage: number;
  globalScore: number;
  evaluatedProjects: number;
  feedbacks: Array<{
    id: string;
    title: string | null;
    comment: string;
    source: FeedbackSource;
    createdAt: Date;
    projectTitle: string | null;
    evaluatorName: string | null;
    deliverableTitle: string | null;
    technicalAverage: number;
    maturityAverage: number;
    globalScore: number;
  }>;
  projects: Array<{
    projectId: string;
    projectTitle: string;
    feedbackCount: number;
    technicalAverage: number;
    maturityAverage: number;
    globalScore: number;
  }>;
};

export type AdminFeedbackListResult = {
  items: Array<{
    id: string;
    title: string | null;
    comment: string;
    source: FeedbackSource;
    createdAt: Date;
    studentId: string;
    studentName: string;
    projectTitle: string | null;
    evaluatorName: string | null;
    technicalAverage: number;
    maturityAverage: number;
    globalScore: number;
  }>;
  page: number;
  totalPages: number;
  totalItems: number;
  filters: {
    projectId: string;
    studentId: string;
    evaluatorId: string;
    query: string;
    lowScoreOnly: boolean;
    dateFrom: string;
    dateTo: string;
  };
};

type ProjectActorContext = {
  id: string;
  role: UserRole;
  isActive: boolean;
};

type NormalizedAdminFeedbackFilters = {
  projectId: string;
  studentId: string;
  evaluatorId: string;
  query: string;
  lowScoreOnly: boolean;
  dateFrom: string;
  dateTo: string;
  page: number;
};

function averageFromScoreRecords<
  T extends { score: number; category?: string; dimension?: string },
>(scores: T[]) {
  return scores.length
    ? Number(
        (
          scores.reduce((sum, score) => sum + score.score, 0) / scores.length
        ).toFixed(2),
      )
    : 0;
}

function normalizeAdminFilters(input: Prisma.JsonObject | Record<string, unknown>) {
  const parsed = adminFeedbackFiltersSchema.parse(input);
  return {
    projectId: parsed.projectId ?? "",
    studentId: parsed.studentId ?? "",
    evaluatorId: parsed.evaluatorId ?? "",
    query: parsed.query ?? "",
    lowScoreOnly: parsed.lowScoreOnly === "true",
    dateFrom: parsed.dateFrom ?? "",
    dateTo: parsed.dateTo ?? "",
    page: parsed.page,
  } satisfies NormalizedAdminFeedbackFilters;
}

async function getProjectActorContext(userId: string) {
  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  });

  if (!actor) {
    throw new Error("Utilisateur introuvable.");
  }

  return actor satisfies ProjectActorContext;
}

async function requireManagedEvaluationProject(actorId: string, projectId: string) {
  const actor = await getProjectActorContext(actorId);
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      status: true,
      targetLevel: true,
      company: {
        select: {
          name: true,
        },
      },
      supervisor: {
        select: {
          userId: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!project) {
    throw new Error("Projet introuvable.");
  }

  const canManage =
    actor.role === UserRole.ADMIN ||
    (actor.role === UserRole.SUPERVISOR && project.supervisor?.userId === actor.id);

  if (!canManage) {
    throw new Error("Vous ne pouvez pas evaluer les membres de ce projet.");
  }

  return {
    actor,
    project,
  };
}

export async function listProjectMembersForEvaluation(
  projectId: string,
): Promise<ProjectEvaluationMembersResult> {
  const actor = await requireRole(
    [UserRole.ADMIN, UserRole.SUPERVISOR],
    "/dashboard/supervisor/projects",
  );
  const { project } = await requireManagedEvaluationProject(actor.id, projectId);

  const [memberships, technicalScores, maturityScores, feedbacks] = await prisma.$transaction([
    prisma.projectMembership.findMany({
      where: {
        projectId,
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        studentId: true,
        roleLabel: true,
        student: {
          select: {
            userId: true,
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
        deliverables: {
          take: 6,
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    }),
    prisma.technicalScore.findMany({
      where: {
        projectId,
      },
      select: {
        studentId: true,
        score: true,
      },
    }),
    prisma.professionalMaturityScore.findMany({
      where: {
        projectId,
      },
      select: {
        studentId: true,
        score: true,
      },
    }),
    prisma.feedback.findMany({
      where: {
        projectId,
      },
      select: {
        studentId: true,
      },
    }),
  ]);

  return {
    project: {
      id: project.id,
      title: project.title,
      status: project.status,
      targetLevel: project.targetLevel,
      companyName: project.company?.name ?? null,
      supervisorName: project.supervisor
        ? `${project.supervisor.user.firstName} ${project.supervisor.user.lastName}`.trim()
        : null,
    },
    members: memberships.map((membership) => {
      const studentName =
        membership.student.displayName ??
        `${membership.student.user.firstName} ${membership.student.user.lastName}`.trim();
      const studentTechnicalScores = technicalScores.filter(
        (score) => score.studentId === membership.studentId,
      );
      const studentMaturityScores = maturityScores.filter(
        (score) => score.studentId === membership.studentId,
      );
      const technicalAverage = averageFromScoreRecords(studentTechnicalScores);
      const maturityAverage = averageFromScoreRecords(studentMaturityScores);

      return {
        membershipId: membership.id,
        studentId: membership.studentId,
        studentUserId: membership.student.userId,
        studentName,
        studentEmail: membership.student.user.email,
        level: membership.student.level,
        roleLabel: membership.roleLabel,
        deliverables: membership.deliverables.map((deliverable) => ({
          id: deliverable.id,
          title: deliverable.title,
          status: deliverable.status,
        })),
        feedbackCount: feedbacks.filter((feedback) => feedback.studentId === membership.studentId)
          .length,
        technicalAverage,
        maturityAverage,
        globalScore: calculateGlobalScore(technicalAverage, maturityAverage),
      } satisfies EvaluationMemberRow;
    }),
  };
}

export async function getProjectEvaluationSummary(
  projectId: string,
): Promise<ProjectEvaluationSummaryResult> {
  const actor = await requireRole(
    [UserRole.ADMIN, UserRole.SUPERVISOR],
    "/dashboard/supervisor/projects",
  );
  await requireManagedEvaluationProject(actor.id, projectId);

  const [memberships, feedbacks, technicalScores, maturityScores] = await prisma.$transaction([
    prisma.projectMembership.findMany({
      where: {
        projectId,
        isActive: true,
      },
      select: {
        studentId: true,
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
    }),
    prisma.feedback.findMany({
      where: {
        projectId,
      },
      select: {
        studentId: true,
        createdAt: true,
      },
    }),
    prisma.technicalScore.findMany({
      where: {
        projectId,
      },
      select: {
        studentId: true,
        score: true,
      },
    }),
    prisma.professionalMaturityScore.findMany({
      where: {
        projectId,
      },
      select: {
        studentId: true,
        score: true,
      },
    }),
  ]);

  const rows = memberships.map((membership) => {
    const studentName =
      membership.student.displayName ??
      `${membership.student.user.firstName} ${membership.student.user.lastName}`.trim();
    const studentFeedbacks = feedbacks.filter((feedback) => feedback.studentId === membership.studentId);
    const technicalAverage = averageFromScoreRecords(
      technicalScores.filter((score) => score.studentId === membership.studentId),
    );
    const maturityAverage = averageFromScoreRecords(
      maturityScores.filter((score) => score.studentId === membership.studentId),
    );

    return {
      studentId: membership.studentId,
      studentName,
      technicalAverage,
      maturityAverage,
      globalScore: calculateGlobalScore(technicalAverage, maturityAverage),
      feedbackCount: studentFeedbacks.length,
      lastFeedbackAt: studentFeedbacks[0]?.createdAt ?? null,
    } satisfies ProjectEvaluationSummaryRow;
  });

  return {
    projectId,
    totalMembers: memberships.length,
    evaluatedMembers: rows.filter((row) => row.feedbackCount > 0).length,
    rows,
  };
}

export async function getStudentProgress(): Promise<StudentProgressResult> {
  const actor = await requireRole(UserRole.STUDENT, "/dashboard/student/progress");
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId: actor.id,
    },
    select: {
      id: true,
      displayName: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!student || !canViewStudentProgress(actor, actor.id)) {
    throw new Error("Progression étudiante introuvable.");
  }

  const feedbacks = await prisma.feedback.findMany({
    where: {
      studentId: student.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      comment: true,
      source: true,
      createdAt: true,
      projectId: true,
      project: {
        select: {
          title: true,
        },
      },
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
      technicalScores: {
        select: {
          score: true,
          feedbackId: true,
          category: true,
        },
      },
      maturityScores: {
        select: {
          score: true,
          feedbackId: true,
          dimension: true,
        },
      },
    },
  });

  const allTechnicalScores = feedbacks.flatMap((feedback) => feedback.technicalScores);
  const allMaturityScores = feedbacks.flatMap((feedback) => feedback.maturityScores);
  const overallTechnicalAverage = averageFromScoreRecords(allTechnicalScores);
  const overallMaturityAverage = averageFromScoreRecords(allMaturityScores);

  const projectMap = new Map<
    string,
    {
      projectId: string;
      projectTitle: string;
      feedbackCount: number;
      technicalScores: number[];
      maturityScores: number[];
    }
  >();

  for (const feedback of feedbacks) {
    if (!feedback.projectId || !feedback.project?.title) {
      continue;
    }

    const current = projectMap.get(feedback.projectId) ?? {
      projectId: feedback.projectId,
      projectTitle: feedback.project.title,
      feedbackCount: 0,
      technicalScores: [],
      maturityScores: [],
    };

    current.feedbackCount += 1;
    current.technicalScores.push(...feedback.technicalScores.map((score) => score.score));
    current.maturityScores.push(...feedback.maturityScores.map((score) => score.score));
    projectMap.set(feedback.projectId, current);
  }

  return {
    studentName:
      student.displayName ?? `${student.user.firstName} ${student.user.lastName}`.trim(),
    technicalAverage: overallTechnicalAverage,
    maturityAverage: overallMaturityAverage,
    globalScore: calculateGlobalScore(
      overallTechnicalAverage,
      overallMaturityAverage,
    ),
    evaluatedProjects: projectMap.size,
    feedbacks: feedbacks.map((feedback) => {
      const technicalAverage = averageFromScoreRecords(feedback.technicalScores);
      const maturityAverage = averageFromScoreRecords(feedback.maturityScores);

      return {
        id: feedback.id,
        title: feedback.title,
        comment: feedback.comment,
        source: feedback.source,
        createdAt: feedback.createdAt,
        projectTitle: feedback.project?.title ?? null,
        evaluatorName: feedback.author
          ? `${feedback.author.firstName} ${feedback.author.lastName}`.trim()
          : null,
        deliverableTitle: feedback.deliverable?.title ?? null,
        technicalAverage,
        maturityAverage,
        globalScore: calculateGlobalScore(technicalAverage, maturityAverage),
      };
    }),
    projects: Array.from(projectMap.values()).map((project) => {
      const technicalAverage = calculateTechnicalAverage(project.technicalScores);
      const maturityAverage = calculateMaturityAverage(project.maturityScores);

      return {
        projectId: project.projectId,
        projectTitle: project.projectTitle,
        feedbackCount: project.feedbackCount,
        technicalAverage,
        maturityAverage,
        globalScore: calculateGlobalScore(technicalAverage, maturityAverage),
      };
    }),
  };
}

export async function listAdminFeedback(
  rawFilters: Record<string, string | undefined>,
): Promise<AdminFeedbackListResult> {
  const actor = await requireAuth("/dashboard/admin/feedback");

  if (!canAdminListFeedback(actor)) {
    throw new Error("Vous ne pouvez pas consulter ce reporting.");
  }

  const filters = normalizeAdminFilters(rawFilters);
  const where: Prisma.FeedbackWhereInput = {
    ...(filters.projectId ? { projectId: filters.projectId } : {}),
    ...(filters.studentId ? { studentId: filters.studentId } : {}),
    ...(filters.evaluatorId ? { authorId: filters.evaluatorId } : {}),
    ...(filters.dateFrom || filters.dateTo
      ? {
          createdAt: {
            ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
            ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
          },
        }
      : {}),
    ...(filters.lowScoreOnly
      ? {
          OR: [
            {
              technicalScores: {
                some: {
                  score: {
                    lte: 2,
                  },
                },
              },
            },
            {
              maturityScores: {
                some: {
                  score: {
                    lte: 2,
                  },
                },
              },
            },
          ],
        }
      : {}),
    ...(filters.query
      ? {
          OR: [
            {
              title: {
                contains: filters.query,
                mode: "insensitive",
              },
            },
            {
              comment: {
                contains: filters.query,
                mode: "insensitive",
              },
            },
            {
              project: {
                title: {
                  contains: filters.query,
                  mode: "insensitive",
                },
              },
            },
            {
              student: {
                displayName: {
                  contains: filters.query,
                  mode: "insensitive",
                },
              },
            },
            {
              student: {
                user: {
                  email: {
                    contains: filters.query,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const skip = (filters.page - 1) * ADMIN_FEEDBACK_PAGE_SIZE;
  const [feedbacks, totalItems] = await prisma.$transaction([
    prisma.feedback.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: ADMIN_FEEDBACK_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        comment: true,
        source: true,
        createdAt: true,
        studentId: true,
        project: {
          select: {
            title: true,
          },
        },
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
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        technicalScores: {
          select: {
            score: true,
          },
        },
        maturityScores: {
          select: {
            score: true,
          },
        },
      },
    }),
    prisma.feedback.count({ where }),
  ]);

  return {
    items: feedbacks.map((feedback) => {
      const technicalAverage = averageFromScoreRecords(feedback.technicalScores);
      const maturityAverage = averageFromScoreRecords(feedback.maturityScores);

      return {
        id: feedback.id,
        title: feedback.title,
        comment: feedback.comment,
        source: feedback.source,
        createdAt: feedback.createdAt,
        studentId: feedback.studentId,
        studentName:
          feedback.student.displayName ??
          `${feedback.student.user.firstName} ${feedback.student.user.lastName}`.trim(),
        projectTitle: feedback.project?.title ?? null,
        evaluatorName: feedback.author
          ? `${feedback.author.firstName} ${feedback.author.lastName}`.trim()
          : null,
        technicalAverage,
        maturityAverage,
        globalScore: calculateGlobalScore(technicalAverage, maturityAverage),
      };
    }),
    page: filters.page,
    totalPages: Math.ceil(totalItems / ADMIN_FEEDBACK_PAGE_SIZE),
    totalItems,
    filters: {
      projectId: filters.projectId,
      studentId: filters.studentId,
      evaluatorId: filters.evaluatorId,
      query: filters.query,
      lowScoreOnly: filters.lowScoreOnly,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    },
  };
}
