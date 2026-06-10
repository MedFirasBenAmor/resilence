import { ApplicationStatus, ProjectType, StudentLevel } from "@prisma/client";

export const studentProjectAvailabilityValues = ["", "AVAILABLE", "FULL"] as const;
export type StudentProjectAvailability = (typeof studentProjectAvailabilityValues)[number];

export const studentProjectApplicationFilterValues = [
  "",
  "NOT_APPLIED",
  ApplicationStatus.PENDING,
  ApplicationStatus.ACCEPTED,
  ApplicationStatus.REJECTED,
] as const;
export type StudentProjectApplicationFilter =
  (typeof studentProjectApplicationFilterValues)[number];

export const studentProjectSortValues = [
  "RECENT",
  "DEADLINE",
  "LEVEL",
  "AVAILABLE_PLACES",
] as const;
export type StudentProjectSort = (typeof studentProjectSortValues)[number];

export type StudentProjectDiscoveryFilters = {
  search: string;
  type: ProjectType | "";
  level: StudentLevel | "";
  skills: string;
  availability: StudentProjectAvailability;
  applicationStatus: StudentProjectApplicationFilter;
  sort: StudentProjectSort;
  page: number;
};

export type StudentDiscoveryProject = {
  id: string;
  title: string;
  summary: string;
  description?: string | null;
  type: ProjectType;
  targetLevel: StudentLevel;
  requiredSkills: string[];
  capacity: number | null;
  createdAt: Date;
  endDate: Date | null;
  applicationStatus: string | null;
  isMember: boolean;
  activeMemberCount: number;
};

export function getAvailablePlaces(project: Pick<StudentDiscoveryProject, "capacity" | "activeMemberCount">) {
  if (typeof project.capacity !== "number") {
    return null;
  }

  return Math.max(project.capacity - project.activeMemberCount, 0);
}

function normalizeSearchTerms(raw: string) {
  return raw
    .trim()
    .toLocaleLowerCase("fr-FR")
    .split(/\s+/)
    .filter(Boolean);
}

function matchesSearch(project: StudentDiscoveryProject, search: string) {
  const terms = normalizeSearchTerms(search);

  if (!terms.length) {
    return true;
  }

  const haystack = [
    project.title,
    project.summary,
    project.description ?? "",
    ...project.requiredSkills,
  ]
    .join(" ")
    .toLocaleLowerCase("fr-FR");

  return terms.every((term) => haystack.includes(term));
}

function matchesSkills(project: StudentDiscoveryProject, skills: string) {
  const terms = normalizeSearchTerms(skills);

  if (!terms.length) {
    return true;
  }

  const normalizedSkills = project.requiredSkills.map((skill) =>
    skill.toLocaleLowerCase("fr-FR"),
  );

  return terms.every((term) =>
    normalizedSkills.some((skill) => skill.includes(term)),
  );
}

function matchesAvailability(
  project: StudentDiscoveryProject,
  availability: StudentProjectAvailability,
) {
  if (!availability) {
    return true;
  }

  const availablePlaces = getAvailablePlaces(project);

  if (availability === "AVAILABLE") {
    return availablePlaces === null || availablePlaces > 0;
  }

  return availablePlaces !== null && availablePlaces === 0;
}

function matchesApplicationStatus(
  project: StudentDiscoveryProject,
  applicationStatus: StudentProjectApplicationFilter,
) {
  if (!applicationStatus) {
    return true;
  }

  if (applicationStatus === "NOT_APPLIED") {
    return !project.applicationStatus && !project.isMember;
  }

  return project.applicationStatus === applicationStatus;
}

export function matchesStudentProjectFilters<T extends StudentDiscoveryProject>(
  project: T,
  filters: StudentProjectDiscoveryFilters,
) {
  if (filters.type && project.type !== filters.type) {
    return false;
  }

  if (filters.level && project.targetLevel !== filters.level) {
    return false;
  }

  if (!matchesSearch(project, filters.search)) {
    return false;
  }

  if (!matchesSkills(project, filters.skills)) {
    return false;
  }

  if (!matchesAvailability(project, filters.availability)) {
    return false;
  }

  if (!matchesApplicationStatus(project, filters.applicationStatus)) {
    return false;
  }

  return true;
}

function getLevelSortValue(level: StudentLevel) {
  if (level === StudentLevel.LEVEL_1) {
    return 1;
  }

  if (level === StudentLevel.LEVEL_2) {
    return 2;
  }

  return 3;
}

export function sortStudentProjects<T extends StudentDiscoveryProject>(
  projects: T[],
  sort: StudentProjectSort,
) {
  const items = [...projects];

  items.sort((left, right) => {
    if (sort === "DEADLINE") {
      const leftValue = left.endDate ? left.endDate.getTime() : Number.MAX_SAFE_INTEGER;
      const rightValue = right.endDate ? right.endDate.getTime() : Number.MAX_SAFE_INTEGER;

      if (leftValue !== rightValue) {
        return leftValue - rightValue;
      }
    }

    if (sort === "LEVEL") {
      const leftValue = getLevelSortValue(left.targetLevel);
      const rightValue = getLevelSortValue(right.targetLevel);

      if (leftValue !== rightValue) {
        return leftValue - rightValue;
      }
    }

    if (sort === "AVAILABLE_PLACES") {
      const leftValue = getAvailablePlaces(left) ?? Number.MAX_SAFE_INTEGER;
      const rightValue = getAvailablePlaces(right) ?? Number.MAX_SAFE_INTEGER;

      if (leftValue !== rightValue) {
        return rightValue - leftValue;
      }
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });

  return items;
}

export function hasActiveStudentProjectFilters(filters: StudentProjectDiscoveryFilters) {
  return Boolean(
    filters.search ||
      filters.type ||
      filters.level ||
      filters.skills ||
      filters.availability ||
      filters.applicationStatus ||
      filters.sort !== "RECENT",
  );
}
