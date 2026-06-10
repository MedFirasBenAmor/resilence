import { ProjectStatus, ProjectType, StudentLevel, UserRole } from "@prisma/client";
import { calculateGlobalScore } from "@/lib/scoring";

export type DashboardRole = "student" | "supervisor" | "admin";

export function canAccessDashboard(actorRole: UserRole, dashboard: DashboardRole) {
  if (dashboard === "student") return actorRole === UserRole.STUDENT;
  if (dashboard === "supervisor") return actorRole === UserRole.SUPERVISOR;
  return actorRole === UserRole.ADMIN;
}

export function buildDashboardScoreSummary(
  technicalAverage: number,
  maturityAverage: number,
  feedbackCount: number,
) {
  const normalizedTechnicalAverage = Number(technicalAverage.toFixed(2));
  const normalizedMaturityAverage = Number(maturityAverage.toFixed(2));

  return {
    technicalAverage: normalizedTechnicalAverage,
    maturityAverage: normalizedMaturityAverage,
    globalScore:
      feedbackCount > 0
        ? calculateGlobalScore(normalizedTechnicalAverage, normalizedMaturityAverage)
        : 0,
    feedbackCount,
  };
}

export type StudentProjectSnapshot = {
  studentId: string;
  projectId: string;
  title: string;
  status: ProjectStatus;
  type: ProjectType;
  targetLevel: StudentLevel;
  endDate: Date | null;
  companyName: string | null;
};

export function selectStudentActiveProjects(
  rows: StudentProjectSnapshot[],
  studentId: string,
) {
  return rows.filter((row) => row.studentId === studentId);
}

export type SupervisorProjectSnapshot = {
  projectId: string;
  title: string;
  supervisorUserId: string | null;
  status: ProjectStatus;
};

export function selectSupervisorManagedProjects(
  rows: SupervisorProjectSnapshot[],
  supervisorUserId: string,
) {
  return rows.filter((row) => row.supervisorUserId === supervisorUserId);
}

export type AdminLowScoreSnapshot = {
  id: string;
  studentName: string;
  projectTitle: string | null;
  technicalAverage: number;
  maturityAverage: number;
  globalScore: number;
  createdAt: Date;
};

export function buildAdminLowScoreAlerts(rows: AdminLowScoreSnapshot[]) {
  return rows
    .filter(
      (row) =>
        row.technicalAverage <= 2.5 ||
        row.maturityAverage <= 2.5 ||
        row.globalScore <= 2.5,
    )
    .map((row) => ({
      ...row,
      severity:
        row.globalScore <= 2 || row.technicalAverage <= 2 || row.maturityAverage <= 2
          ? ("high" as const)
          : ("medium" as const),
    }));
}

export function hasStudentDashboardContent(data: {
  activeProjects: unknown[];
  recentApplications: unknown[];
  upcomingDeadlines: unknown[];
  recentDeliverables: unknown[];
  recentFeedbacks: unknown[];
}) {
  return (
    data.activeProjects.length > 0 ||
    data.recentApplications.length > 0 ||
    data.upcomingDeadlines.length > 0 ||
    data.recentDeliverables.length > 0 ||
    data.recentFeedbacks.length > 0
  );
}

export function hasSupervisorDashboardContent(data: {
  projects: unknown[];
  pendingReviewDeliverables: unknown[];
  deadlines: unknown[];
  recentFeedbacks: unknown[];
}) {
  return (
    data.projects.length > 0 ||
    data.pendingReviewDeliverables.length > 0 ||
    data.deadlines.length > 0 ||
    data.recentFeedbacks.length > 0
  );
}
