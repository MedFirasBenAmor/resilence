import Link from "next/link";
import { connection } from "next/server";
import { UserRole } from "@prisma/client";
import { listManagedProjects } from "@/actions/projectActions";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFilters } from "@/components/projects/project-filters";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

type SupervisorProjectsPageProps = {
  searchParams?: Promise<{
    query?: string;
    type?: "FICTIONAL" | "REAL" | "";
    level?: "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "";
    status?: "DRAFT" | "OPEN" | "CLOSED" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED" | "";
    skills?: string;
    page?: string;
  }>;
};

function buildManagedProjectsHref(base: string, page: number, query: URLSearchParams) {
  const next = new URLSearchParams(query);

  if (page <= 1) {
    next.delete("page");
  } else {
    next.set("page", String(page));
  }

  const value = next.toString();
  return value ? `${base}?${value}` : base;
}

export default async function SupervisorProjectsPage({
  searchParams,
}: SupervisorProjectsPageProps) {
  await connection();

  const rawParams = await searchParams;
  const result = await listManagedProjects(UserRole.SUPERVISOR, {
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
    <DashboardShell className="max-w-7xl">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Pilotage superviseur"
          title="Projets supervises"
          description="Suivez les projets qui vous sont assignés, les candidatures à relire et les rooms à superviser sans modifier la gouvernance du portefeuille."
        />

        <ProjectFilters
          actionPath="/dashboard/supervisor/projects"
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
            <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {result.items.map((project) => (
                <ProjectCard
                  key={project.id}
                  mode="supervisorReview"
                  href={`/dashboard/supervisor/projects/${project.id}`}
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

            <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
              <p className="text-sm text-slate-600">{result.totalItems} projet(s)</p>
              <div className="flex gap-3">
                <Link
                  href={buildManagedProjectsHref("/dashboard/supervisor/projects", result.page - 1, query)}
                  aria-disabled={result.page <= 1}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 aria-disabled:pointer-events-none aria-disabled:opacity-40"
                >
                  Precedent
                </Link>
                <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
                  Page {result.page} / {Math.max(result.totalPages, 1)}
                </span>
                <Link
                  href={buildManagedProjectsHref("/dashboard/supervisor/projects", result.page + 1, query)}
                  aria-disabled={result.page >= result.totalPages}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 aria-disabled:pointer-events-none aria-disabled:opacity-40"
                >
                  Suivant
                </Link>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            title="Aucun projet sous votre supervision"
            description="Les projets qui vous sont assignés apparaîtront ici. Vous pouvez aussi élargir les filtres."
          />
        )}
      </div>
    </DashboardShell>
  );
}
