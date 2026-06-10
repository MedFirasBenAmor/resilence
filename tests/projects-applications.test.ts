import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  AcademicValidationStatus,
  ApplicationStatus,
  ProjectStatus,
  ProjectType,
  StudentLevel,
  UserRole,
} from "@prisma/client";
import {
  canActorAdministerProjects,
  canActorViewProjectAsCompany,
  canActorManageProject,
  canApplyToProject,
  canReviewProjectApplications,
  canTransitionApplicationStatus,
  canWithdrawApplication,
} from "@/lib/project-access";
import {
  getAvailablePlaces,
  hasActiveStudentProjectFilters,
  matchesStudentProjectFilters,
  sortStudentProjects,
} from "@/lib/project-discovery";
import { resolveProjectCardSecondaryCta } from "@/components/projects/project-card";
import {
  applicationDecisionSchema,
  normalizeProjectSkills,
  projectApplicationSchema,
  projectFiltersSchema,
  projectMutationSchema,
} from "@/lib/validators/project";

test("etudiant valide peut candidater a un projet ouvert compatible", () => {
  const decision = canApplyToProject({
    validationStatus: AcademicValidationStatus.VALIDATED,
    studentLevel: StudentLevel.LEVEL_2,
    projectStatus: ProjectStatus.OPEN,
    projectTargetLevel: StudentLevel.LEVEL_2,
    existingApplicationStatus: null,
    existingMembership: false,
  });

  assert.equal(decision.allowed, true);
});

test("etudiant non valide est refuse cote serveur", () => {
  const decision = canApplyToProject({
    validationStatus: AcademicValidationStatus.PENDING,
    studentLevel: StudentLevel.LEVEL_1,
    projectStatus: ProjectStatus.OPEN,
    projectTargetLevel: StudentLevel.LEVEL_1,
    existingApplicationStatus: null,
    existingMembership: false,
  });

  assert.equal(decision.allowed, false);
});

test("candidature dupliquee est refusee", () => {
  const decision = canApplyToProject({
    validationStatus: AcademicValidationStatus.VALIDATED,
    studentLevel: StudentLevel.LEVEL_1,
    projectStatus: ProjectStatus.OPEN,
    projectTargetLevel: StudentLevel.LEVEL_1,
    existingApplicationStatus: ApplicationStatus.PENDING,
    existingMembership: false,
  });

  assert.equal(decision.allowed, false);
});

test("projet closed refuse une candidature", () => {
  const decision = canApplyToProject({
    validationStatus: AcademicValidationStatus.VALIDATED,
    studentLevel: StudentLevel.LEVEL_3,
    projectStatus: ProjectStatus.CLOSED,
    projectTargetLevel: StudentLevel.LEVEL_3,
    existingApplicationStatus: null,
    existingMembership: false,
  });

  assert.equal(decision.allowed, false);
});

test("projet archived refuse une candidature", () => {
  const decision = canApplyToProject({
    validationStatus: AcademicValidationStatus.VALIDATED,
    studentLevel: StudentLevel.LEVEL_3,
    projectStatus: ProjectStatus.ARCHIVED,
    projectTargetLevel: StudentLevel.LEVEL_3,
    existingApplicationStatus: null,
    existingMembership: false,
  });

  assert.equal(decision.allowed, false);
});

test("retrait candidature pending autorise", () => {
  const decision = canWithdrawApplication(
    "student-user-1",
    "student-user-1",
    ApplicationStatus.PENDING,
  );

  assert.equal(decision.allowed, true);
});

test("retrait candidature accepted refuse", () => {
  const decision = canWithdrawApplication(
    "student-user-1",
    "student-user-1",
    ApplicationStatus.ACCEPTED,
  );

  assert.equal(decision.allowed, false);
});

