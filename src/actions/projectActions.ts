import {
  AcademicValidationStatus,
  Prisma,
  ProjectStatus,
  ProjectType,
  StudentLevel,
  UserRole,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  canActorAdministerProjects,
  canActorManageProject,
  canActorViewProjectAsCompany,
  canStudentSeeAvailableProjects,
} from "@/lib/project-access";
import {
  matchesStudentProjectFilters,
  sortStudentProjects,
  type StudentProjectApplicationFilter,
  type StudentProjectAvailability,
  type StudentProjectSort,
} from "@/lib/project-discovery";
import { requireAuth, requireRole } from "@/lib/rbac";
import {
  normalizeProjectSkills,
  projectFiltersSchema,
  projectIdSchema,
  projectMutationSchema,
} from "@/lib/validators/project";

const PROJECT_PAGE_SIZE = 6;
const APPLICATION_PAGE_SIZE = 8;

export type ProjectActionState = {
  success: string | null;
  error: string | null;
};

export const DEFAULT_PROJECT_ACTION_STATE: ProjectActionState = {
  success: null,
  error: null,
};

export type ProjectCompanyOption = {
  id: string;
  name: string;
};

export type ProjectListItem = {
  id: string;
  title: string;
  summary: string;
  description: string | null;
  type: ProjectType;
  status: ProjectStatus;
  targetLevel: StudentLevel;
  companyName: string | null;
  supervisorName: string | null;
  requiredSkills: string[];
  capacity: number | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  applicationStatus: string | null;
  isMember: boolean;
  applicationCount: number;
  activeMemberCount: number;
};

export type ProjectListResult = {
  items: ProjectListItem[];
  page: number;
  totalPages: number;
  totalItems: number;
  filters: {
    search: string;
    type: ProjectType | "";
    level: StudentLevel | "";
    status: ProjectStatus | "";
    skills: string;
    availability: StudentProjectAvailability;
    applicationStatus: StudentProjectApplicationFilter;
    sort: StudentProjectSort;
  };
  viewerLevel: StudentLevel | null;
  validationStatus: AcademicValidationStatus | null;
};

export type ProjectDetail = {
  id: string;
  title: string;
  summary: string;
  description: string | null;
  requiredSkills: string[];
  type: ProjectType;
  status: ProjectStatus;
  targetLevel: StudentLevel;
  companyId: string | null;
  companyName: string | null;
  supervisorName: string | null;
  createdByName: string;
  capacity: number | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  studentApplication: {
    id: string;
    status: string;
    motivation: string | null;
    createdAt: Date;
  } | null;
  studentMembership: {
    id: string;
    isActive: boolean;
    startedAt: Date;
  } | null;
};

export type ProjectApplicationRow = {
  id: string;
  status: string;
  motivation: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentLevel: StudentLevel;
  validationStatus: AcademicValidationStatus;
};

export type ProjectApplicationsResult = {
  items: ProjectApplicationRow[];
  page: number;
  totalPages: number;
  totalItems: number;
};

type NormalizedProjectFilters = {
  search: string;
  type: ProjectType | "";
  level: StudentLevel | "";
  status: ProjectStatus | "";
  skills: string;
  availability: StudentProjectAvailability;
  applicationStatus: StudentProjectApplicationFilter;
  sort: StudentProjectSort;
  page: number;
};

type ProjectActorContext = {
  id: string;
  role: UserRole;
  isActive: boolean;
  companyId: string | null;
  supervisorProfileId: string | null;
};

type ProjectFiltersParams = {
  query?: string;
  search?: string;
  type?: ProjectType | "";
  level?: StudentLevel | "";
  status?: ProjectStatus | "";
  skills?: string;
  availability?: StudentProjectAvailability;
  applicationStatus?: StudentProjectApplicationFilter;
  sort?: StudentProjectSort;
  page?: number | string;
};

function formatActionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "Cette opération entre en conflit avec des données déjà existantes.";
    }

    if (error.code === "P2003") {
      return "La relation demandee est invalide.";
    }

    return "La base de données a refusé cette opération.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur inattendue est survenue.";
}

