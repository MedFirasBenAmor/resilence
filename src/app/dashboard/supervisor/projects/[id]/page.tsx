import { ApplicationStatus } from "@prisma/client";
import { connection } from "next/server";
import {
  getProjectDetails,
  listApplicationsForProject,
} from "@/actions/projectActions";
import { BackButton } from "@/components/navigation/back-button";
import { ApplicationActions } from "@/components/projects/application-actions";
import { ApplicationStatusBadge } from "@/components/projects/application-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectDetails } from "@/components/projects/project-details";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

type SupervisorProjectDetailsPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ page?: string }>;
};

export default async function SupervisorProjectDetailsPage({
  params,
  searchParams,
}: SupervisorProjectDetailsPageProps) {
  await connection();

  const { id } = await params;
  const rawSearchParams = await searchParams;
  const currentPage = rawSearchParams?.page ? Number(rawSearchParams.page) : 1;
  const [project, applications] = await Promise.all([
    getProjectDetails(id),
    listApplicationsForProject(id, currentPage),
  ]);

  return (
    <DashboardShell className="max-w-7xl">
      <div className="space-y-6">
        <BackButton fallbackHref="/dashboard/supervisor/projects" />

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <PageHeader
              eyebrow="Supervision projet"
              title={project.title}
              description="Vue de supervision en lecture et actions mÃ©tier : revue des candidatures, Ã©valuation, room projet et feedback."
            />

            <ProjectDetails project={project} />
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Candidatures
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {applications.totalItems} candidature(s)
              </p>

              <div className="mt-5 space-y-4">
                {applications.items.length ? (
                  applications.items.map((application) => (
                    <article
                      key={application.id}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-base font-semibold text-slate-950">
                            {application.studentName}
                          </h2>
                          <p className="mt-1 text-sm text-slate-600">
                            {application.studentEmail}
                          </p>
                          <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                            {application.studentLevel} â€¢ {application.validationStatus}
                          </p>
                        </div>
                        <ApplicationStatusBadge
                          status={application.status as ApplicationStatus}
                        />
                      </div>

                      {application.motivation ? (
                        <p className="mt-4 text-sm leading-6 text-slate-700">
                          {application.motivation}
                        </p>
                      ) : null}

                      <div className="mt-4">
                        <ApplicationActions
                          mode="review"
                          applicationId={application.id}
                          applicationStatus={application.status as ApplicationStatus}
                        />
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState
                    title="Aucune candidature"
                    description="Les candidatures apparaÃ®tront ici dÃ¨s qu&apos;un Ã©tudiant validÃ© postulera."
                  />
                )}
              </div>

              {applications.totalItems > 0 ? (
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
                  <a
                    href={
                      currentPage > 1
                        ? `/dashboard/supervisor/projects/${id}?page=${currentPage - 1}`
                        : "#"
                    }
                    aria-disabled={currentPage <= 1}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 aria-disabled:pointer-events-none aria-disabled:opacity-40"
                  >
                    Precedent
                  </a>
                  <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
                    Page {applications.page} / {Math.max(applications.totalPages, 1)}
                  </span>
                  <a
                    href={
                      currentPage < applications.totalPages
                        ? `/dashboard/supervisor/projects/${id}?page=${currentPage + 1}`
                        : "#"
                    }
                    aria-disabled={currentPage >= applications.totalPages}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 aria-disabled:pointer-events-none aria-disabled:opacity-40"
                  >
                    Suivant
                  </a>
                </div>
              ) : null}
            </section>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
