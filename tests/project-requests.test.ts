import test from "node:test";
import assert from "node:assert/strict";
import { AuditAction, CompanyProjectRequestStatus, StudentLevel, UserRole } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import { AUDIT_ACTION_LABELS } from "@/lib/admin-audit";
import { getNavigationForRole } from "@/lib/navigation";
import {
  buildProjectRequestConversionDefaults,
  canManageCompanyProjectRequests,
  canMoveProjectRequestToStatus,
  canSubmitCompanyProjectRequest,
  canViewCompanyProjectRequest,
} from "@/lib/project-request-access";
import {
  companyProjectRequestSchema,
  convertProjectRequestSchema,
} from "@/lib/validators/project-request";
import { canActorAdministerProjects } from "@/lib/project-access";

test("company can submit a valid project request payload", () => {
  const parsed = companyProjectRequestSchema.safeParse({
    title: "Portail ESG pour suivi des emissions",
    shortSummary:
      "Construire un espace de pilotage ESG pour centraliser les preuves, les KPIs et les exports de reporting.",
    domain: "ESG reporting",
    desiredLevel: StudentLevel.LEVEL_2,
    expectedTeamSize: 4,
    estimatedDuration: "8 semaines",
    specBookUrl: "https://example.com/specs/esg-reporting.pdf",
  });

  assert.equal(parsed.success, true);
});

test("company cannot publish a project directly via project CRUD permissions", () => {
  assert.equal(
    canActorAdministerProjects({
      id: "company-user-1",
      role: UserRole.COMPANY,
      isActive: true,
    }),
    false,
  );
});

test("company can only view its own project requests", () => {
  const actor = {
    id: "company-user-1",
    role: UserRole.COMPANY,
    isActive: true,
    companyId: "company-1",
  } as const;

  assert.equal(
    canViewCompanyProjectRequest(actor, {
      companyId: "company-1",
      status: CompanyProjectRequestStatus.SUBMITTED,
    }),
    true,
  );
  assert.equal(
    canViewCompanyProjectRequest(actor, {
      companyId: "company-2",
      status: CompanyProjectRequestStatus.SUBMITTED,
    }),
    false,
  );
});

test("admin can review approve reject and convert request states", () => {
  assert.equal(
    canManageCompanyProjectRequests({
      id: "admin-user-1",
      role: UserRole.ADMIN,
      isActive: true,
    }),
    true,
  );
  assert.equal(
    canMoveProjectRequestToStatus(
      CompanyProjectRequestStatus.SUBMITTED,
      CompanyProjectRequestStatus.UNDER_REVIEW,
    ),
    true,
  );
  assert.equal(
    canMoveProjectRequestToStatus(
      CompanyProjectRequestStatus.UNDER_REVIEW,
      CompanyProjectRequestStatus.APPROVED,
    ),
    true,
  );
  assert.equal(
    canMoveProjectRequestToStatus(
      CompanyProjectRequestStatus.UNDER_REVIEW,
      CompanyProjectRequestStatus.REJECTED,
    ),
    true,
  );
  assert.equal(
    canMoveProjectRequestToStatus(
      CompanyProjectRequestStatus.APPROVED,
      CompanyProjectRequestStatus.CONVERTED,
    ),
    true,
  );
  assert.equal(
    canMoveProjectRequestToStatus(
      CompanyProjectRequestStatus.SUBMITTED,
      CompanyProjectRequestStatus.CONVERTED,
    ),
    false,
  );
});

test("conversion payload is prefilled and valid for admin project creation", () => {
  const defaults = buildProjectRequestConversionDefaults({
    title: "CRM logistique B2B",
    shortSummary: "Industrialiser le suivi des opportunites et de la relation client pour une equipe ops.",
    domain: "CRM, Ops, Logistique",
    desiredLevel: StudentLevel.LEVEL_2,
    expectedTeamSize: 3,
    estimatedDuration: "6 semaines",
    specBookUrl: "https://example.com/specs/crm-logistique.pdf",
  });

  const parsed = convertProjectRequestSchema.safeParse({
    requestId: "550e8400-e29b-41d4-a716-446655440000",
    title: defaults.title,
    summary: defaults.summary,
    description: defaults.description,
    targetLevel: defaults.targetLevel,
    capacity: defaults.capacity,
    requiredSkillsInput: defaults.requiredSkillsInput,
    startDate: "2026-06-10",
    endDate: "2026-08-01",
  });

  assert.equal(parsed.success, true);
  assert.match(defaults.description, /Cahier des charges MVP/);
});

test("student and supervisor are forbidden from company request permissions", () => {
  assert.equal(
    canSubmitCompanyProjectRequest({
      id: "student-1",
      role: UserRole.STUDENT,
      isActive: true,
      companyId: null,
    }),
    false,
  );
  assert.equal(
    canSubmitCompanyProjectRequest({
      id: "supervisor-1",
      role: UserRole.SUPERVISOR,
      isActive: true,
      companyId: null,
    }),
    false,
  );
  assert.equal(
    canManageCompanyProjectRequests({
      id: "supervisor-1",
      role: UserRole.SUPERVISOR,
      isActive: true,
    }),
    false,
  );
});

test("company and admin navigation expose the new request routes", () => {
  const companyItems = getNavigationForRole(UserRole.COMPANY);
  const adminItems = getNavigationForRole(UserRole.ADMIN);

  assert.ok(companyItems.find((item) => item.href === "/dashboard/company/project-requests"));
  assert.ok(adminItems.find((item) => item.href === "/dashboard/admin/project-requests"));
});

test("audit logs record the company project request lifecycle", async () => {
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
    actorId: "company-1",
    action: AuditAction.PROJECT_REQUEST_SUBMITTED,
    targetType: "CompanyProjectRequest",
    targetId: "request-1",
  });
  await createAuditLog(writer as never, {
    actorId: "admin-1",
    action: AuditAction.PROJECT_REQUEST_REVIEWED,
    targetType: "CompanyProjectRequest",
    targetId: "request-1",
  });
  await createAuditLog(writer as never, {
    actorId: "admin-1",
    action: AuditAction.PROJECT_REQUEST_APPROVED,
    targetType: "CompanyProjectRequest",
    targetId: "request-1",
  });
  await createAuditLog(writer as never, {
    actorId: "admin-1",
    action: AuditAction.PROJECT_REQUEST_CONVERTED,
    targetType: "CompanyProjectRequest",
    targetId: "request-1",
  });

  assert.deepEqual(
    records.map((record) => record.action),
    [
      AuditAction.PROJECT_REQUEST_SUBMITTED,
      AuditAction.PROJECT_REQUEST_REVIEWED,
      AuditAction.PROJECT_REQUEST_APPROVED,
      AuditAction.PROJECT_REQUEST_CONVERTED,
    ],
  );
  assert.equal(AUDIT_ACTION_LABELS[AuditAction.PROJECT_REQUEST_REJECTED], "Demande de projet rejetée");
});
