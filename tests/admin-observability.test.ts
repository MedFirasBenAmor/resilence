import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  AuditAction,
  AcademicValidationStatus,
  ApplicationStatus,
  InvitationStatus,
  ProjectStatus,
  StudentLevel,
  UserRole,
} from "@prisma/client";
import { AUDIT_ACTION_LABELS, formatAuditDetails, normalizeAuditLogFilters } from "@/lib/admin-audit";
import { createAuditLog } from "@/lib/audit";
import {
  createRoleInvitationSchema,
  resolveInvitationLifecycleStatus,
} from "@/lib/auth/invitations";
import { canApplyToProject, canTransitionApplicationStatus } from "@/lib/project-access";
import { deliverableSubmitSchema } from "@/lib/validators/project-room";
import { issueCertificateSchema } from "@/lib/validators/certificate";
import { projectEvaluationFormSchema } from "@/lib/validators/scoring";

test("audit helper enregistre une entree exploitable pour la vue admin", async () => {
  const records: Array<Record<string, unknown>> = [];
  const writer = {
    auditLog: {
      async create(input: { data: Record<string, unknown> }) {
        records.push(input.data);
        return input.data;
      },
    },
  };

  await createAuditLog(writer as never, {
    actorId: "admin-1",
    action: AuditAction.APPLICATION_ACCEPTED,
    targetType: "ProjectApplication",
    targetId: "application-1",
    details: {
      projectId: "project-1",
      studentId: "student-1",
    },
  });

  assert.equal(records.length, 1);
  assert.equal(records[0].action, AuditAction.APPLICATION_ACCEPTED);
  assert.equal(records[0].targetType, "ProjectApplication");
  assert.equal(formatAuditDetails(records[0].details as never), "projectId: project-1 | studentId: student-1");
});

test("admin audit filters sont normalises pour la page d'observabilite", () => {
  const filters = normalizeAuditLogFilters({
    action: AuditAction.FEEDBACK_CREATED,
    targetType: "Feedback",
    query: "admin@demo.resilience.local",
    page: "2",
  });

  assert.deepEqual(filters, {
    action: AuditAction.FEEDBACK_CREATED,
    targetType: "Feedback",
    query: "admin@demo.resilience.local",
    page: 2,
  });
});

test("invitation revoke expire lifecycle reste coherent", () => {
  const pending = resolveInvitationLifecycleStatus(
    InvitationStatus.PENDING,
    new Date("2026-06-20T00:00:00.000Z"),
    new Date("2026-06-05T00:00:00.000Z"),
  );
  const expired = resolveInvitationLifecycleStatus(
    InvitationStatus.PENDING,
    new Date("2026-06-01T00:00:00.000Z"),
    new Date("2026-06-05T00:00:00.000Z"),
  );
  const revoked = resolveInvitationLifecycleStatus(
    InvitationStatus.REVOKED,
    new Date("2026-06-20T00:00:00.000Z"),
    new Date("2026-06-05T00:00:00.000Z"),
  );

  assert.equal(pending, InvitationStatus.PENDING);
  assert.equal(expired, "EXPIRED");
  assert.equal(revoked, InvitationStatus.REVOKED);
});

test("migration SQL versionnee couvre l'observabilite MVP", async () => {
  const migrationSql = await readFile(
    "prisma/migrations/20260605_stable_mvp_sprint1/migration.sql",
    "utf8",
  );

  assert.match(migrationSql, /CREATE TABLE "AuditLog"/);
  assert.match(migrationSql, /CREATE TABLE "RoleInvitation"/);
  assert.match(migrationSql, /INVITATION_REVOKED/);
  assert.match(migrationSql, /DELIVERABLE_SUBMITTED/);
  assert.match(migrationSql, /FEEDBACK_CREATED/);
});

