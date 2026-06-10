import Link from "next/link";
import { ApplicationStatus } from "@prisma/client";
import { connection } from "next/server";
import {
  getProjectDetails,
  listApplicationsForProject,
  listProjectCompanyOptions,
  updateProjectAction,
} from "@/actions/projectActions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BackButton } from "@/components/navigation/back-button";
import { ApplicationActions } from "@/components/projects/application-actions";
import { ApplicationStatusBadge } from "@/components/projects/application-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectDetails } from "@/components/projects/project-details";
import { ProjectForm } from "@/components/projects/project-form";

export const dynamic = "force-dynamic";

type AdminProjectDetailsPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ page?: string }>;
};

function formatDateInput(value: Date | null) {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 10);
}

export default async function AdminProjectDetailsPage({
  params,
  searchParams,
}: AdminProjectDetailsPageProps) {
  await connection();

  const { id } = await params;
  const rawSearchParams = await searchParams;
  const currentPage = rawSearchParams?.page ? Number(rawSearchParams.page) : 1;
  const [project, applications, companies] = await Promise.all([
    getProjectDetails(id),
    listApplicationsForProject(id, currentPage),
    listProjectCompanyOptions(),
  ]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <BackButton fallbackHref="/dashboard/admin/projects" />

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <ProjectDetails project={project} />

            <section className="app-panel-strong app-fade-in-up p-8">
              <p className="app-eyebrow">
                Edition admin
              </p>
              <div className="mt-6">
                <ProjectForm
                  action={updateProjectAction}
                  submitLabel="Mettre a jour le projet"
                  companies={companies}
                  initialValues={{
                    projectId: project.id,
                    title: project.title,
                    summary: project.summary,
                    description: project.description ?? "",
                    type: project.type,
                    status: project.status,
                    targetLevel: project.targetLevel,
                    companyId: project.companyId ?? "",
                    capacity: project.capacity ?? 3,
                    startDate: formatDateInput(project.startDate),
                    endDate: formatDateInput(project.endDate),
                    requiredSkillsInput: project.requiredSkills.join("\n"),
                  }}
                />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="app-panel p-6">
              <p className="app-eyebrow">Candidatures</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Candidatures recues
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {applications.totalItems} candidature(s)
              </p>

              <div className="mt-5 space-y-4">
                {applications.items.length ? (
                  applications.items.map((application) => (
                    <article
                      key={application.id}
                      className="app-panel-muted app-hover-card p-5"
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
                        <div className="mt-4 rounded-[1.3rem] bg-white/80 px-4 py-4">
                          <p className="text-sm leading-7 text-slate-700">{application.motivation}</p>
                        </div>
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
                  <Link
                    href={
                      currentPage > 1
                        ? `/dashboard/admin/projects/${id}?page=${currentPage - 1}`
                        : `/dashboard/admin/projects/${id}`
                    }
                    aria-disabled={currentPage <= 1}
                    className="app-button-secondary aria-disabled:pointer-events-none aria-disabled:opacity-40"
                  >
                    Precedent
                  </Link>
                  <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
                    Page {applications.page} / {Math.max(applications.totalPages, 1)}
                  </span>
                  <Link
                    href={
                      currentPage < applications.totalPages
                        ? `/dashboard/admin/projects/${id}?page=${currentPage + 1}`
                        : `/dashboard/admin/projects/${id}?page=${currentPage}`
                    }
                    aria-disabled={currentPage >= applications.totalPages}
                    className="app-button-secondary aria-disabled:pointer-events-none aria-disabled:opacity-40"
                  >
                    Suivant
                  </Link>
                </div>
              ) : null}
            </section>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
