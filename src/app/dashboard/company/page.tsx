import Link from "next/link";
import { connection } from "next/server";
import { CompanyFeedbackForm } from "@/components/company/company-feedback-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCompanyDashboardData } from "@/lib/company-dashboard";
import {
  COMPANY_PROJECT_REQUEST_STATUS_LABELS,
  COMPANY_PROJECT_REQUEST_STATUS_TONES,
} from "@/lib/project-request-ui";
import {
  applicationStatusLabels,
  deliverableStatusLabels,
  projectStatusLabels,
} from "@/lib/ui/status-labels";

export const dynamic = "force-dynamic";

export default async function CompanyDashboardPage() {
  await connection();

  const dashboard = await getCompanyDashboardData();

  return (
    <DashboardShell className="max-w-7xl">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Espace entreprise"
          title={dashboard.companyName}
          description={`Bonjour ${dashboard.contactName}. Suivez vos projets, vos talents affectés, les livrables soumis, les demandes de projets et les feedbacks entreprise depuis un espace lisible et direct.`}
          actions={
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/company/project-requests" className="app-button-secondary">
                Soumettre un cahier de charge
              </Link>
              {dashboard.projects[0] ? (
                <Link href={dashboard.projects[0].roomHref} className="app-button-primary">
                  Ouvrir la room active
                </Link>
              ) : null}
            </div>
          }
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Projets" value={dashboard.kpis.projects} hint="Projets rattachés à votre entreprise" />
          <KpiCard label="Étudiants affectés" value={dashboard.kpis.assignedStudents} hint="Affectations actives" />
          <KpiCard label="Livrables soumis" value={dashboard.kpis.submittedDeliverables} hint="Hors brouillons" />
          <KpiCard label="Shortlist talents" value={dashboard.kpis.shortlistCandidates} hint="Candidats visibles a date" />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-6">
            <section className="app-panel p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Projets entreprise</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Vue minimale des projets réels, des étudiants actifs et de l&apos;accès room.
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                {dashboard.projects.length ? (
                  dashboard.projects.map((project) => (
                    <article key={project.id} className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-950">{project.title}</h3>
                          <p className="mt-2 text-sm text-slate-600">
                            {projectStatusLabels[project.status]} - Niveau {project.targetLevel.replace("LEVEL_", "")}
                          </p>
                          <p className="mt-2 text-sm text-slate-500">
                            {project.activeStudents} étudiant(s) actif(s) - {project.pendingApplications} candidature(s) à suivre
                          </p>
                        </div>
                        <Link href={project.roomHref} className="app-button-secondary">
                          Ouvrir la room
                        </Link>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState
                    title="Aucun projet entreprise"
                    description="Les projets rattachés à votre entreprise apparaîtront ici."
                  />
                )}
              </div>
            </section>

            <section className="app-panel p-6">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Livrables soumis</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Les derniers livrables soumis par les étudiants sur vos projets.
              </p>
              <div className="mt-5 space-y-4">
                {dashboard.deliverables.length ? (
                  dashboard.deliverables.map((deliverable) => (
                    <article key={deliverable.id} className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-950">{deliverable.title}</h3>
                          <p className="mt-2 text-sm text-slate-600">
                            {deliverable.projectTitle} - {deliverable.studentName ?? "Auteur non renseigne"}
                          </p>
                          <p className="mt-2 text-sm text-slate-500">
                            {deliverableStatusLabels[deliverable.status]}
                            {deliverable.submittedAt
                              ? ` - Soumis le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(deliverable.submittedAt)}`
                              : ""}
                          </p>
                        </div>
                        <Link href={deliverable.roomHref} className="app-button-secondary">
                          Voir la room
                        </Link>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState
                    title="Aucun livrable récent"
                    description="Les soumissions apparaîtront ici quand vos projets entreront en exécution."
                  />
                )}
              </div>
            </section>
          </section>

          <section className="space-y-6">
            <section className="app-panel p-6">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Demandes de projets</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Suivez ici les cahiers de charge soumis a l&apos;administration avant conversion en projet publie.
              </p>
              <div className="mt-5 space-y-4">
                {dashboard.projectRequests.length ? (
                  dashboard.projectRequests.map((request) => (
                    <article key={request.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-950">{request.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{request.shortSummary}</p>
                        </div>
                        <StatusBadge
                          label={COMPANY_PROJECT_REQUEST_STATUS_LABELS[request.status]}
                          tone={COMPANY_PROJECT_REQUEST_STATUS_TONES[request.status]}
                        />
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState
                    title="Aucune demande de projet"
                    description="Soumettez un premier cahier de charge pour lancer la revue admin."
                    actionHref="/dashboard/company/project-requests"
                    actionLabel="Soumettre une demande"
                  />
                )}
              </div>
            </section>

            <section className="app-panel p-6">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Talents affectés</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Chaque carte permet de suivre un étudiant déjà affecté et de laisser un feedback.
              </p>
              <div className="mt-5 space-y-5">
                {dashboard.assignedStudents.length ? (
                  dashboard.assignedStudents.map((student) => (
                    <article key={student.membershipId} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">{student.studentName}</h3>
                        <p className="mt-1 text-sm text-slate-600">{student.studentEmail}</p>
                        <p className="mt-2 text-sm text-slate-500">
                          {student.projectTitle} - {student.level} - {student.roleLabel ?? "Contributor"}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          {student.feedbackCount} feedback(s) entreprise déjà enregistrés
                        </p>
                      </div>
                      <div className="mt-4">
                        <CompanyFeedbackForm
                          projectId={student.projectId}
                          membershipId={student.membershipId}
                        />
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState
                    title="Aucun étudiant affecté"
                    description="Les étudiants affectés à vos projets apparaîtront ici après acceptation d'une candidature."
                  />
                )}
              </div>
            </section>

            <section className="app-panel p-6">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Talent shortlist view</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Vue de lecture sur les candidatures visibles cote entreprise pour garder un suivi du pipe talent.
              </p>
              <div className="mt-5 space-y-4">
                {dashboard.shortlist.length ? (
                  dashboard.shortlist.map((application) => (
                    <article key={application.id} className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5">
                      <h3 className="text-lg font-semibold text-slate-950">{application.studentName}</h3>
                      <p className="mt-1 text-sm text-slate-600">{application.studentEmail}</p>
                      <p className="mt-2 text-sm text-slate-500">
                        {application.projectTitle} - {application.level} - {applicationStatusLabels[application.status]}
                      </p>
                      {application.motivation ? (
                        <p className="mt-3 text-sm leading-6 text-slate-700">{application.motivation}</p>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <EmptyState
                    title="Aucune candidature visible"
                    description="Les candidatures ou la shortlist apparaîtront ici lorsqu'un projet entreprise recevra des profils."
                  />
                )}
              </div>
            </section>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
