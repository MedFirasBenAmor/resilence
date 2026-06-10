import Link from "next/link";
import { ApplicationStatus } from "@prisma/client";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { applicationStatusLabels, applicationStatusTones } from "@/lib/ui/status-labels";

type ApplicationsPanelProps = {
  applications: Array<{
    id: string;
    projectId: string;
    projectTitle: string;
    status: ApplicationStatus;
    createdAt: Date;
  }>;
};

export function ApplicationsPanel({ applications }: ApplicationsPanelProps) {
  return (
    <section className="app-panel p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="app-eyebrow">Candidatures</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Projets en attente ou déjà engagés
          </h3>
        </div>
        <Link href="/dashboard/student/projects" className="app-button-secondary text-sm">
          Explorer les projets
        </Link>
      </div>

      <div className="mt-5">
        {applications.length ? (
          <div className="space-y-4">
            {applications.map((application) => (
              <article
                key={application.id}
                className="rounded-[1.5rem] border border-slate-200/85 bg-white/92 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-slate-950">
                      {application.projectTitle}
                    </h4>
                    <p className="mt-2 text-sm text-slate-600">
                      Envoyee le{" "}
                      {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
                        application.createdAt,
                      )}
                    </p>
                  </div>
                  <StatusBadge
                    label={applicationStatusLabels[application.status]}
                    tone={applicationStatusTones[application.status]}
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aucune candidature récente"
            description="Candidatez à un projet pour ouvrir votre premier parcours actif dans la plateforme."
            actionHref="/dashboard/student/projects"
            actionLabel="Voir les projets"
          />
        )}
      </div>
    </section>
  );
}
