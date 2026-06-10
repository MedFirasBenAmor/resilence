"use server";

import {
  AuditAction,
  FeedbackSource,
  NotificationType,
  Prisma,
  UserRole,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import {
  canCompanyLeaveFeedback,
  canAdminListFeedback,
  canEvaluateProjectMember,
  canViewStudentProgress,
} from "@/lib/feedback-access";
import { sanitizeFeedbackActionError } from "@/lib/feedback-errors";
import {
  calculateGlobalScore,
  calculateMaturityAverage,
  calculateTechnicalAverage,
} from "@/lib/scoring";
import { requireAuth, requireRole } from "@/lib/rbac";
import {
  adminFeedbackFiltersSchema,
  companyFeedbackSchema,
  getMaturityScoreEntries,
  getTechnicalScoreEntries,
  projectEvaluationFormSchema,
} from "@/lib/validators/scoring";
import type { FeedbackActionState } from "@/actions/feedbackActionState";
import type {
  AdminFeedbackListResult,
  EvaluationMemberRow,
  ProjectEvaluationMembersResult,
  ProjectEvaluationSummaryResult,
  ProjectEvaluationSummaryRow,
  StudentProgressResult,
} from "@/lib/feedback-data";

const ADMIN_FEEDBACK_PAGE_SIZE = 12;

type ProjectActorContext = {
  id: string;
  role: UserRole;
  isActive: boolean;
};

type MembershipEvaluationContext = {
  projectId: string;
  supervisorUserId: string | null;
  membershipIsActive: boolean;
  studentUserId: string;
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

function getEvaluationRoute(projectId: string) {
  return `/dashboard/supervisor/projects/${projectId}/evaluate`;
}

function getProgressRoute() {
  return "/dashboard/student/progress";
}

async function getMembershipEvaluationContext(membershipId: string) {
  const membership = await prisma.projectMembership.findUnique({
    where: { id: membershipId },
    select: {
      id: true,
      isActive: true,
      projectId: true,
      studentId: true,
      project: {
        select: {
          supervisor: {
            select: {
              userId: true,
            },
          },
        },
      },
      student: {
        select: {
          userId: true,
          displayName: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!membership) {
    throw new Error("Membership projet introuvable.");
  }

  return membership;
}

function toProjectEvaluationContext(
  membership: Awaited<ReturnType<typeof getMembershipEvaluationContext>>,
) {
  return {
    projectId: membership.projectId,
    supervisorUserId: membership.project.supervisor?.userId ?? null,
    membershipIsActive: membership.isActive,
    studentUserId: membership.student.userId,
  } satisfies MembershipEvaluationContext;
}

export async function createProjectEvaluation(
  _: FeedbackActionState,
  formData: FormData,
) {
  try {
    const actor = await requireRole(
      [UserRole.ADMIN, UserRole.SUPERVISOR],
      "/dashboard/supervisor/projects",
    );

    const parsed = projectEvaluationFormSchema.safeParse({
      projectId: formData.get("projectId"),
      membershipId: formData.get("membershipId"),
      deliverableId: formData.get("deliverableId"),
      title: formData.get("title"),
      comment: formData.get("comment"),
      code_quality: formData.get("code_quality"),
      problem_solving: formData.get("problem_solving"),
      technical_autonomy: formData.get("technical_autonomy"),
      documentation: formData.get("documentation"),
      delivery_quality: formData.get("delivery_quality"),
      communication: formData.get("communication"),
      reliability: formData.get("reliability"),
      teamwork: formData.get("teamwork"),
      deadline_respect: formData.get("deadline_respect"),
      initiative: formData.get("initiative"),
    });

    if (!parsed.success) {
      return {
        success: null,
        error: parsed.error.issues[0]?.message ?? "Evaluation invalide.",
      } satisfies FeedbackActionState;
    }

    const membership = await getMembershipEvaluationContext(parsed.data.membershipId);
    const evaluationContext = toProjectEvaluationContext(membership);

    if (
      membership.projectId !== parsed.data.projectId ||
      !canEvaluateProjectMember(actor, evaluationContext)
    ) {
      return {
        success: null,
        error: "Vous ne pouvez pas évaluer cet étudiant sur ce projet.",
      } satisfies FeedbackActionState;
    }

    if (parsed.data.deliverableId) {
      const deliverable = await prisma.deliverable.findUnique({
        where: { id: parsed.data.deliverableId },
        select: {
          id: true,
          projectId: true,
          membershipId: true,
        },
      });

      if (
        !deliverable ||
        deliverable.projectId !== membership.projectId ||
        deliverable.membershipId !== membership.id
      ) {
        return {
          success: null,
          error: "Le livrable selectionne est invalide.",
        } satisfies FeedbackActionState;
      }
    }

    const technicalEntries = getTechnicalScoreEntries(parsed.data.technicalScores);
    const maturityEntries = getMaturityScoreEntries(parsed.data.maturityScores);
    const technicalAverage = calculateTechnicalAverage(technicalEntries);
    const maturityAverage = calculateMaturityAverage(maturityEntries);
    const globalScore = calculateGlobalScore(technicalAverage, maturityAverage);
    const source = actor.role === UserRole.ADMIN ? FeedbackSource.ADMIN : FeedbackSource.SUPERVISOR;

    await prisma.$transaction(async (tx) => {
      const feedback = await tx.feedback.create({
        data: {
          studentId: membership.studentId,
          projectId: membership.projectId,
          membershipId: membership.id,
          deliverableId: parsed.data.deliverableId || null,
          authorId: actor.id,
          source,
          title: parsed.data.title || null,
          comment: parsed.data.comment,
          rating: Math.round(globalScore),
        },
        select: {
          id: true,
        },
      });

      await tx.technicalScore.createMany({
        data: technicalEntries.map((entry) => ({
          studentId: membership.studentId,
          projectId: membership.projectId,
          feedbackId: feedback.id,
          evaluatorId: actor.id,
          category: entry.criterion,
          score: entry.score,
          maxScore: 5,
          notes: null,
        })),
      });

      await tx.professionalMaturityScore.createMany({
        data: maturityEntries.map((entry) => ({
          studentId: membership.studentId,
          projectId: membership.projectId,
          feedbackId: feedback.id,
          evaluatorId: actor.id,
          dimension: entry.criterion,
          score: entry.score,
          maxScore: 5,
          notes: null,
        })),
      });

      await createAuditLog(tx, {
        actorId: actor.id,
        action: AuditAction.FEEDBACK_CREATED,
        targetType: "Feedback",
        targetId: feedback.id,
        details: {
          projectId: membership.projectId,
          membershipId: membership.id,
          deliverableId: parsed.data.deliverableId || null,
          source,
        },
      });

      await createNotification(tx, {
        recipientId: membership.student.userId,
        type: NotificationType.FEEDBACK_CREATED,
        title: "Nouveau feedback disponible",
        message: "Un nouveau feedback a ete publie sur votre progression projet.",
        href: "/dashboard/student/progress",
        metadata: {
          projectId: membership.projectId,
          membershipId: membership.id,
          source,
        },
      });
    });

    revalidatePath(getEvaluationRoute(parsed.data.projectId));
    revalidatePath(`/dashboard/supervisor/projects/${parsed.data.projectId}`);
    revalidatePath(`/dashboard/admin/projects/${parsed.data.projectId}`);
    revalidatePath("/dashboard/admin/feedback");
    revalidatePath(getProgressRoute());

    return {
      success: "Evaluation enregistree.",
      error: null,
    } satisfies FeedbackActionState;
  } catch (error) {
    return {
      success: null,
      error: sanitizeFeedbackActionError(error),
    } satisfies FeedbackActionState;
  }
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

export async function createCompanyFeedbackAction(
  _: FeedbackActionState,
  formData: FormData,
) {
  try {
    const actor = await requireRole(UserRole.COMPANY, "/dashboard/company");
    const parsed = companyFeedbackSchema.safeParse({
      projectId: formData.get("projectId"),
      membershipId: formData.get("membershipId"),
      title: formData.get("title"),
      comment: formData.get("comment"),
      rating: formData.get("rating"),
    });

    if (!parsed.success) {
      return {
        success: null,
        error: parsed.error.issues[0]?.message ?? "Feedback entreprise invalide.",
      } satisfies FeedbackActionState;
    }

    const [companyProfile, membership] = await prisma.$transaction([
      prisma.companyProfile.findUnique({
        where: { userId: actor.id },
        select: {
          companyId: true,
        },
      }),
      prisma.projectMembership.findUnique({
        where: { id: parsed.data.membershipId },
        select: {
          id: true,
          isActive: true,
          studentId: true,
          student: {
            select: {
              userId: true,
            },
          },
          project: {
            select: {
              id: true,
              companyId: true,
            },
          },
        },
      }),
    ]);

    if (!companyProfile || !membership || membership.project.id !== parsed.data.projectId) {
      return {
        success: null,
        error: "Le membre cible est invalide.",
      } satisfies FeedbackActionState;
    }

    if (
      !canCompanyLeaveFeedback(
        {
          ...actor,
          companyId: companyProfile.companyId,
        },
        {
          projectId: membership.project.id,
          supervisorUserId: null,
          membershipIsActive: membership.isActive,
          studentUserId: membership.student.userId,
          companyId: membership.project.companyId,
        },
      )
    ) {
      return {
        success: null,
        error: "Vous ne pouvez pas laisser de feedback sur ce projet.",
      } satisfies FeedbackActionState;
    }

    await prisma.$transaction(async (tx) => {
      const feedback = await tx.feedback.create({
        data: {
          studentId: membership.studentId,
          projectId: membership.project.id,
          membershipId: membership.id,
          authorId: actor.id,
          source: FeedbackSource.COMPANY,
          title: parsed.data.title || null,
          comment: parsed.data.comment,
          rating: parsed.data.rating,
        },
        select: {
          id: true,
        },
      });

      await createAuditLog(tx, {
        actorId: actor.id,
        action: AuditAction.FEEDBACK_CREATED,
        targetType: "Feedback",
        targetId: feedback.id,
        details: {
          projectId: membership.project.id,
          membershipId: membership.id,
          source: FeedbackSource.COMPANY,
        },
      });

      await createNotification(tx, {
        recipientId: membership.student.userId,
        type: NotificationType.FEEDBACK_CREATED,
        title: "Nouveau feedback disponible",
        message: "Votre entreprise partenaire a laisse un nouveau feedback sur votre mission.",
        href: "/dashboard/student/progress",
        metadata: {
          projectId: membership.project.id,
          membershipId: membership.id,
          source: FeedbackSource.COMPANY,
        },
      });
    });

    revalidatePath("/dashboard/company");
    revalidatePath("/dashboard/student/progress");
    revalidatePath("/dashboard/student/portfolio");

    return {
      success: "Feedback entreprise enregistre.",
      error: null,
    } satisfies FeedbackActionState;
  } catch (error) {
    return {
      success: null,
      error: sanitizeFeedbackActionError(error),
    } satisfies FeedbackActionState;
  }
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
  const actor = await requireRole(UserRole.STUDENT, getProgressRoute());
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
    filters,
  };
}
