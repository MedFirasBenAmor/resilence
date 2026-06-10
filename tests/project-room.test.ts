import test from "node:test";
import assert from "node:assert/strict";
import { DeliverableStatus, Prisma, TaskStatus, UserRole } from "@prisma/client";
import {
  canCommentInProjectRoom,
  canManageProjectTasks,
  canReviewDeliverable,
  canSubmitDeliverable,
  canUpdateProjectTaskStatus,
  canViewProjectRoom,
} from "@/lib/project-room-access";
import { sanitizeProjectRoomActionError } from "@/lib/project-room-errors";
import {
  deliverableReviewSchema,
  deliverableSubmitSchema,
  projectCommentSchema,
  projectTaskMutationSchema,
  projectTaskStatusSchema,
} from "@/lib/validators/project-room";

const projectContext = {
  id: "project-1",
  companyId: "company-1",
  supervisorUserId: "supervisor-user-1",
  hasActiveMembership: true,
};

test("membre projet accede a la room", () => {
  const allowed = canViewProjectRoom(
    {
      id: "student-user-1",
      role: UserRole.STUDENT,
      isActive: true,
    },
    projectContext,
  );

  assert.equal(allowed, true);
});

test("etudiant non membre est refuse", () => {
  const denied = canViewProjectRoom(
    {
      id: "student-user-2",
      role: UserRole.STUDENT,
      isActive: true,
    },
    {
      ...projectContext,
      hasActiveMembership: false,
    },
  );

  assert.equal(denied, false);
});

test("admin accede a toute room", () => {
  const allowed = canViewProjectRoom(
    {
      id: "admin-user-1",
      role: UserRole.ADMIN,
      isActive: true,
    },
    {
      ...projectContext,
      hasActiveMembership: false,
    },
  );

  assert.equal(allowed, true);
});

test("superviseur du projet accede a la room", () => {
  const allowed = canViewProjectRoom(
    {
      id: "supervisor-user-1",
      role: UserRole.SUPERVISOR,
      isActive: true,
    },
    {
      ...projectContext,
      hasActiveMembership: false,
    },
  );

  assert.equal(allowed, true);
});

test("entreprise liee peut voir la room en lecture seule", () => {
  const allowed = canViewProjectRoom(
    {
      id: "company-user-1",
      role: UserRole.COMPANY,
      isActive: true,
      companyId: "company-1",
    },
    {
      ...projectContext,
      hasActiveMembership: false,
    },
  );
  const canComment = canCommentInProjectRoom(
    {
      id: "company-user-1",
      role: UserRole.COMPANY,
      isActive: true,
      companyId: "company-1",
    },
    {
      ...projectContext,
      hasActiveMembership: false,
    },
  );

  assert.equal(allowed, true);
  assert.equal(canComment, false);
});

test("superviseur cree une tache", () => {
  const allowed = canManageProjectTasks(
    {
      id: "supervisor-user-1",
      role: UserRole.SUPERVISOR,
      isActive: true,
    },
    {
      ...projectContext,
      hasActiveMembership: false,
    },
  );

  assert.equal(allowed, true);
});

test("admin peut creer ou modifier une tache", () => {
  const allowed = canManageProjectTasks(
    {
      id: "admin-user-1",
      role: UserRole.ADMIN,
      isActive: true,
    },
    {
      ...projectContext,
      hasActiveMembership: false,
    },
  );

  assert.equal(allowed, true);
});

test("etudiant ne peut pas creer une tache", () => {
  const denied = canManageProjectTasks(
    {
      id: "student-user-1",
      role: UserRole.STUDENT,
      isActive: true,
    },
    projectContext,
  );

  assert.equal(denied, false);
});

test("etudiant membre peut changer le statut d'une tache", () => {
  const allowed = canUpdateProjectTaskStatus(
    {
      id: "student-user-1",
      role: UserRole.STUDENT,
      isActive: true,
    },
    projectContext,
  );

  assert.equal(allowed, true);
});

test("etudiant non membre ne peut pas changer le statut d'une tache", () => {
  const denied = canUpdateProjectTaskStatus(
    {
      id: "student-user-2",
      role: UserRole.STUDENT,
      isActive: true,
    },
    {
      ...projectContext,
      hasActiveMembership: false,
    },
  );

  assert.equal(denied, false);
});

