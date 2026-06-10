import { UserRole } from "@prisma/client";

export type NavigationItem = {
  label: string;
  href: string;
  match?: "exact" | "prefix";
  includePrefixes?: string[];
  excludePrefixes?: string[];
  activeTest?: (pathname: string) => boolean;
};

export const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: "Espace étudiant",
  SUPERVISOR: "Espace superviseur",
  COMPANY: "Espace entreprise",
  ADMIN: "Pilotage admin",
};

export function getNavigationForRole(role: UserRole): NavigationItem[] {
  if (role === UserRole.STUDENT) {
    return [
      { label: "Tableau de bord", href: "/dashboard/student", match: "exact" },
      { label: "Profil", href: "/dashboard/student/profile", match: "prefix" },
      { label: "Projets", href: "/dashboard/student/projects", match: "prefix" },
      { label: "Progression", href: "/dashboard/student/progress", match: "prefix" },
      { label: "Portfolio", href: "/dashboard/student/portfolio", match: "prefix" },
    ];
  }

  if (role === UserRole.SUPERVISOR) {
    return [
      { label: "Tableau de bord", href: "/dashboard/supervisor", match: "exact" },
      {
        label: "Projets",
        href: "/dashboard/supervisor/projects",
        match: "prefix",
        activeTest: (pathname) =>
          pathname === "/dashboard/supervisor/projects" ||
          (/^\/dashboard\/supervisor\/projects\/[^/]+$/.test(pathname) &&
            !pathname.endsWith("/evaluate")),
      },
      {
        label: "Évaluations",
        href: "/dashboard/supervisor/projects",
        activeTest: (pathname) =>
          /^\/dashboard\/supervisor\/projects\/[^/]+\/evaluate$/.test(pathname),
      },
    ];
  }

  if (role === UserRole.ADMIN) {
    return [
      { label: "Tableau de bord", href: "/dashboard/admin", match: "exact" },
      { label: "Étudiants", href: "/dashboard/admin/students", match: "prefix" },
      { label: "Projets", href: "/dashboard/admin/projects", match: "prefix" },
      { label: "Demandes entreprises", href: "/dashboard/admin/project-requests", match: "prefix" },
      { label: "Feedback", href: "/dashboard/admin/feedback", match: "prefix" },
      { label: "Accès", href: "/dashboard/admin/access", match: "prefix" },
      { label: "Audit", href: "/dashboard/admin/audit", match: "prefix" },
    ];
  }

  return [
    { label: "Tableau de bord", href: "/dashboard/company", match: "exact" },
    { label: "Demandes de projets", href: "/dashboard/company/project-requests", match: "prefix" },
  ];
}

export function isNavigationItemActive(pathname: string, item: NavigationItem) {
  if (item.activeTest) {
    return item.activeTest(pathname);
  }

  if (item.excludePrefixes?.some((prefix) => pathname.startsWith(prefix))) {
    return false;
  }

  if (item.includePrefixes?.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  if (item.match === "exact") {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function getPageTitleFromPath(pathname: string) {
  const mappings = [
    { prefix: "/dashboard/student/profile", title: "Profil étudiant" },
    { prefix: "/dashboard/student/projects", title: "Projets et candidatures" },
    { prefix: "/dashboard/student/progress", title: "Progression" },
    { prefix: "/dashboard/student/portfolio", title: "Portfolio et attestations" },
    { prefix: "/dashboard/notifications", title: "Notifications" },
    { prefix: "/dashboard/student", title: "Tableau de bord étudiant" },
    { prefix: "/dashboard/supervisor/projects", title: "Pilotage projet" },
    { prefix: "/dashboard/supervisor", title: "Tableau de bord superviseur" },
    { prefix: "/dashboard/admin/projects/new", title: "Créer un projet" },
    { prefix: "/dashboard/admin/students", title: "Validation des étudiants" },
    { prefix: "/dashboard/admin/project-requests", title: "Demandes entreprises" },
    { prefix: "/dashboard/admin/projects", title: "Gestion des projets" },
    { prefix: "/dashboard/admin/feedback", title: "Feedback et scoring" },
    { prefix: "/dashboard/admin/access", title: "Accès et invitations" },
    { prefix: "/dashboard/admin/audit", title: "Journal d'audit" },
    { prefix: "/dashboard/admin", title: "Tableau de bord admin" },
    { prefix: "/dashboard/company/project-requests", title: "Demandes de projets" },
    { prefix: "/dashboard/company", title: "Espace entreprise" },
    { prefix: "/dashboard/projects", title: "Room projet" },
  ];

  return mappings.find((item) => pathname.startsWith(item.prefix))?.title ?? "Tableau de bord";
}