async function getProjectActorContext(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
      supervisorProfile: {
        select: {
          id: true,
        },
      },
      companyProfile: {
        select: {
          companyId: true,
        },
      },
    },
  }) satisfies Promise<{
    id: string;
    role: UserRole;
    isActive: boolean;
    supervisorProfile: { id: string } | null;
    companyProfile: { companyId: string } | null;
  } | null>;
}

async function requireProjectActorContext(userId: string) {
  const actor = await getProjectActorContext(userId);

  if (!actor) {
    throw new Error("Utilisateur introuvable.");
  }

  return {
    id: actor.id,
    role: actor.role,
    isActive: actor.isActive,
    supervisorProfileId: actor.supervisorProfile?.id ?? null,
    companyId: actor.companyProfile?.companyId ?? null,
  } satisfies ProjectActorContext;
}

function buildProjectWhere(
  filters: NormalizedProjectFilters,
  scope: "student" | "supervisor" | "admin",
  options?: {
    studentLevel?: StudentLevel | null;
    supervisorUserId?: string;
  },
): Prisma.ProjectWhereInput {
  const where: Prisma.ProjectWhereInput = {
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.level ? { targetLevel: filters.level } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.skills
      ? {
          requiredSkills: {
            has: filters.skills.trim(),
          },
        }
      : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { summary: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
            { company: { name: { contains: filters.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  if (scope === "student") {
    return {
      ...where,
      status: ProjectStatus.OPEN,
      ...(filters.level ? { targetLevel: filters.level } : {}),
    };
  }

  if (scope === "supervisor") {
    return {
      ...where,
      supervisor: {
        userId: options?.supervisorUserId,
      },
    };
  }

  return where;
}

function mapProjectListItem(
  project: {
    id: string;
    title: string;
    summary: string;
    description: string | null;
    type: ProjectType;
    status: ProjectStatus;
    targetLevel: StudentLevel;
    capacity: number | null;
    requiredSkills: string[];
    startDate: Date | null;
    endDate: Date | null;
    createdAt: Date;
    company: { name: string } | null;
    supervisor: { user: { firstName: string; lastName: string } } | null;
    applications?: { status: string }[];
    memberships?: { id: string }[];
    _count?: {
      applications: number;
      memberships: number;
    };
  },
) {
  return {
    id: project.id,
    title: project.title,
    summary: project.summary,
    description: project.description,
    type: project.type,
    status: project.status,
    targetLevel: project.targetLevel,
    companyName: project.company?.name ?? null,
    supervisorName: project.supervisor
      ? `${project.supervisor.user.firstName} ${project.supervisor.user.lastName}`.trim()
      : null,
    requiredSkills: project.requiredSkills,
    capacity: project.capacity,
    startDate: project.startDate,
    endDate: project.endDate,
    createdAt: project.createdAt,
    applicationStatus: project.applications?.[0]?.status ?? null,
    isMember: Boolean(project.memberships?.length),
    applicationCount: project._count?.applications ?? 0,
    activeMemberCount: project._count?.memberships ?? 0,
  } satisfies ProjectListItem;
}

async function requireManagedProject(
  actor: ProjectActorContext,
  projectId: string,
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      status: true,
      companyId: true,
      supervisor: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!project) {
    throw new Error("Projet introuvable.");
  }

  const canManage = canActorManageProject(actor, {
    id: project.id,
    status: project.status,
    companyId: project.companyId,
    supervisorUserId: project.supervisor?.userId ?? null,
  });

  if (!canManage) {
    throw new Error("Vous ne pouvez gérer que les projets qui vous sont assignés.");
  }

  return project;
}

function parseProjectFormData(formData: FormData) {
  return projectMutationSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    type: formData.get("type"),
    status: formData.get("status"),
    targetLevel: formData.get("targetLevel"),
    companyId: formData.get("companyId"),
    capacity: formData.get("capacity"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    requiredSkillsInput: formData.get("requiredSkillsInput"),
  });
}

function normalizeProjectFilters(
  parsed: ReturnType<typeof projectFiltersSchema.parse>,
) {
  return {
    search: parsed.search || parsed.query || "",
    type: parsed.type ?? "",
    level: parsed.level ?? "",
    status: parsed.status ?? "",
    skills: parsed.skills ?? "",
    availability: parsed.availability ?? "",
    applicationStatus: parsed.applicationStatus ?? "",
    sort: parsed.sort ?? "RECENT",
    page: parsed.page,
  } satisfies NormalizedProjectFilters;
}

function toOptionalDate(value: string | undefined) {
  return value ? new Date(value) : null;
}

export async function listProjectCompanyOptions() {
  await requireRole(UserRole.ADMIN, "/dashboard/admin/projects/new");

  const companies = await prisma.company.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    },
  });

  return companies satisfies ProjectCompanyOption[];
}

