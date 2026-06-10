import Link from "next/link";
import { CompanyProjectRequestStatus } from "@prisma/client";
import { connection } from "next/server";
import {
  getAdminProjectRequestDetails,
  getProjectRequestConversionDefaults,
} from "@/actions/projectRequestActions";
import { AdminProjectRequestReviewPanel } from "@/components/admin/admin-project-request-review-panel";
import { ConvertProjectRequestForm } from "@/components/admin/convert-project-request-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { BackButton } from "@/components/navigation/back-button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  COMPANY_PROJECT_REQUEST_STATUS_LABELS,
  COMPANY_PROJECT_REQUEST_STATUS_TONES,
} from "@/lib/project-request-ui";

export const dynamic = "force-dynamic";

type AdminProjectRequestDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminProjectRequestDetailsPage({
  params,
}: AdminProjectRequestDetailsPageProps) {
  await connection();

  const { id } = await params;
  const request = await getAdminProjectRequestDetails(id);
  const defaults = await getProjectRequestConversionDefaults(id);

  return (
    <DashboardShell className="max-w-7xl">
      <div className="space-y-6">
        <BackButton fallbackHref="/dashboard/admin/project-requests" />

        <PageHeader
          eyebrow="Demande entreprise"
          title={request.title}
          description={`Entreprise: ${request.companyName}. Ouvrez le cahier de charge, documentez la revue puis convertissez si la demande est retenue.`}
          actions={
            <div className="flex flex-wrap gap-3">
              <Link href={request.specBookUrl} className="app-button-secondary" target="_blank">
                Voir le PDF
              </Link>
              <Link href="/dashboard/admin/project-requests" className="app-button-secondary">
                Retour liste
              </Link>
            </div>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge
                  label={COMPANY_PROJECT_REQUEST_STATUS_LABELS[request.status]}
                  tone={COMPANY_PROJECT_REQUEST_STATUS_TONES[request.status]}
                />
                <p className="text-sm text-slate-500">
                  Soumise le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(request.createdAt)}
                </p>
              </div>

              <dl className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Domaine</dt>
                  <dd className="mt-2 text-sm text-slate-900">{request.domain}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Niveau cible</dt>
                  <dd className="mt-2 text-sm text-slate-900">{request.desiredLevel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Equipe attendue</dt>
                  <dd className="mt-2 text-sm text-slate-900">{request.expectedTeamSize} personne(s)</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Duree estimee</dt>
                  <dd className="mt-2 text-sm text-slate-900">{request.estimatedDuration}</dd>
                </div>
              </dl>

              <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Resume</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{request.shortSummary}</p>
              </div>

              {request.adminReviewNote ? (
                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Note admin</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{request.adminReviewNote}</p>
                </div>
              ) : null}

              {request.convertedProjectId ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                  Projet converti:{" "}
                  <Link href={`/dashboard/admin/projects/${request.convertedProjectId}`} className="font-semibold">
                    {request.convertedProjectTitle ?? "Voir le projet"}
                  </Link>
                </div>
              ) : null}
            </section>

            <AdminProjectRequestReviewPanel
              requestId={request.id}
              status={request.status}
              initialNote={request.adminReviewNote ?? ""}
            />
          </section>

          <section className="space-y-6">
            {request.status === CompanyProjectRequestStatus.APPROVED ? (
              <ConvertProjectRequestForm
                requestId={request.id}
                initialValues={{
                  title: defaults.title,
                  summary: defaults.summary,
                  description: defaults.description,
                  targetLevel: defaults.targetLevel,
                  capacity: defaults.capacity,
                  requiredSkillsInput: defaults.requiredSkillsInput,
                  startDate: "",
                  endDate: "",
                }}
              />
            ) : request.status === CompanyProjectRequestStatus.CONVERTED ? (
              <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-emerald-900">Demande déjà convertie</h2>
                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  Cette demande est déjà liée à un projet publié. Utilisez la fiche projet pour poursuivre la gouvernance.
                </p>
              </section>
            ) : (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-950">Conversion indisponible</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  La conversion vers un projet publie n&apos;est disponible qu&apos;apres approbation admin.
                </p>
              </section>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
