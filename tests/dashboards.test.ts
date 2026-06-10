import test from "node:test";
import assert from "node:assert/strict";
import { ProjectStatus, UserRole } from "@prisma/client";
import {
  buildAdminLowScoreAlerts,
  buildDashboardScoreSummary,
  canAccessDashboard,
  hasStudentDashboardContent,
  hasSupervisorDashboardContent,
  selectStudentActiveProjects,
  selectSupervisorManagedProjects,
} from "@/lib/dashboard-helpers";
import { calculateGlobalScore } from "@/lib/scoring";

test("etudiant voit uniquement ses donnees de projet dans la vue dashboard", () => {
  const rows = [
    {
      studentId: "student-1",
      projectId: "project-1",
      title: "API CRM",
      status: ProjectStatus.IN_PROGRESS,
      endDate: null,
      companyName: "NovaCraft",
    },
    {
      studentId: "student-2",
      projectId: "project-2",
      title: "Data Sprint",
      status: ProjectStatus.OPEN,
      endDate: null,
      companyName: "GreenLoop",
    },
  ];

  const result = selectStudentActiveProjects(rows, "student-1");

  assert.equal(result.length, 1);
  assert.equal(result[0]?.projectId, "project-1");
});

test("superviseur voit uniquement ses projets dans la vue dashboard", () => {
  const rows = [
    {
      projectId: "project-1",
      title: "Ops Hub",
      supervisorUserId: "supervisor-1",
      status: ProjectStatus.OPEN,
    },
    {
      projectId: "project-2",
      title: "IA Campus",
      supervisorUserId: "supervisor-2",
      status: ProjectStatus.IN_PROGRESS,
    },
  ];

  const result = selectSupervisorManagedProjects(rows, "supervisor-1");

  assert.equal(result.length, 1);
  assert.equal(result[0]?.projectId, "project-1");
});

test("admin voit les agregats globaux et les scores faibles remontent", () => {
  const alerts = buildAdminLowScoreAlerts([
    {
      id: "feedback-1",
      studentName: "Sami",
      projectTitle: "Ops Hub",
      technicalAverage: 2.4,
      maturityAverage: 3.2,
      globalScore: 2.8,
      createdAt: new Date("2026-05-01T08:00:00.000Z"),
    },
    {
      id: "feedback-2",
      studentName: "Ines",
      projectTitle: "Cloud Sprint",
      technicalAverage: 4.2,
      maturityAverage: 4.1,
      globalScore: 4.15,
      createdAt: new Date("2026-05-02T08:00:00.000Z"),
    },
  ]);

  assert.equal(alerts.length, 1);
  assert.equal(alerts[0]?.id, "feedback-1");
});

test("mauvais role refuse pour chaque dashboard", () => {
  assert.equal(canAccessDashboard(UserRole.ADMIN, "student"), false);
  assert.equal(canAccessDashboard(UserRole.STUDENT, "supervisor"), false);
  assert.equal(canAccessDashboard(UserRole.SUPERVISOR, "admin"), false);
  assert.equal(canAccessDashboard(UserRole.STUDENT, "student"), true);
});

test("dashboard etudiant sans projet detecte correctement un empty state", () => {
  assert.equal(
    hasStudentDashboardContent({
      activeProjects: [],
      recentApplications: [],
      upcomingDeadlines: [],
      recentDeliverables: [],
      recentFeedbacks: [],
    }),
    false,
  );
});

test("dashboard superviseur sans projet detecte correctement un empty state", () => {
  assert.equal(
    hasSupervisorDashboardContent({
      projects: [],
      pendingReviewDeliverables: [],
      deadlines: [],
      recentFeedbacks: [],
    }),
    false,
  );
});

test("score dashboard reste coherent avec le module scoring", () => {
  const summary = buildDashboardScoreSummary(3.6, 4, 3);

  assert.equal(summary.globalScore, calculateGlobalScore(3.6, 4));
  assert.equal(summary.feedbackCount, 3);
});