test("acceptation cree un membership exactement une fois", () => {
  const decision = canTransitionApplicationStatus(
    ApplicationStatus.PENDING,
    ApplicationStatus.ACCEPTED,
    false,
    1,
    3,
  );

  assert.equal(decision.allowed, true);
  assert.equal(decision.createMembership, true);

  const duplicateMembership = canTransitionApplicationStatus(
    ApplicationStatus.PENDING,
    ApplicationStatus.ACCEPTED,
    true,
    1,
    3,
  );

  assert.equal(duplicateMembership.allowed, false);
});

test("acceptation repetee d'une candidature deja acceptee est refusee", () => {
  const decision = canTransitionApplicationStatus(
    ApplicationStatus.ACCEPTED,
    ApplicationStatus.ACCEPTED,
    true,
    1,
    3,
  );

  assert.equal(decision.allowed, false);
});

test("rejet ne cree pas de membership", () => {
  const decision = canTransitionApplicationStatus(
    ApplicationStatus.PENDING,
    ApplicationStatus.REJECTED,
    false,
    2,
    3,
  );

  assert.equal(decision.allowed, true);
  assert.equal(decision.createMembership, false);
});

test("acceptation est refusee lorsque la capacite du projet est atteinte", () => {
  const decision = canTransitionApplicationStatus(
    ApplicationStatus.PENDING,
    ApplicationStatus.ACCEPTED,
    false,
    3,
    3,
  );

  assert.equal(decision.allowed, false);
});

test("superviseur non proprietaire ne peut pas modifier un projet", () => {
  const decision = canActorManageProject(
    {
      id: "supervisor-user-1",
      role: UserRole.SUPERVISOR,
      isActive: true,
    },
    {
      id: "project-1",
      status: ProjectStatus.OPEN,
      companyId: null,
      supervisorUserId: "supervisor-user-2",
    },
  );

  assert.equal(decision, false);
});

test("admin peut gerer tous les projets", () => {
  const decision = canActorManageProject(
    {
      id: "admin-user-1",
      role: UserRole.ADMIN,
      isActive: true,
    },
    {
      id: "project-1",
      status: ProjectStatus.ARCHIVED,
      companyId: "company-1",
      supervisorUserId: "supervisor-user-2",
    },
  );

  assert.equal(decision, true);
});

test("superviseur assigne conserve la supervision lecture et evaluation de son projet", () => {
  const decision = canActorManageProject(
    {
      id: "supervisor-user-1",
      role: UserRole.SUPERVISOR,
      isActive: true,
    },
    {
      id: "project-1",
      status: ProjectStatus.IN_PROGRESS,
      companyId: "company-1",
      supervisorUserId: "supervisor-user-1",
    },
  );

  assert.equal(decision, true);
});

test("seul admin peut administrer le CRUD projet", () => {
  assert.equal(
    canActorAdministerProjects({
      id: "admin-user-1",
      role: UserRole.ADMIN,
      isActive: true,
    }),
    true,
  );

  assert.equal(
    canActorAdministerProjects({
      id: "supervisor-user-1",
      role: UserRole.SUPERVISOR,
      isActive: true,
    }),
    false,
  );
});

test("superviseur assigne peut toujours revoir les candidatures d'un projet supervise", () => {
  const allowed = canReviewProjectApplications(
    {
      id: "supervisor-user-1",
      role: UserRole.SUPERVISOR,
      isActive: true,
    },
    {
      id: "project-1",
      status: ProjectStatus.OPEN,
      companyId: "company-1",
      supervisorUserId: "supervisor-user-1",
    },
  );

  assert.equal(allowed, true);
});

test("superviseur non assigne ne peut pas revoir les candidatures", () => {
  const allowed = canReviewProjectApplications(
    {
      id: "supervisor-user-2",
      role: UserRole.SUPERVISOR,
      isActive: true,
    },
    {
      id: "project-1",
      status: ProjectStatus.OPEN,
      companyId: "company-1",
      supervisorUserId: "supervisor-user-1",
    },
  );

  assert.equal(allowed, false);
});

