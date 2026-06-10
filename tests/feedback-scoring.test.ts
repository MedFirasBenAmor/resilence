import test from "node:test";
import assert from "node:assert/strict";
import { Prisma, UserRole } from "@prisma/client";
import {
  canAdminListFeedback,
  canEvaluateProjectMember,
  canViewFeedback,
  canViewStudentProgress,
} from "@/lib/feedback-access";
import { sanitizeFeedbackActionError } from "@/lib/feedback-errors";
import {
  calculateGlobalScore,
  calculateMaturityAverage,
  calculateTechnicalAverage,
  requireCommentForLowScore,
  validateScoreRange,
} from "@/lib/scoring";
import {
  adminFeedbackFiltersSchema,
  projectEvaluationFormSchema,
} from "@/lib/validators/scoring";

const projectContext = {
  projectId: "project-1",
  supervisorUserId: "supervisor-1",
  membershipIsActive: true,
  studentUserId: "student-1",
};

test("superviseur peut evaluer un etudiant membre de son projet", () => {
  const allowed = canEvaluateProjectMember(
    {
      id: "supervisor-1",
      role: UserRole.SUPERVISOR,
      isActive: true,
    },
    projectContext,
  );

  assert.equal(allowed, true);
});

test("superviseur ne peut pas evaluer un etudiant hors projet", () => {
  const denied = canEvaluateProjectMember(
    {
      id: "supervisor-1",
      role: UserRole.SUPERVISOR,
      isActive: true,
    },
    {
      ...projectContext,
      membershipIsActive: false,
    },
  );

  assert.equal(denied, false);
});

test("superviseur non proprietaire du projet est refuse", () => {
  const denied = canEvaluateProjectMember(
    {
      id: "supervisor-2",
      role: UserRole.SUPERVISOR,
      isActive: true,
    },
    projectContext,
  );

  assert.equal(denied, false);
});

test("admin peut consulter les feedbacks", () => {
  const allowed = canAdminListFeedback({
    id: "admin-1",
    role: UserRole.ADMIN,
    isActive: true,
  });

  assert.equal(allowed, true);
});

test("etudiant peut voir ses propres scores", () => {
  const allowed = canViewStudentProgress(
    {
      id: "student-1",
      role: UserRole.STUDENT,
      isActive: true,
    },
    "student-1",
  );

  assert.equal(allowed, true);
});

test("etudiant ne peut pas voir les scores d'un autre etudiant", () => {
  const denied = canViewStudentProgress(
    {
      id: "student-1",
      role: UserRole.STUDENT,
      isActive: true,
    },
    "student-2",
  );

  assert.equal(denied, false);
});

test("etudiant ne peut pas creer un feedback superviseur", () => {
  const denied = canEvaluateProjectMember(
    {
      id: "student-1",
      role: UserRole.STUDENT,
      isActive: true,
    },
    projectContext,
  );

  assert.equal(denied, false);
});

test("score inferieur a 1 refuse", () => {
  assert.equal(validateScoreRange(0), false);
});

test("score superieur a 5 refuse", () => {
  assert.equal(validateScoreRange(6), false);
});

test("score faible sans commentaire est refuse", () => {
  assert.equal(requireCommentForLowScore([4, 2, 3], ""), false);
  assert.equal(requireCommentForLowScore([4, 2, 3], "Commentaire detaille suffisant"), true);
});

test("moyenne technique calculee correctement", () => {
  assert.equal(calculateTechnicalAverage([4, 3, 5, 4, 2]), 3.6);
});

test("moyenne maturite calculee correctement", () => {
  assert.equal(calculateMaturityAverage([5, 4, 4, 3, 4]), 4);
});

test("score global calcule correctement", () => {
  assert.equal(calculateGlobalScore(3.6, 4), 3.8);
});

test("feedback est lie a un projet et a un evaluateur via le payload valide", () => {
  const parsed = projectEvaluationFormSchema.safeParse({
    projectId: "550e8400-e29b-41d4-a716-446655440000",
    membershipId: "550e8400-e29b-41d4-a716-446655440001",
    deliverableId: "",
    title: "Bonne tenue du sprint",
    comment: "Execution solide, communication claire et marge de progression bien identifiee.",
    code_quality: "4",
    problem_solving: "4",
    technical_autonomy: "3",
    documentation: "4",
    delivery_quality: "4",
    communication: "5",
    reliability: "4",
    teamwork: "4",
    deadline_respect: "4",
    initiative: "4",
  });

  assert.equal(parsed.success, true);

  if (parsed.success) {
    assert.equal(parsed.data.projectId, "550e8400-e29b-41d4-a716-446655440000");
    assert.equal(parsed.data.membershipId, "550e8400-e29b-41d4-a716-446655440001");
  }
});

test("non membre projet ne peut pas etre evalue", () => {
  const denied = canEvaluateProjectMember(
    {
      id: "admin-1",
      role: UserRole.ADMIN,
      isActive: true,
    },
    {
      ...projectContext,
      membershipIsActive: false,
    },
  );

  assert.equal(denied, false);
});

test("erreurs Prisma sanities", () => {
  const duplicate = new Prisma.PrismaClientKnownRequestError(
    "Unique constraint failed",
    {
      code: "P2002",
      clientVersion: "test",
    },
  );

  assert.equal(
    sanitizeFeedbackActionError(duplicate),
    "Cette évaluation entre en conflit avec des données déjà existantes.",
  );
});

test("canViewFeedback limite bien l'acces etudiant", () => {
  const allowed = canViewFeedback(
    {
      id: "student-1",
      role: UserRole.STUDENT,
      isActive: true,
    },
    projectContext,
  );
  const denied = canViewFeedback(
    {
      id: "student-2",
      role: UserRole.STUDENT,
      isActive: true,
    },
    projectContext,
  );

  assert.equal(allowed, true);
  assert.equal(denied, false);
});

test("filtres admin valides", () => {
  const parsed = adminFeedbackFiltersSchema.safeParse({
    projectId: "",
    studentId: "",
    evaluatorId: "",
    query: "ops hub",
    lowScoreOnly: "true",
    dateFrom: "2026-05-01",
    dateTo: "2026-05-31",
    page: 2,
  });

  assert.equal(parsed.success, true);
});