test("etudiant membre peut soumettre un livrable", () => {
  const allowed = canSubmitDeliverable(
    {
      id: "student-user-1",
      role: UserRole.STUDENT,
      isActive: true,
    },
    projectContext,
  );

  assert.equal(allowed, true);
});

test("livrable avec URL invalide est refuse", () => {
  const result = deliverableSubmitSchema.safeParse({
    projectId: "550e8400-e29b-41d4-a716-446655440000",
    taskId: "",
    title: "Sprint review",
    description: "Compte rendu et maquette interactive",
    submissionUrl: "not-a-url",
    repositoryUrl: "",
  });

  assert.equal(result.success, false);
});

test("livrable incomplet est refuse", () => {
  const result = deliverableSubmitSchema.safeParse({
    projectId: "550e8400-e29b-41d4-a716-446655440000",
    taskId: "",
    title: "",
    description: "",
    submissionUrl: "",
    repositoryUrl: "",
  });

  assert.equal(result.success, false);
});

test("superviseur peut reviewer un livrable", () => {
  const allowed = canReviewDeliverable(
    {
      id: "supervisor-user-1",
      role: UserRole.SUPERVISOR,
      isActive: true,
    },
    {
      ...projectContext,
      hasActiveMembership: false,
    },
  );

  assert.equal(allowed, true);
});

test("etudiant ne peut pas reviewer un livrable comme superviseur", () => {
  const denied = canReviewDeliverable(
    {
      id: "student-user-1",
      role: UserRole.STUDENT,
      isActive: true,
    },
    projectContext,
  );

  assert.equal(denied, false);
});

test("entreprise ne peut pas commenter en mode lecture seule", () => {
  const denied = canCommentInProjectRoom(
    {
      id: "company-user-1",
      role: UserRole.COMPANY,
      isActive: true,
      companyId: "company-1",
    },
    {
      ...projectContext,
      hasActiveMembership: false,
    },
  );

  assert.equal(denied, false);
});

test("non membre ne peut pas commenter", () => {
  const denied = canCommentInProjectRoom(
    {
      id: "student-user-2",
      role: UserRole.STUDENT,
      isActive: true,
    },
    {
      ...projectContext,
      hasActiveMembership: false,
    },
  );

  assert.equal(denied, false);
});

test("commentaire vide refuse", () => {
  const result = projectCommentSchema.safeParse({
    projectId: "550e8400-e29b-41d4-a716-446655440000",
    deliverableId: "",
    body: " ",
  });

  assert.equal(result.success, false);
});

test("les erreurs Prisma sont sanitisées", () => {
  const duplicate = new Prisma.PrismaClientKnownRequestError(
    "Unique constraint failed",
    {
      code: "P2002",
      clientVersion: "test",
    },
  );

  assert.equal(
    sanitizeProjectRoomActionError(duplicate),
    "Cette action entre en conflit avec des données déjà existantes.",
  );
});

test("schemas taches et review sont valides", () => {
  const task = projectTaskMutationSchema.safeParse({
    projectId: "550e8400-e29b-41d4-a716-446655440000",
    taskId: "",
    title: "Preparer la demo",
    description: "Consolider la demo utilisateur et la check-list finale.",
    dueDate: "2026-05-10",
    status: TaskStatus.IN_PROGRESS,
  });
  const taskStatus = projectTaskStatusSchema.safeParse({
    projectId: "550e8400-e29b-41d4-a716-446655440000",
    taskId: "550e8400-e29b-41d4-a716-446655440001",
    status: TaskStatus.DONE,
  });
  const review = deliverableReviewSchema.safeParse({
    projectId: "550e8400-e29b-41d4-a716-446655440000",
    deliverableId: "550e8400-e29b-41d4-a716-446655440001",
    status: DeliverableStatus.REVIEWED,
    reviewComment: "Base solide, il reste deux ajustements.",
  });

  assert.equal(task.success, true);
  assert.equal(taskStatus.success, true);
  assert.equal(review.success, true);
});
