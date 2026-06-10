import { type PortfolioProjectRow } from "@/lib/portfolio-data";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  projectStatusLabels,
  projectStatusTones,
  projectTypeLabels,
} from "@/lib/ui/status-labels";

type PortfolioProjectListProps = {
  projects: PortfolioProjectRow[];
  publicView?: boolean;
};

export function PortfolioProjectList({
  projects,
  publicView = false,
}: PortfolioProjectListProps) {
  if (!projects.length) {
    return (
      <EmptyState
        title="Aucun projet significatif a afficher"
        description={
          publicView
            ? "Les projets affichés ici apparaîtront lorsqu'un projet actif ou terminé sera suffisamment représentatif."
            : "Vos projets actifs ou terminés apparaîtront ici pour structurer votre portfolio."
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <article key={project.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <h3 className="text-lg font-semibold text-slate-950">{project.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{project.summary}</p>
              <p className="mt-4 text-sm text-slate-500">
                {project.companyName ? `${project.companyName} • ` : ""}
                {project.roleLabel ? `Role: ${project.roleLabel}` : "Contribution projet"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                label={projectStatusLabels[project.status]}
                tone={projectStatusTones[project.status]}
              />
              <StatusBadge label={projectTypeLabels[project.type]} tone="neutral" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