export async function createProjectAction(
  _: ProjectActionState,
  formData: FormData,
) {
  "use server";

  try {
    const actor = await requireRole(UserRole.ADMIN, "/dashboard/admin/projects/new");
    const parsed = parseProjectFormData(formData);

    if (!parsed.success) {
      return {
        success: null,
        error: parsed.error.issues[0]?.message ?? "Projet invalide.",
      } satisfies ProjectActionState;
    }

    await prisma.project.create({
      data: {
        title: parsed.data.title,
        summary: parsed.data.summary,
        description: parsed.data.description,
        requiredSkills: normalizeProjectSkills(parsed.data.requiredSkillsInput ?? ""),
        type: parsed.data.type,
        status: parsed.data.status,
        targetLevel: parsed.data.targetLevel,
        companyId: parsed.data.companyId || null,
        supervisorId: null,
        createdById: actor.id,
        capacity: parsed.data.capacity,
        startDate: toOptionalDate(parsed.data.startDate),
        endDate: toOptionalDate(parsed.data.endDate),
      },
    });

    revalidatePath("/dashboard/admin/projects/new");
    revalidatePath("/dashboard/admin/projects");

    return {
      success: "Projet créé avec succès.",
      error: null,
    } satisfies ProjectActionState;
  } catch (error) {
    return {
      success: null,
      error: formatActionError(error),
    } satisfies ProjectActionState;
  }
}

export async function updateProjectAction(
  _: ProjectActionState,
  formData: FormData,
) {
  "use server";

  try {
    const actor = await requireRole(UserRole.ADMIN, "/dashboard/admin/projects");
    const actorContext = await requireProjectActorContext(actor.id);
    const projectId = projectIdSchema.safeParse({
      id: formData.get("projectId"),
    });

    if (!projectId.success) {
      return {
        success: null,
        error: projectId.error.issues[0]?.message ?? "Projet invalide.",
      } satisfies ProjectActionState;
    }

    if (!canActorAdministerProjects(actorContext)) {
      return {
        success: null,
        error: "Seul un administrateur peut modifier un projet.",
      } satisfies ProjectActionState;
    }

    const parsed = parseProjectFormData(formData);

    if (!parsed.success) {
      return {
        success: null,
        error: parsed.error.issues[0]?.message ?? "Projet invalide.",
      } satisfies ProjectActionState;
    }

    await prisma.project.update({
      where: { id: projectId.data.id },
      data: {
        title: parsed.data.title,
        summary: parsed.data.summary,
        description: parsed.data.description,
        requiredSkills: normalizeProjectSkills(parsed.data.requiredSkillsInput ?? ""),
        type: parsed.data.type,
        status: parsed.data.status,
        targetLevel: parsed.data.targetLevel,
        companyId: parsed.data.companyId || null,
        capacity: parsed.data.capacity,
        startDate: toOptionalDate(parsed.data.startDate),
        endDate: toOptionalDate(parsed.data.endDate),
      },
    });

    revalidatePath("/dashboard/admin/projects");
    revalidatePath(`/dashboard/admin/projects/${projectId.data.id}`);
    revalidatePath(`/dashboard/student/projects/${projectId.data.id}`);

    return {
      success: "Projet mis a jour.",
      error: null,
    } satisfies ProjectActionState;
  } catch (error) {
    return {
      success: null,
      error: formatActionError(error),
    } satisfies ProjectActionState;
  }
}

