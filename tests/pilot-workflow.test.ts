import test from "node:test";
import assert from "node:assert/strict";
import {
  AcademicValidationStatus,
  ApplicationStatus,
  CertificateStatus,
  DeliverableStatus,
  ProjectStatus,
  StudentLevel,
  UserRole,
} from "@prisma/client";
import {
  certificates,
  deliverables,
  feedbacks,
  memberships,
  portfolioItems,
  projectApplications,
  projectTasks,
  seedProjects,
  seedUsers,
  technicalScores,
} from "../prisma/seed-data";
import { canApplyToProject, canTransitionApplicationStatus } from "@/lib/project-access";
import { canViewProjectRoom, canSubmitDeliverable } from "@/lib/project-room-access";
import { canIssueCertificate } from "@/lib/certificate-access";
import { calculateTechnicalAverage } from "@/lib/scoring";

test("pilot workflow chain is coherent for a level-1 student project", () => {
  const student = seedUsers.students.find((entry) => entry.email === "rayan.haddad@demo.resilience.local");
  const project = seedProjects.find((entry) => entry.key === "l1-campus-helpdesk");
  const application = projectApplications.find(
    (entry) => entry.projectKey === "l1-campus-helpdesk" && entry.studentEmail === "rayan.haddad@demo.resilience.local",
  );
  const membership = memberships.find(
    (entry) => entry.projectKey === "l1-campus-helpdesk" && entry.studentEmail === "rayan.haddad@demo.resilience.local",
  );
  const deliverable = deliverables.find(
    (entry) => entry.projectKey === "l1-campus-helpdesk" && entry.studentEmail === "rayan.haddad@demo.resilience.local",
  );
  const feedback = feedbacks.find(
    (entry) => entry.projectKey === "l1-campus-helpdesk" && entry.studentEmail === "rayan.haddad@demo.resilience.local",
  );
  const technical = technicalScores.filter(
    (entry) => entry.projectKey === "l1-campus-helpdesk" && entry.studentEmail === "rayan.haddad@demo.resilience.local",
  );
  const portfolio = portfolioItems.find(
    (entry) => entry.projectKey === "l1-campus-helpdesk" && entry.studentEmail === "rayan.haddad@demo.resilience.local",
  );
  const certificate = certificates.find(
    (entry) => entry.projectKey === "l1-campus-helpdesk" && entry.studentEmail === "rayan.haddad@demo.resilience.local",
  );

  assert.ok(student);
  assert.ok(project);
  assert.ok(application);
  assert.ok(membership);
  assert.ok(deliverable);
  assert.ok(feedback);
  assert.ok(portfolio);
  assert.ok(certificate);
  assert.equal(student?.academicValidationStatus, AcademicValidationStatus.VALIDATED);
  assert.equal(project?.targetLevel, StudentLevel.LEVEL_1);
  assert.equal(project?.status, ProjectStatus.IN_PROGRESS);
  assert.equal(application?.status, ApplicationStatus.ACCEPTED);
  assert.equal(deliverable?.status, DeliverableStatus.APPROVED);
  assert.equal(certificate?.status, CertificateStatus.ISSUED);
  assert.equal(calculateTechnicalAverage(technical.map((entry) => entry.score)), 4);
});

test("pilot scenario rules allow the intended student -> application -> assignment flow", () => {
  const applicationAllowed = canApplyToProject({
    validationStatus: AcademicValidationStatus.VALIDATED,
    studentLevel: StudentLevel.LEVEL_1,
    projectStatus: ProjectStatus.OPEN,
    projectTargetLevel: StudentLevel.LEVEL_1,
    existingApplicationStatus: null,
    existingMembership: false,
  });

  const acceptanceAllowed = canTransitionApplicationStatus(
    ApplicationStatus.PENDING,
    ApplicationStatus.ACCEPTED,
    false,
    2,
    3,
  );

  assert.equal(applicationAllowed.allowed, true);
  assert.equal(acceptanceAllowed.allowed, true);
  assert.equal(acceptanceAllowed.createMembership, true);
});

test("pilot scenario room, deliverable and certificate permissions stay coherent", () => {
  const roomContext = {
    id: "project-l1-1",
    companyId: null,
    supervisorUserId: "supervisor-user-1",
    hasActiveMembership: true,
  };

  assert.equal(
    canViewProjectRoom(
      {
        id: "student-user-1",
        role: UserRole.STUDENT,
        isActive: true,
      },
      roomContext,
    ),
    true,
  );

  assert.equal(
    canSubmitDeliverable(
      {
        id: "student-user-1",
        role: UserRole.STUDENT,
        isActive: true,
      },
      roomContext,
    ),
    true,
  );

  assert.equal(
    canIssueCertificate(
      {
        id: "supervisor-user-1",
        role: UserRole.SUPERVISOR,
        isActive: true,
      },
      {
        membershipExists: true,
        supervisorUserId: "supervisor-user-1",
        studentUserId: "student-user-1",
      },
    ),
    true,
  );
});

test("pilot seed keeps pending room work for active mentoring", () => {
  const activeTask = projectTasks.find(
    (entry) => entry.projectKey === "l1-study-group-scheduler" && entry.studentEmail === "yassine.dridi@demo.resilience.local",
  );
  const pendingApplication = projectApplications.find(
    (entry) => entry.projectKey === "l1-campus-event-checkin" && entry.studentEmail === "hana.bouzid@demo.resilience.local",
  );

  assert.ok(activeTask);
  assert.ok(pendingApplication);
  assert.equal(pendingApplication?.status, ApplicationStatus.PENDING);
});