test("entreprise ne voit que ses propres projets", () => {
  const allowed = canActorViewProjectAsCompany(
    {
      id: "company-user-1",
      role: UserRole.COMPANY,
      isActive: true,
      companyId: "company-1",
    },
    {
      id: "project-1",
      status: ProjectStatus.OPEN,
      companyId: "company-1",
      supervisorUserId: "supervisor-user-1",
    },
  );
  const denied = canActorViewProjectAsCompany(
    {
      id: "company-user-1",
      role: UserRole.COMPANY,
      isActive: true,
      companyId: "company-1",
    },
    {
      id: "project-2",
      status: ProjectStatus.OPEN,
      companyId: "company-2",
      supervisorUserId: "supervisor-user-1",
    },
  );

  assert.equal(allowed, true);
  assert.equal(denied, false);
});

test("validation zod creation projet et filtres", () => {
  const project = projectMutationSchema.safeParse({
    title: "Refonte du portail d'alternance",
    summary: "Projet reel pour redesign, instrumentation analytics et amelioration du funnel candidature.",
    description:
      "L'equipe doit refondre le portail d'alternance, clarifier les parcours, instrumenter les evenements critiques et ameliorer la conversion sur les candidatures entreprises.",
    type: ProjectType.REAL,
    status: ProjectStatus.OPEN,
    targetLevel: StudentLevel.LEVEL_2,
    companyId: "550e8400-e29b-41d4-a716-446655440000",
    capacity: 4,
    startDate: "2026-05-10",
    endDate: "2026-07-10",
    requiredSkillsInput: "Next.js, Prisma, PostgreSQL",
  });

  const application = projectApplicationSchema.safeParse({
    projectId: "550e8400-e29b-41d4-a716-446655440000",
    motivation:
      "Je veux contribuer a un projet reel oriente produit et renforcer mon execution full-stack en environnement encadre.",
  });

  const decision = applicationDecisionSchema.safeParse({
    applicationId: "550e8400-e29b-41d4-a716-446655440001",
    status: ApplicationStatus.ACCEPTED,
  });

  const filters = projectFiltersSchema.safeParse({
    query: "portail",
    type: ProjectType.REAL,
    level: StudentLevel.LEVEL_2,
    status: ProjectStatus.OPEN,
    skills: "Prisma",
    page: 2,
  });

  assert.equal(project.success, true);
  assert.equal(application.success, true);
  assert.equal(decision.success, true);
  assert.equal(filters.success, true);
  assert.deepEqual(normalizeProjectSkills("Next.js, Prisma\nPrisma"), [
    "Next.js",
    "Prisma",
  ]);
});

test("search filters projects across text and skills", () => {
  const filters = projectFiltersSchema.parse({
    search: "prisma support",
    type: "",
    level: "",
    skills: "",
    availability: "",
    applicationStatus: "",
    sort: "RECENT",
    page: 1,
  });

  const match = matchesStudentProjectFilters(
    {
      id: "project-1",
      title: "Campus Helpdesk Portal",
      summary: "Portail support et tickets.",
      description: "Modelisation du support, tickets et Prisma.",
      type: ProjectType.FICTIONAL,
      targetLevel: StudentLevel.LEVEL_1,
      requiredSkills: ["Next.js", "Prisma"],
      capacity: 3,
      createdAt: new Date("2026-06-01T00:00:00.000Z"),
      endDate: null,
      applicationStatus: null,
      isMember: false,
      activeMemberCount: 1,
    },
    filters,
  );

  assert.equal(match, true);
});

