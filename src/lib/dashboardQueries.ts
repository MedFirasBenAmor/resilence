import {
  AcademicValidationStatus,
  ApplicationStatus,
  CertificateStatus,
  DeliverableStatus,
  ProjectStatus,
  ProjectType,
  StudentLevel,
  StudentSubLevel,
  TaskStatus,
  UserRole,
  type FeedbackSource,
} from "@prisma/client";
import {
  buildAdminLowScoreAlerts,
  buildDashboardScoreSummary,
  canAccessDashboard,
  hasStudentDashboardContent,
  hasSupervisorDashboardContent,
  selectStudentActiveProjects,
  selectSupervisorManagedProjects,
} from "@/lib/dashboard-helpers";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { calculateGlobalScore } from "@/lib/scoring";

const STUDENT_ACTIVE_PROJECT_LIMIT = 3;
const STUDENT_APPLICATION_LIMIT = 5;
const STUDENT_DEADLINE_LIMIT = 5;
const STUDENT_DELIVERABLE_LIMIT = 5;
const STUDENT_FEEDBACK_LIMIT = 4;
const SUPERVISOR_PROJECT_LIMIT = 5;
const SUPERVISOR_DEADLINE_LIMIT = 6;
const SUPERVISOR_DELIVERABLE_LIMIT = 5;
const SUPERVISOR_FEEDBACK_LIMIT = 5;
const ADMIN_FEEDBACK_LIMIT = 6;
const ADMIN_ALERT_LIMIT = 6;
const ADMIN_REVIEW_LIMIT = 5;
const ADMIN_PENDING_STUDENT_LIMIT = 5;
const NEAR_DEADLINE_DAYS = 14;

export {
  buildAdminLowScoreAlerts,
  buildDashboardScoreSummary,
  canAccessDashboard,
  hasStudentDashboardContent,
  hasSupervisorDashboardContent,
  selectStudentActiveProjects,
  selectSupervisorManagedProjects,
};

function average(scores: number[]) {
  return scores.length
    ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2))
    : 0;
}

function getFullName(firstName: string | null | undefined, lastName: string | null | undefined) {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

function isProfileComplete(input: {
  displayName: string | null;
  bio: string | null;
  cvUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  skills: string[];
}) {
  return Boolean(
    input.displayName &&
      input.bio &&
      input.cvUrl &&
      input.githubUrl &&
      input.linkedinUrl &&
      input.skills.length,
  );
}

function isNearDeadline(date: Date | null, now: Date) {
  if (!date) {
    return false;
  }

  const distance = date.getTime() - now.getTime();
  return distance >= 0 && distance <= NEAR_DEADLINE_DAYS * 24 * 60 * 60 * 1000;
}

export type StudentDashboardData = {
  studentName: string;
  profile: {
    displayName: string | null;
    validationStatus: AcademicValidationStatus | null;
    level: StudentLevel | null;
    subLevel: StudentSubLevel | null;
    isComplete: boolean;
    validatedAt: Date | null;
  };
  scoreSummary: {
    technicalAverage: number;
    maturityAverage: number;
    globalScore: number;
    feedbackCount: number;
  };
  activeProjects: Array<{
    id: string;
    title: string;
    status: ProjectStatus;
    type: ProjectType;
    targetLevel: StudentLevel;
    companyName: string | null;
    endDate: Date | null;
    totalTasks: number;
    completedTasks: number;
    progressPercentage: number;
    roomHref: string;
    detailsHref: string;
  }>;
  recentApplications: Array<{
    id: string;
    projectId: string;
    projectTitle: string;
    status: ApplicationStatus;
    createdAt: Date;
  }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    dueDate: Date | null;
    projectId: string;
    projectTitle: string;
    status: TaskStatus;
  }>;
  recentDeliverables: Array<{
    id: string;
    title: string;
    status: DeliverableStatus;
    submittedAt: Date | null;
    projectId: string;
    projectTitle: string;
  }>;
  recentFeedbacks: Array<{
    id: string;
    title: string | null;
    comment: string;
    source: FeedbackSource;
    createdAt: Date;
    projectTitle: string | null;
    evaluatorName: string | null;
    technicalAverage: number;
    maturityAverage: number;
    globalScore: number;
  }>;
  primaryRoomHref: string | null;
  portfolioSnapshot: {
    itemCount: number;
    completedProjectCount: number;
    approvedDeliverableCount: number;
    certificateCount: number;
    issuedCertificateCount: number;
    latestCertificate: {
      id: string;
      title: string;
      status: CertificateStatus;
      issuedAt: Date | null;
    } | null;
  };
};

