import Link from "next/link";
import { connection } from "next/server";
import { UserRole } from "@prisma/client";
import { listManagedProjects } from "@/actions/projectActions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFilters } from "@/components/projects/project-filters";

export const dynamic = "force-dynamic";

type AdminProjectsPageProps = {
  searchParams?: Promise<{
    query?: string;
    type?: "FICTIONAL" | "REAL" | "";
    level?: "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "";
    status?: "DRAFT" | "OPEN" | "CLOSED" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED" | "";
    skills?: string;
    page?: string;
  }>;
};

function buildAdminProjectsHref(page: number, query: URLSearchParams) {
  const next = new URLSearchParams(query);

  if (page <= 1) {
    next.delete("page");
  } else {
    next.set("page", String(page));
  }

  const value = next.toString();
  return value ? `/dashboard/admin/projects?${value}` : "/dashboard/admin/projects";
}

export default async function AdminProjectsPage({
  searchParams,
}: AdminProjectsPageProps) {
  await connection();

  const rawParams = await searchParams;
  const result = await listManagedProjects(UserRole.ADMIN, {
    query: rawParams?.query ?? "",
    type: rawParams?.type ?? "",
    level: rawParams?.level ?? "",
    status: rawParams?.status ?? "",
    skills: rawParams?.skills ?? "",
    page: rawParams?.page ?? 1,
  });
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(result.filters)) {
    if (value) {
      query.set(key, String(value));
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Portefeuille"
          title="Tous les projets"
          description="Vue transverse sur l'ensemble du portefeuille : projets réels, pédagogiques, en cours, ouverts ou à surveiller."
          actions={
            <Link href="/dashboard/admin/projects/new" className="app-button-primary">
              Nouveau projet
            </Link>
          }
          className="app-fade-in-up"
        />

        <ProjectFilters
          actionPath="/dashboard/admin/projects"
          values={{
            search: result.filters.search ?? "",
            type: result.filters.type ?? "",
            level: result.filters.level ?? "",
            status: result.filters.status ?? "",
            skills: result.filters.skills ?? "",
          }}
          resultCount={result.totalItems}
          showStatus
        />

        {result.items.length ? (
          <>
            <div className="flex items-center justify-between gap-4 text-sm text-slate-500">
              <p>
                <span className="font-semibold text-slate-900">{result.totalItems}</span> projet(s)
                dans le portefeuille
              </p>
              <p>Lecture globale et priorisation admin</p>
            </div>
            <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {result.items.map((project) => (
                <ProjectCard
                  key={project.id}
                  mode="adminManagement"
                  href={`/dashboard/admin/projects/${project.id}`}
                  title={project.title}
                  summary={project.summary}
                  type={project.type}
                  status={project.status}
                  targetLevel={project.targetLevel}
                  companyName={project.companyName}
                  supervisorName={project.supervisorName}
                  requiredSkills={project.requiredSkills}
                  capacity={project.capacity}
                />
              ))}
            </section>

            <div className="app-panel flex items-center justify-between gap-4 px-6 py-4">
              <p className="text-sm text-slate-600">{result.totalItems} projet(s)</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={buildAdminProjectsHref(result.page - 1, query)}
                  aria-disabled={result.page <= 1}
                  className="app-button-secondary aria-disabled:pointer-events-none aria-disabled:opacity-40"
                >
                  Precedent
                </Link>
                <span className="rounded-xl bg-slate-100/90 px-4 py-2 text-sm text-slate-700">
                  Page {result.page} / {Math.max(result.totalPages, 1)}
                </span>
                <Link
                  href={buildAdminProjectsHref(result.page + 1, query)}
                  aria-disabled={result.page >= result.totalPages}
                  className="app-button-secondary aria-disabled:pointer-events-none aria-disabled:opacity-40"
                >
                  Suivant
                </Link>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            title="Aucun projet"
            description="Aucun projet ne correspond a ces filtres pour le moment."
          />
        )}
      </div>
    </DashboardShell>
  );
}