test("scenario MVP stable reste coherent de bout en bout", async () => {
  const supervisorInvitation = createRoleInvitationSchema.safeParse({
    email: "supervisor.product@demo.resilience.local",
    role: UserRole.SUPERVISOR,
    companyName: "",
    expiresInDays: 7,
  });
  const companyInvitation = createRoleInvitationSchema.safeParse({
    email: "partner@demo.resilience.local",
    role: UserRole.COMPANY,
    companyName: "NovaCraft",
    expiresInDays: 7,
  });

  assert.equal(supervisorInvitation.success, true);
  assert.equal(companyInvitation.success, true);
  assert.equal(
    resolveInvitationLifecycleStatus(
      InvitationStatus.PENDING,
      new Date("2026-06-12T00:00:00.000Z"),
      new Date("2026-06-05T00:00:00.000Z"),
    ),
    InvitationStatus.PENDING,
  );

  const applicationDecision = canApplyToProject({
    validationStatus: AcademicValidationStatus.VALIDATED,
    studentLevel: StudentLevel.LEVEL_2,
    projectStatus: ProjectStatus.OPEN,
    projectTargetLevel: StudentLevel.LEVEL_2,
    existingApplicationStatus: null,
    existingMembership: false,
  });
  assert.equal(applicationDecision.allowed, true);

  const acceptanceDecision = canTransitionApplicationStatus(
    ApplicationStatus.PENDING,
    ApplicationStatus.ACCEPTED,
    false,
    0,
    1,
  );
  assert.equal(acceptanceDecision.allowed, true);
  assert.equal(acceptanceDecision.createMembership, true);

  const deliverable = deliverableSubmitSchema.safeParse({
    projectId: "550e8400-e29b-41d4-a716-446655440000",
    taskId: "",
    title: "Sprint MVP package",
    description: "Livrable complet avec demo et notes de livraison.",
    submissionUrl: "https://example.com/deliverables/mvp-package",
    repositoryUrl: "https://github.com/example/resilience-platform",
  });
  assert.equal(deliverable.success, true);

  const feedback = projectEvaluationFormSchema.safeParse({
    projectId: "550e8400-e29b-41d4-a716-446655440000",
    membershipId: "550e8400-e29b-41d4-a716-446655440001",
    deliverableId: "",
    title: "Evaluation MVP",
    comment: "Execution fiable et progression nette sur la phase MVP.",
    code_quality: "4",
    problem_solving: "4",
    technical_autonomy: "4",
    documentation: "4",
    delivery_quality: "5",
    communication: "4",
    reliability: "5",
    teamwork: "4",
    deadline_respect: "5",
    initiative: "4",
  });
  assert.equal(feedback.success, true);

  const certificate = issueCertificateSchema.safeParse({
    studentId: "550e8400-e29b-41d4-a716-446655440000",
    projectId: "550e8400-e29b-41d4-a716-446655440001",
    title: "Attestation MVP stable",
    summary: "Contribution verifiee jusqu'au niveau MVP stable.",
  });
  assert.equal(certificate.success, true);

  const auditRecords: Array<Record<string, unknown>> = [];
  const writer = {
    auditLog: {
      async create(input: { data: Record<string, unknown> }) {
        auditRecords.push(input.data);
        return input.data;
      },
    },
  };

  await createAuditLog(writer as never, {
    actorId: "admin-1",
    action: AuditAction.ROLE_APPROVED,
    targetType: "RoleInvitation",
    targetId: "invite-supervisor-1",
  });
  await createAuditLog(writer as never, {
    actorId: "admin-1",
    action: AuditAction.ROLE_APPROVED,
    targetType: "RoleInvitation",
    targetId: "invite-company-1",
  });
  await createAuditLog(writer as never, {
    actorId: "supervisor-1",
    action: AuditAction.APPLICATION_ACCEPTED,
    targetType: "ProjectApplication",
    targetId: "application-1",
  });
  await createAuditLog(writer as never, {
    actorId: "supervisor-1",
    action: AuditAction.MEMBERSHIP_ASSIGNED,
    targetType: "ProjectMembership",
    targetId: "membership-1",
  });
  await createAuditLog(writer as never, {
    actorId: "student-1",
    action: AuditAction.DELIVERABLE_SUBMITTED,
    targetType: "Deliverable",
    targetId: "deliverable-1",
  });
  await createAuditLog(writer as never, {
    actorId: "supervisor-1",
    action: AuditAction.FEEDBACK_CREATED,
    targetType: "Feedback",
    targetId: "feedback-1",
  });
  await createAuditLog(writer as never, {
    actorId: "supervisor-1",
    action: AuditAction.CERTIFICATE_CREATED,
    targetType: "Certificate",
    targetId: "certificate-1",
  });
  await createAuditLog(writer as never, {
    actorId: "company-1",
    action: AuditAction.CERTIFICATE_VERIFIED,
    targetType: "Certificate",
    targetId: "certificate-1",
  });

  assert.deepEqual(
    auditRecords.map((record) => record.action),
    [
      AuditAction.ROLE_APPROVED,
      AuditAction.ROLE_APPROVED,
      AuditAction.APPLICATION_ACCEPTED,
      AuditAction.MEMBERSHIP_ASSIGNED,
      AuditAction.DELIVERABLE_SUBMITTED,
      AuditAction.FEEDBACK_CREATED,
      AuditAction.CERTIFICATE_CREATED,
      AuditAction.CERTIFICATE_VERIFIED,
    ],
  );
  assert.equal(AUDIT_ACTION_LABELS[AuditAction.DELIVERABLE_REVIEWED], "Livrable relu");
});

test("supervisor invitation accepte un companyName absent du FormData", () => {
  const supervisorInvitation = createRoleInvitationSchema.safeParse({
    email: "supervisor.form@demo.resilience.local",
    role: UserRole.SUPERVISOR,
    companyName: null,
    expiresInDays: "7",
  });

  assert.equal(supervisorInvitation.success, true);
});
