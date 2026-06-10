import { ProjectDetail } from "@/actions/projectActions";
import { LevelBadge } from "@/components/ui/level-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  projectStatusLabels,
  projectStatusTones,
  projectTypeLabels,
} from "@/lib/ui/status-labels";

function formatDate(value: Date | null) {
  if (!value) {
    return "Non renseignee";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(value);
}

type ProjectDetailsProps = {
  project: ProjectDetail;
};

export function ProjectDetails({ project }: ProjectDetailsProps) {
  return (
    <section className="app-panel-strong app-fade-in-up p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={projectTypeLabels[project.type]} tone="neutral" />
          <StatusBadge
            label={projectStatusLabels[project.status]}
            tone={projectStatusTones[project.status]}
          />
        </div>
        <LevelBadge level={project.targetLevel} />
      </div>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        {project.title}
      </h1>
      <p className="mt-4 text-lg leading-8 text-slate-600">{project.summary}</p>

      {project.description ? (
        <p className="mt-6 whitespace-pre-line rounded-[1.7rem] border border-slate-200/80 bg-white/78 p-6 text-sm leading-7 text-slate-700">
          {project.description}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="app-panel-muted p-4">
          <p className="app-eyebrow">Entreprise</p>
          <p className="mt-3 text-sm font-medium text-slate-900">
            {project.companyName ?? "Aucune"}
          </p>
        </div>
        <div className="app-panel-muted p-4">
          <p className="app-eyebrow">Supervision</p>
          <p className="mt-3 text-sm font-medium text-slate-900">
            {project.supervisorName ?? "Non assigné"}
          </p>
        </div>
        <div className="app-panel-muted p-4">
          <p className="app-eyebrow">Createur</p>
          <p className="mt-3 text-sm font-medium text-slate-900">{project.createdByName}</p>
        </div>
        <div className="app-panel-muted p-4">
          <p className="app-eyebrow">Capacite</p>
          <p className="mt-3 text-sm font-medium text-slate-900">
            {project.capacity ?? "Non renseignee"}
          </p>
        </div>
        <div className="app-panel-muted p-4">
          <p className="app-eyebrow">Debut</p>
          <p className="mt-3 text-sm font-medium text-slate-900">
            {formatDate(project.startDate)}
          </p>
        </div>
        <div className="app-panel-muted p-4">
          <p className="app-eyebrow">Fin</p>
          <p className="mt-3 text-sm font-medium text-slate-900">{formatDate(project.endDate)}</p>
        </div>
      </div>

      {project.requiredSkills.length ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {project.requiredSkills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
            >
              {skill}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