export async function listAvailableProjectsForStudent(
  rawFilters: ProjectFiltersParams,
) {
  const actor = await requireRole(UserRole.STUDENT, "/dashboard/student/projects");
  const parsedFilters = normalizeProjectFilters(projectFiltersSchema.parse(rawFilters));

  const student = await prisma.studentProfile.findUnique({
    where: { userId: actor.id },
    select: {
      id: true,
      level: true,
      academicValidationStatus: true,
    },
  });

  if (!student) {
    return {
      items: [],
      page: parsedFilters.page,
      totalPages: 0,
      totalItems: 0,
      filters: parsedFilters,
      viewerLevel: null,
      validationStatus: null,
    } satisfies ProjectListResult;
  }

  if (!canStudentSeeAvailableProjects(student.academicValidationStatus)) {
    return {
      items: [],
      page: parsedFilters.page,
      totalPages: 0,
      totalItems: 0,
      filters: parsedFilters,
      viewerLevel: student.level,
      validationStatus: student.academicValidationStatus,
    } satisfies ProjectListResult;
  }

  const where = buildProjectWhere(parsedFilters, "student", {
    studentLevel: student.level,
  });
  const projects = await prisma.project.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      summary: true,
      description: true,
      type: true,
      status: true,
      targetLevel: true,
      capacity: true,
      requiredSkills: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      company: {
        select: {
          name: true,
        },
      },
      supervisor: {
        select: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      applications: {
        where: { studentId: student.id },
        select: {
          status: true,
        },
      },
      memberships: {
        where: {
          studentId: student.id,
          isActive: true,
        },
        select: {
          id: true,
        },
      },
      _count: {
        select: {
          applications: true,
          memberships: true,
        },
      },
    },
  });

  const filteredProjects = sortStudentProjects(
    projects.map(mapProjectListItem).filter((project) =>
      matchesStudentProjectFilters(project, parsedFilters),
    ),
    parsedFilters.sort,
  );
  const totalItems = filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PROJECT_PAGE_SIZE));
  const safePage = Math.min(parsedFilters.page, totalPages);
  const skip = (safePage - 1) * PROJECT_PAGE_SIZE;
  const pagedProjects = filteredProjects.slice(skip, skip + PROJECT_PAGE_SIZE);

  return {
    items: pagedProjects,
    page: safePage,
    totalPages,
    totalItems,
    filters: parsedFilters,
    viewerLevel: student.level,
    validationStatus: student.academicValidationStatus,
  } satisfies ProjectListResult;
}

export async function listManagedProjects(
  role: UserRole,
  rawFilters: ProjectFiltersParams,
) {
  const actor = await requireRole(role, role === UserRole.ADMIN
    ? "/dashboard/admin/projects"
    : "/dashboard/supervisor/projects");
  const parsedFilters = normalizeProjectFilters(projectFiltersSchema.parse(rawFilters));
  const skip = (parsedFilters.page - 1) * PROJECT_PAGE_SIZE;
  const where = buildProjectWhere(
    parsedFilters,
    role === UserRole.ADMIN ? "admin" : "supervisor",
    {
      supervisorUserId: actor.id,
    },
  );

  const [projects, totalItems] = await prisma.$transaction([
    prisma.project.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: PROJECT_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        summary: true,
        description: true,
        type: true,
        status: true,
        targetLevel: true,
        capacity: true,
        requiredSkills: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        company: {
          select: {
            name: true,
          },
        },
        supervisor: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            applications: true,
            memberships: true,
          },
        },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return {
    items: projects.map(mapProjectListItem),
    page: parsedFilters.page,
    totalPages: Math.ceil(totalItems / PROJECT_PAGE_SIZE),
    totalItems,
    filters: parsedFilters,
    viewerLevel: null,
    validationStatus: null,
  } satisfies ProjectListResult;
}