test("level filter works", () => {
  const filters = projectFiltersSchema.parse({
    search: "",
    type: "",
    level: StudentLevel.LEVEL_2,
    skills: "",
    availability: "",
    applicationStatus: "",
    sort: "RECENT",
    page: 1,
  });

  assert.equal(
    matchesStudentProjectFilters(
      {
        id: "project-2",
        title: "Ops Hub",
        summary: "Projet reel",
        description: null,
        type: ProjectType.REAL,
        targetLevel: StudentLevel.LEVEL_2,
        requiredSkills: [],
        capacity: 3,
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        endDate: null,
        applicationStatus: null,
        isMember: false,
        activeMemberCount: 0,
      },
      filters,
    ),
    true,
  );
  assert.equal(
    matchesStudentProjectFilters(
      {
        id: "project-3",
        title: "Autonomy Mission",
        summary: "Projet avance",
        description: null,
        type: ProjectType.REAL,
        targetLevel: StudentLevel.LEVEL_3,
        requiredSkills: [],
        capacity: 2,
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        endDate: null,
        applicationStatus: null,
        isMember: false,
        activeMemberCount: 0,
      },
      filters,
    ),
    false,
  );
});

test("type filter works", () => {
  const filters = projectFiltersSchema.parse({
    search: "",
    type: ProjectType.REAL,
    level: "",
    skills: "",
    availability: "",
    applicationStatus: "",
    sort: "RECENT",
    page: 1,
  });

  assert.equal(
    matchesStudentProjectFilters(
      {
        id: "project-real",
        title: "Real project",
        summary: "Entreprise",
        description: null,
        type: ProjectType.REAL,
        targetLevel: StudentLevel.LEVEL_2,
        requiredSkills: [],
        capacity: 2,
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        endDate: null,
        applicationStatus: null,
        isMember: false,
        activeMemberCount: 0,
      },
      filters,
    ),
    true,
  );
});

test("availability filter works", () => {
  const filters = projectFiltersSchema.parse({
    search: "",
    type: "",
    level: "",
    skills: "",
    availability: "AVAILABLE",
    applicationStatus: "",
    sort: "RECENT",
    page: 1,
  });

  assert.equal(
    matchesStudentProjectFilters(
      {
        id: "available",
        title: "Available",
        summary: "Open seats",
        description: null,
        type: ProjectType.FICTIONAL,
        targetLevel: StudentLevel.LEVEL_1,
        requiredSkills: [],
        capacity: 3,
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        endDate: null,
        applicationStatus: null,
        isMember: false,
        activeMemberCount: 1,
      },
      filters,
    ),
    true,
  );
  assert.equal(
    matchesStudentProjectFilters(
      {
        id: "full",
        title: "Full",
        summary: "No seats",
        description: null,
        type: ProjectType.FICTIONAL,
        targetLevel: StudentLevel.LEVEL_1,
        requiredSkills: [],
        capacity: 2,
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        endDate: null,
        applicationStatus: null,
        isMember: false,
        activeMemberCount: 2,
      },
      filters,
    ),
    false,
  );
  assert.equal(getAvailablePlaces({ capacity: 2, activeMemberCount: 2 }), 0);
});

test("combined filters work", () => {
  const filters = projectFiltersSchema.parse({
    search: "ops",
    type: ProjectType.REAL,
    level: StudentLevel.LEVEL_2,
    skills: "prisma",
    availability: "AVAILABLE",
    applicationStatus: "NOT_APPLIED",
    sort: "RECENT",
    page: 1,
  });

  assert.equal(
    matchesStudentProjectFilters(
      {
        id: "combo-pass",
        title: "Ops hub",
        summary: "Back-office ops",
        description: "Projet avec Prisma et dashboard.",
        type: ProjectType.REAL,
        targetLevel: StudentLevel.LEVEL_2,
        requiredSkills: ["Prisma", "Next.js"],
        capacity: 4,
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        endDate: null,
        applicationStatus: null,
        isMember: false,
        activeMemberCount: 1,
      },
      filters,
    ),
    true,
  );
  assert.equal(
    matchesStudentProjectFilters(
      {
        id: "combo-fail",
        title: "Ops hub",
        summary: "Back-office ops",
        description: "Projet avec Prisma et dashboard.",
        type: ProjectType.REAL,
        targetLevel: StudentLevel.LEVEL_2,
        requiredSkills: ["Prisma", "Next.js"],
        capacity: 4,
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        endDate: null,
        applicationStatus: ApplicationStatus.PENDING,
        isMember: false,
        activeMemberCount: 1,
      },
      filters,
    ),
    false,
  );
});