export async function getStudentDashboardData(): Promise<StudentDashboardData> {
  const actor = await requireRole(UserRole.STUDENT, "/dashboard/student");
  const student = await prisma.studentProfile.findUnique({
    where: { userId: actor.id },
    select: {
      id: true,
      displayName: true,
      bio: true,
      cvUrl: true,
      githubUrl: true,
      linkedinUrl: true,
      level: true,
      subLevel: true,
      skills: true,
      academicValidationStatus: true,
      academicValidatedAt: true,
    },
  });

  if (!student) {
    return {
      studentName: actor.firstName,
      profile: {
        displayName: null,
        validationStatus: null,
        level: null,
        subLevel: null,
        isComplete: false,
        validatedAt: null,
      },
      scoreSummary: buildDashboardScoreSummary(0, 0, 0),
      activeProjects: [],
      recentApplications: [],
      upcomingDeadlines: [],
      recentDeliverables: [],
      recentFeedbacks: [],
      primaryRoomHref: null,
      portfolioSnapshot: {
        itemCount: 0,
        completedProjectCount: 0,
        approvedDeliverableCount: 0,
        certificateCount: 0,
        issuedCertificateCount: 0,
        latestCertificate: null,
      },
    };
  }

  const now = new Date();
  const [
    activeMemberships,
    projectTasks,
    recentApplications,
    upcomingDeadlines,
    recentDeliverables,
    recentFeedbacks,
    technicalAggregate,
    maturityAggregate,
    feedbackCount,
    portfolioItemCount,
    completedProjectCount,
    approvedDeliverableCount,
    certificateCount,
    recentCertificates,
  ] = await prisma.$transaction([
    prisma.projectMembership.findMany({
      where: {
        studentId: student.id,
        isActive: true,
        project: {
          status: {
            in: [ProjectStatus.OPEN, ProjectStatus.IN_PROGRESS],
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: STUDENT_ACTIVE_PROJECT_LIMIT,
      select: {
        studentId: true,
        projectId: true,
        project: {
          select: {
            id: true,
            title: true,
            status: true,
            type: true,
            targetLevel: true,
            endDate: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.projectTask.findMany({
      where: {
        membership: {
          studentId: student.id,
          isActive: true,
        },
      },
      select: {
        projectId: true,
        status: true,
      },
    }),
    prisma.projectApplication.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      take: STUDENT_APPLICATION_LIMIT,
      select: {
        id: true,
        projectId: true,
        status: true,
        createdAt: true,
        project: {
          select: {
            title: true,
          },
        },
      },
    }),
    prisma.projectTask.findMany({
      where: {
        membership: {
          studentId: student.id,
          isActive: true,
        },
        dueDate: {
          gte: now,
        },
        status: {
          not: TaskStatus.DONE,
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      take: STUDENT_DEADLINE_LIMIT,
      select: {
        id: true,
        title: true,
        dueDate: true,
        status: true,
        projectId: true,
        project: {
          select: {
            title: true,
          },
        },
      },
    }),
    prisma.deliverable.findMany({
      where: {
        membership: {
          studentId: student.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: STUDENT_DELIVERABLE_LIMIT,
      select: {
        id: true,
        title: true,
        status: true,
        submittedAt: true,
        projectId: true,
        project: {
          select: {
            title: true,
          },
        },
      },
    }),
    prisma.feedback.findMany({
      where: {
        studentId: student.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: STUDENT_FEEDBACK_LIMIT,
      select: {
        id: true,
        title: true,
        comment: true,
        source: true,
        createdAt: true,
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
    prisma.technicalScore.aggregate({
      where: { studentId: student.id },
      _avg: {
        score: true,
      },
    }),
    prisma.professionalMaturityScore.aggregate({
      where: { studentId: student.id },
      _avg: {
        score: true,
      },
    }),
    prisma.feedback.count({
      where: { studentId: student.id },
    }),
    prisma.portfolioItem.count({
      where: { studentId: student.id },
    }),
    prisma.projectMembership.count({
      where: {
        studentId: student.id,
        project: {
          status: ProjectStatus.COMPLETED,
        },
      },
    }),
    prisma.deliverable.count({
      where: {
        membership: {
          studentId: student.id,
        },
        status: DeliverableStatus.APPROVED,
      },
    }),
    prisma.certificate.count({
      where: {
        studentId: student.id,
      },
    }),
    prisma.certificate.findMany({
      where: {
        studentId: student.id,
      },
      orderBy: [
        {
          issuedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 3,
      select: {
        id: true,
        title: true,
        status: true,
        issuedAt: true,
      },
    }),
  ]);

  const scoreSummary = buildDashboardScoreSummary(
    technicalAggregate._avg.score ?? 0,
    maturityAggregate._avg.score ?? 0,
    feedbackCount,
  );
  const projects = selectStudentActiveProjects(
    activeMemberships.map((membership) => ({
      studentId: membership.studentId,
      projectId: membership.project.id,
      title: membership.project.title,
      status: membership.project.status,
      type: membership.project.type,
      targetLevel: membership.project.targetLevel,
      endDate: membership.project.endDate,
      companyName: membership.project.company?.name ?? null,
    })),
    student.id,
  );
  const taskCounts = new Map<
    string,
    {
      total: number;
      completed: number;
    }
  >();

  for (const task of projectTasks) {
    const current = taskCounts.get(task.projectId) ?? { total: 0, completed: 0 };
    current.total += 1;

    if (task.status === TaskStatus.DONE) {
      current.completed += 1;
    }

    taskCounts.set(task.projectId, current);
  }

  return {
    studentName: student.displayName ?? actor.firstName,
    profile: {
      displayName: student.displayName,
      validationStatus: student.academicValidationStatus,
      level: student.level,
      subLevel: student.subLevel,
      isComplete: isProfileComplete(student),
      validatedAt: student.academicValidatedAt,
    },
    scoreSummary,
    activeProjects: projects.map((project) => {
      const counts = taskCounts.get(project.projectId) ?? { total: 0, completed: 0 };
      const progressPercentage =
        counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

      return {
        id: project.projectId,
        title: project.title,
        status: project.status,
        type: project.type,
        targetLevel: project.targetLevel,
        companyName: project.companyName,
        endDate: project.endDate,
        totalTasks: counts.total,
        completedTasks: counts.completed,
        progressPercentage,
        roomHref: `/dashboard/projects/${project.projectId}/room`,
        detailsHref: `/dashboard/student/projects/${project.projectId}`,
      };
    }),
    recentApplications: recentApplications.map((application) => ({
      id: application.id,
      projectId: application.projectId,
      projectTitle: application.project.title,
      status: application.status,
      createdAt: application.createdAt,
    })),
    upcomingDeadlines: upcomingDeadlines.map((task) => ({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate,
      projectId: task.projectId,
      projectTitle: task.project.title,
      status: task.status,
    })),
    recentDeliverables: recentDeliverables.map((deliverable) => ({
      id: deliverable.id,
      title: deliverable.title,
      status: deliverable.status,
      submittedAt: deliverable.submittedAt,
      projectId: deliverable.projectId,
      projectTitle: deliverable.project.title,
    })),
    recentFeedbacks: recentFeedbacks.map((feedback) => {
      const technicalAverage = average(feedback.technicalScores.map((score) => score.score));
      const maturityAverage = average(feedback.maturityScores.map((score) => score.score));

      return {
        id: feedback.id,
        title: feedback.title,
        comment: feedback.comment,
        source: feedback.source,
        createdAt: feedback.createdAt,
        projectTitle: feedback.project?.title ?? null,
        evaluatorName: feedback.author
          ? getFullName(feedback.author.firstName, feedback.author.lastName)
          : null,
        technicalAverage,
        maturityAverage,
        globalScore: calculateGlobalScore(technicalAverage, maturityAverage),
      };
    }),
    primaryRoomHref: projects[0] ? `/dashboard/projects/${projects[0].projectId}/room` : null,
    portfolioSnapshot: {
      itemCount: portfolioItemCount,
      completedProjectCount,
      approvedDeliverableCount,
      certificateCount,
      issuedCertificateCount: recentCertificates.filter(
        (certificate) => certificate.status === CertificateStatus.ISSUED,
      ).length,
      latestCertificate: recentCertificates[0]
        ? {
            id: recentCertificates[0].id,
            title: recentCertificates[0].title,
            status: recentCertificates[0].status,
            issuedAt: recentCertificates[0].issuedAt,
          }
        : null,
    },
  };
}

export type SupervisorDashboardData = {
  supervisorName: string;
  kpis: {
    supervisedProjects: number;
    activeProjects: number;
    pendingApplications: number;
    studentsFollowed: number;
    deliverablesToReview: number;
    blockedTasks: number;
  };
  projects: Array<{
    id: string;
    title: string;
    status: ProjectStatus;
    pendingApplications: number;
    activeMembers: number;
    roomHref: string;
    evaluateHref: string;
  }>;
  pendingReviewDeliverables: Array<{
    id: string;
    title: string;
    projectId: string;
    projectTitle: string;
    status: DeliverableStatus;
    submittedAt: Date | null;
  }>;
  deadlines: Array<{
    id: string;
    title: string;
    projectId: string;
    projectTitle: string;
    dueDate: Date | null;
    status: TaskStatus;
  }>;
  recentFeedbacks: Array<{
    id: string;
    title: string | null;
    studentName: string;
    projectTitle: string | null;
    createdAt: Date;
    globalScore: number;
  }>;
};

export async function getSupervisorDashboardData(): Promise<SupervisorDashboardData> {
  const actor = await requireRole(UserRole.SUPERVISOR, "/dashboard/supervisor");
  const now = new Date();

  const [
    supervisedProjects,
    activeProjects,
    pendingApplications,
    distinctStudents,
    deliverablesToReview,
    blockedTasks,
    projectRows,
    pendingReviewDeliverables,
    deadlines,
    recentFeedbacks,
  ] = await prisma.$transaction([
    prisma.project.count({
      where: {
        supervisor: {
          userId: actor.id,
        },
      },
    }),
    prisma.project.count({
      where: {
        supervisor: {
          userId: actor.id,
        },
        status: {
          in: [ProjectStatus.OPEN, ProjectStatus.IN_PROGRESS],
        },
      },
    }),
    prisma.projectApplication.count({
      where: {
        status: ApplicationStatus.PENDING,
        project: {
          supervisor: {
            userId: actor.id,
          },
        },
      },
    }),
    prisma.projectMembership.findMany({
      where: {
        isActive: true,
        project: {
          supervisor: {
            userId: actor.id,
          },
        },
      },
      distinct: ["studentId"],
      select: {
        studentId: true,
      },
    }),
    prisma.deliverable.count({
      where: {
        status: {
          in: [DeliverableStatus.SUBMITTED, DeliverableStatus.IN_REVIEW],
        },
        project: {
          supervisor: {
            userId: actor.id,
          },
        },
      },
    }),
    prisma.projectTask.count({
      where: {
        status: TaskStatus.BLOCKED,
        project: {
          supervisor: {
            userId: actor.id,
          },
        },
      },
    }),
    prisma.project.findMany({
      where: {
        supervisor: {
          userId: actor.id,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: SUPERVISOR_PROJECT_LIMIT,
      select: {
        id: true,
        title: true,
        status: true,
        supervisor: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            memberships: {
              where: {
                isActive: true,
              },
            },
            applications: {
              where: {
                status: ApplicationStatus.PENDING,
              },
            },
          },
        },
      },
    }),
    prisma.deliverable.findMany({
      where: {
        status: {
          in: [DeliverableStatus.SUBMITTED, DeliverableStatus.IN_REVIEW],
        },
        project: {
          supervisor: {
            userId: actor.id,
          },
        },
      },
      orderBy: [
        {
          submittedAt: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: SUPERVISOR_DELIVERABLE_LIMIT,
      select: {
        id: true,
        title: true,
        projectId: true,
        status: true,
        submittedAt: true,
        project: {
          select: {
            title: true,
          },
        },
      },
    }),
    prisma.projectTask.findMany({
      where: {
        project: {
          supervisor: {
            userId: actor.id,
          },
        },
        dueDate: {
          gte: now,
        },
        status: {
          not: TaskStatus.DONE,
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      take: SUPERVISOR_DEADLINE_LIMIT,
      select: {
        id: true,
        title: true,
        projectId: true,
        dueDate: true,
        status: true,
        project: {
          select: {
            title: true,
          },
        },
      },
    }),
    prisma.feedback.findMany({
      where: {
        authorId: actor.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: SUPERVISOR_FEEDBACK_LIMIT,
      select: {
        id: true,
        title: true,
        createdAt: true,
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
  ]);

  const projects = selectSupervisorManagedProjects(
    projectRows.map((project) => ({
      projectId: project.id,
      title: project.title,
      supervisorUserId: project.supervisor?.userId ?? null,
      status: project.status,
    })),
    actor.id,
  );

  return {
    supervisorName: actor.firstName,
    kpis: {
      supervisedProjects,
      activeProjects,
      pendingApplications,
      studentsFollowed: distinctStudents.length,
      deliverablesToReview,
      blockedTasks,
    },
    projects: projects.map((project) => {
      const source = projectRows.find((row) => row.id === project.projectId);

      return {
        id: project.projectId,
        title: project.title,
        status: project.status,
        pendingApplications: source?._count.applications ?? 0,
        activeMembers: source?._count.memberships ?? 0,
        roomHref: `/dashboard/projects/${project.projectId}/room`,
        evaluateHref: `/dashboard/supervisor/projects/${project.projectId}/evaluate`,
      };
    }),
    pendingReviewDeliverables: pendingReviewDeliverables.map((deliverable) => ({
      id: deliverable.id,
      title: deliverable.title,
      projectId: deliverable.projectId,
      projectTitle: deliverable.project.title,
      status: deliverable.status,
      submittedAt: deliverable.submittedAt,
    })),
    deadlines: deadlines.map((task) => ({
      id: task.id,
      title: task.title,
      projectId: task.projectId,
      projectTitle: task.project.title,
      dueDate: task.dueDate,
      status: task.status,
    })),
    recentFeedbacks: recentFeedbacks.map((feedback) => {
      const technicalAverage = average(feedback.technicalScores.map((score) => score.score));
      const maturityAverage = average(feedback.maturityScores.map((score) => score.score));

      return {
        id: feedback.id,
        title: feedback.title,
        studentName:
          feedback.student.displayName ??
          getFullName(feedback.student.user.firstName, feedback.student.user.lastName),
        projectTitle: feedback.project?.title ?? null,
        createdAt: feedback.createdAt,
        globalScore: calculateGlobalScore(technicalAverage, maturityAverage),
      };
    }),
  };
}

export type AdminDashboardData = {
  adminName: string;
  kpis: {
    totalStudents: number;
    pendingValidation: number;
    activeProjects: number;
    pendingApplications: number;
    partnerCompanies: number;
    deliverablesToReview: number;
  };
  pendingStudents: Array<{
    id: string;
    displayName: string;
    email: string;
    level: StudentLevel;
    status: AcademicValidationStatus;
  }>;
  pendingReviewDeliverables: Array<{
    id: string;
    title: string;
    projectId: string;
    projectTitle: string;
    submittedAt: Date | null;
    status: DeliverableStatus;
  }>;
  recentFeedbacks: Array<{
    id: string;
    title: string | null;
    studentName: string;
    projectTitle: string | null;
    evaluatorName: string | null;
    createdAt: Date;
    globalScore: number;
  }>;
  lowScoreAlerts: Array<{
    id: string;
    studentName: string;
    projectTitle: string | null;
    technicalAverage: number;
    maturityAverage: number;
    globalScore: number;
    createdAt: Date;
    severity: "high" | "medium";
  }>;
  alerts: string[];
};

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const actor = await requireRole(UserRole.ADMIN, "/dashboard/admin");
  const [
    totalStudents,
    pendingValidation,
    activeProjects,
    pendingApplications,
    partnerCompanies,
    deliverablesToReview,
    pendingStudents,
    pendingReviewDeliverables,
    recentFeedbacks,
    lowScoreFeedbacks,
  ] = await prisma.$transaction([
    prisma.studentProfile.count(),
    prisma.studentProfile.count({
      where: {
        academicValidationStatus: {
          in: [AcademicValidationStatus.PENDING, AcademicValidationStatus.IN_REVIEW],
        },
      },
    }),
    prisma.project.count({
      where: {
        status: {
          in: [ProjectStatus.OPEN, ProjectStatus.IN_PROGRESS],
        },
      },
    }),
    prisma.projectApplication.count({
      where: {
        status: ApplicationStatus.PENDING,
      },
    }),
    prisma.company.count({
      where: {
        isActive: true,
      },
    }),
    prisma.deliverable.count({
      where: {
        status: {
          in: [DeliverableStatus.SUBMITTED, DeliverableStatus.IN_REVIEW],
        },
      },
    }),
    prisma.studentProfile.findMany({
      where: {
        academicValidationStatus: {
          in: [AcademicValidationStatus.PENDING, AcademicValidationStatus.IN_REVIEW],
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      take: ADMIN_PENDING_STUDENT_LIMIT,
      select: {
        id: true,
        displayName: true,
        level: true,
        academicValidationStatus: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
    prisma.deliverable.findMany({
      where: {
        status: {
          in: [DeliverableStatus.SUBMITTED, DeliverableStatus.IN_REVIEW],
        },
      },
      orderBy: [
        {
          submittedAt: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: ADMIN_REVIEW_LIMIT,
      select: {
        id: true,
        title: true,
        projectId: true,
        submittedAt: true,
        status: true,
        project: {
          select: {
            title: true,
          },
        },
      },
    }),
    prisma.feedback.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: ADMIN_FEEDBACK_LIMIT,
      select: {
        id: true,
        title: true,
        createdAt: true,
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
    prisma.feedback.findMany({
      where: {
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
      },
      orderBy: {
        createdAt: "desc",
      },
      take: ADMIN_ALERT_LIMIT,
      select: {
        id: true,
        createdAt: true,
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
  ]);

  const alerts = [
    pendingValidation > 0
      ? `${pendingValidation} étudiant(s) attendent une validation académique.`
      : null,
    deliverablesToReview > 0
      ? `${deliverablesToReview} livrable(s) demandent une review.`
      : null,
    lowScoreFeedbacks.length > 0
      ? `${lowScoreFeedbacks.length} feedback(s) récents montrent un signal faible à surveiller.`
      : null,
  ].filter((value): value is string => Boolean(value));

  return {
    adminName: actor.firstName,
    kpis: {
      totalStudents,
      pendingValidation,
      activeProjects,
      pendingApplications,
      partnerCompanies,
      deliverablesToReview,
    },
    pendingStudents: pendingStudents.map((student) => ({
      id: student.id,
      displayName:
        student.displayName ??
        getFullName(student.user.firstName, student.user.lastName) ??
        student.user.email,
      email: student.user.email,
      level: student.level,
      status: student.academicValidationStatus,
    })),
    pendingReviewDeliverables: pendingReviewDeliverables.map((deliverable) => ({
      id: deliverable.id,
      title: deliverable.title,
      projectId: deliverable.projectId,
      projectTitle: deliverable.project.title,
      submittedAt: deliverable.submittedAt,
      status: deliverable.status,
    })),
    recentFeedbacks: recentFeedbacks.map((feedback) => {
      const technicalAverage = average(feedback.technicalScores.map((score) => score.score));
      const maturityAverage = average(feedback.maturityScores.map((score) => score.score));

      return {
        id: feedback.id,
        title: feedback.title,
        studentName:
          feedback.student.displayName ??
          getFullName(feedback.student.user.firstName, feedback.student.user.lastName),
        projectTitle: feedback.project?.title ?? null,
        evaluatorName: feedback.author
          ? getFullName(feedback.author.firstName, feedback.author.lastName)
          : null,
        createdAt: feedback.createdAt,
        globalScore: calculateGlobalScore(technicalAverage, maturityAverage),
      };
    }),
    lowScoreAlerts: buildAdminLowScoreAlerts(
      lowScoreFeedbacks.map((feedback) => {
        const technicalAverage = average(feedback.technicalScores.map((score) => score.score));
        const maturityAverage = average(feedback.maturityScores.map((score) => score.score));

        return {
          id: feedback.id,
          studentName:
            feedback.student.displayName ??
            getFullName(feedback.student.user.firstName, feedback.student.user.lastName),
          projectTitle: feedback.project?.title ?? null,
          technicalAverage,
          maturityAverage,
          globalScore: calculateGlobalScore(technicalAverage, maturityAverage),
          createdAt: feedback.createdAt,
        };
      }),
    ),
    alerts,
  };
}

export function getStudentDeadlineUrgency(dueDate: Date | null, now = new Date()) {
  if (!dueDate) {
    return "normal";
  }

  if (dueDate.getTime() < now.getTime()) {
    return "overdue";
  }

  return isNearDeadline(dueDate, now) ? "warning" : "normal";
}