export async function getProjectDetails(projectId: string) {
  const actor = await requireAuth("/dashboard");
  const actorContext = await requireProjectActorContext(actor.id);
  const parsed = projectIdSchema.safeParse({ id: projectId });

  if (!parsed.success) {
    redirect("/forbidden");
  }

  const student = actor.role === UserRole.STUDENT
    ? await prisma.studentProfile.findUnique({
        where: { userId: actor.id },
        select: {
          id: true,
          level: true,
          academicValidationStatus: true,
        },
      })
    : null;

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      title: true,
      summary: true,
      description: true,
      requiredSkills: true,
      type: true,
      status: true,
      targetLevel: true,
      companyId: true,
      capacity: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      updatedAt: true,
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
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      applications: student
        ? {
            where: { studentId: student.id },
            select: {
              id: true,
              status: true,
              motivation: true,
              createdAt: true,
            },
          }
        : false,
      memberships: student
        ? {
            where: { studentId: student.id },
            select: {
              id: true,
              isActive: true,
              startedAt: true,
            },
          }
        : false,
    },
  });

  if (!project) {
    redirect("/forbidden");
  }

  if (actor.role === UserRole.STUDENT) {
    if (!student || !canStudentSeeAvailableProjects(student.academicValidationStatus)) {
      redirect("/forbidden");
    }

    const canViewProject =
      project.status === ProjectStatus.OPEN;
    const hasApplication = Array.isArray(project.applications) && project.applications.length > 0;
    const hasMembership = Array.isArray(project.memberships) && project.memberships.length > 0;

    if (!canViewProject && !hasApplication && !hasMembership) {
      redirect("/forbidden");
    }
  } else if (actor.role === UserRole.COMPANY) {
    if (
      !canActorViewProjectAsCompany(actorContext, {
        id: project.id,
        status: project.status,
        companyId: project.companyId,
        supervisorUserId: project.supervisor?.userId ?? null,
      })
    ) {
      redirect("/forbidden");
    }
  } else if (
    actor.role === UserRole.ADMIN ||
    actor.role === UserRole.SUPERVISOR
  ) {
    if (
      !canActorManageProject(actorContext, {
        id: project.id,
        status: project.status,
        companyId: project.companyId,
        supervisorUserId: project.supervisor?.userId ?? null,
      })
    ) {
      redirect("/forbidden");
    }
  } else {
    redirect("/forbidden");
  }

  return {
    id: project.id,
    title: project.title,
    summary: project.summary,
    description: project.description,
    requiredSkills: project.requiredSkills,
    type: project.type,
    status: project.status,
    targetLevel: project.targetLevel,
    companyId: project.companyId,
    companyName: project.company?.name ?? null,
    supervisorName: project.supervisor
      ? `${project.supervisor.user.firstName} ${project.supervisor.user.lastName}`.trim()
      : null,
    createdByName: `${project.createdBy.firstName} ${project.createdBy.lastName}`.trim(),
    capacity: project.capacity,
    startDate: project.startDate,
    endDate: project.endDate,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    studentApplication:
      Array.isArray(project.applications) && project.applications[0]
        ? {
            id: project.applications[0].id,
            status: project.applications[0].status,
            motivation: project.applications[0].motivation,
            createdAt: project.applications[0].createdAt,
          }
        : null,
    studentMembership: Array.isArray(project.memberships)
      ? project.memberships[0] ?? null
      : null,
  } satisfies ProjectDetail;
}

export async function listApplicationsForProject(
  projectId: string,
  page = 1,
) {
  const actor = await requireRole(
    [UserRole.ADMIN, UserRole.SUPERVISOR],
    "/dashboard/supervisor/projects",
  );
  const actorContext = await requireProjectActorContext(actor.id);
  const project = await requireManagedProject(actorContext, projectId);
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * APPLICATION_PAGE_SIZE;

  const where: Prisma.ProjectApplicationWhereInput = {
    projectId: project.id,
  };

  const [applications, totalItems] = await prisma.$transaction([
    prisma.projectApplication.findMany({
      where,
      skip,
      take: APPLICATION_PAGE_SIZE,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        status: true,
        motivation: true,
        createdAt: true,
        reviewedAt: true,
        student: {
          select: {
            id: true,
            level: true,
            academicValidationStatus: true,
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
      },
    }),
    prisma.projectApplication.count({ where }),
  ]);

  return {
    items: applications.map((application) => ({
      id: application.id,
      status: application.status,
      motivation: application.motivation,
      createdAt: application.createdAt,
      reviewedAt: application.reviewedAt,
      studentId: application.student.id,
      studentName:
        application.student.displayName ??
        `${application.student.user.firstName} ${application.student.user.lastName}`.trim(),
      studentEmail: application.student.user.email,
      studentLevel: application.student.level,
      validationStatus: application.student.academicValidationStatus,
    })),
    page: safePage,
    totalPages: Math.ceil(totalItems / APPLICATION_PAGE_SIZE),
    totalItems,
  } satisfies ProjectApplicationsResult;
}