test("sorting works for deadline and available places", () => {
  const projects = [
    {
      id: "a",
      title: "A",
      summary: "",
      description: null,
      type: ProjectType.REAL,
      targetLevel: StudentLevel.LEVEL_2,
      requiredSkills: [],
      capacity: 2,
      createdAt: new Date("2026-06-01T00:00:00.000Z"),
      endDate: new Date("2026-08-01T00:00:00.000Z"),
      applicationStatus: null,
      isMember: false,
      activeMemberCount: 2,
    },
    {
      id: "b",
      title: "B",
      summary: "",
      description: null,
      type: ProjectType.FICTIONAL,
      targetLevel: StudentLevel.LEVEL_1,
      requiredSkills: [],
      capacity: 5,
      createdAt: new Date("2026-06-02T00:00:00.000Z"),
      endDate: new Date("2026-07-01T00:00:00.000Z"),
      applicationStatus: null,
      isMember: false,
      activeMemberCount: 1,
    },
  ];

  assert.deepEqual(sortStudentProjects(projects, "DEADLINE").map((project) => project.id), ["b", "a"]);
  assert.deepEqual(sortStudentProjects(projects, "AVAILABLE_PLACES").map((project) => project.id), ["b", "a"]);
});

test("active filters and reset link are visible in the student catalogue filters", () => {
  assert.equal(
    hasActiveStudentProjectFilters({
      search: "cyber",
      type: ProjectType.REAL,
      level: StudentLevel.LEVEL_2,
      skills: "Prisma",
      availability: "AVAILABLE",
      applicationStatus: "NOT_APPLIED",
      sort: "DEADLINE",
      page: 2,
    }),
    true,
  );
});

test("student project filters expose only real controls", async () => {
  const source = await readFile("src/components/projects/project-filters.tsx", "utf8");

  assert.match(source, /name="search"/);
  assert.match(source, /name="skills"/);
  assert.match(source, /name="type"/);
  assert.match(source, /name="level"/);
  assert.match(source, /name="availability"/);
  assert.match(source, /name="applicationStatus"/);
  assert.match(source, /name="sort"/);
  assert.match(source, /Réinitialiser les filtres/);
  assert.doesNotMatch(source, /Pertinence/);
  assert.doesNotMatch(source, /Domaine \/ categorie/);
});

test("student project card shows application CTA states", () => {
  assert.equal(
    resolveProjectCardSecondaryCta("studentDiscovery", {
      applicationStatus: null,
      isMember: false,
    }),
    "Candidater",
  );
  assert.equal(
    resolveProjectCardSecondaryCta("studentDiscovery", {
      applicationStatus: ApplicationStatus.PENDING,
      isMember: false,
    }),
    "Déjà candidaté",
  );
  assert.equal(
    resolveProjectCardSecondaryCta("studentDiscovery", {
      applicationStatus: ApplicationStatus.ACCEPTED,
      isMember: false,
    }),
    "Projet rejoint",
  );
});

test("admin supervisor and company project cards never expose candidater", () => {
  assert.equal(
    resolveProjectCardSecondaryCta("adminManagement", {
      applicationStatus: null,
      isMember: false,
    }),
    "Gérer le projet",
  );
  assert.equal(
    resolveProjectCardSecondaryCta("supervisorReview", {
      applicationStatus: null,
      isMember: false,
    }),
    "Superviser",
  );
  assert.equal(
    resolveProjectCardSecondaryCta("companyOverview", {
      applicationStatus: null,
      isMember: false,
    }),
    "Suivi entreprise",
  );
});

test("direct application action remains server-protected for student role only", async () => {
  const source = await readFile("src/actions/applicationActions.ts", "utf8");

  assert.match(source, /requireRole\(UserRole\.STUDENT, "\/dashboard\/student\/projects"\)/);
});
