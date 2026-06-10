import { StatusBadge } from "@/components/ui/status-badge";
import {
  levelLabels,
  projectStatusLabels,
  projectTypeLabels,
} from "@/lib/ui/status-labels";
import type { ProjectRoomData } from "@/lib/project-room-data";

type ProjectRoomHeaderProps = Pick<ProjectRoomData, "project" | "progress">;

function formatDate(value: Date | null) {
  if (!value) {
    return "Non renseignée";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(value);
}

export function ProjectRoomHeader({
  project,
  progress,
}: ProjectRoomHeaderProps) {
  const remainingTasks = Math.max(progress.totalTasks - progress.completedTasks, 0);

  return (
    <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-[0_28px_80px_-42px_rgba(15,23,42,0.85)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={projectTypeLabels[project.type]} tone="neutral" />
          <StatusBadge label={projectStatusLabels[project.status]} tone="info" />
          <StatusBadge label={levelLabels[project.targetLevel]} tone="accent" />
        </div>
        <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-slate-100">
          Centre d&apos;exécution projet
        </span>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">
            Mission room
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            {project.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200 sm:text-lg">
            {project.summary}
          </p>
          {project.description ? (
            <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-7 text-slate-300">
              {project.description}
            </p>
          ) : null}

          <div className="mt-6 grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-[1.6rem] border border-white/12 bg-white/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Supervision
              </p>
              <p className="mt-2 text-base font-semibold text-white">
                {project.supervisorName ?? "Non assigné"}
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-white/12 bg-white/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Entreprise
              </p>
              <p className="mt-2 text-base font-semibold text-white">
                {project.companyName ?? "Aucune"}
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-white/12 bg-white/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Deadline
              </p>
              <p className="mt-2 text-base font-semibold text-white">
                {formatDate(project.endDate)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.9rem] border border-white/12 bg-white/10 p-6 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Progression room
              </p>
              <p className="mt-3 text-5xl font-bold tracking-tight text-white">
                {progress.percentage}%
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                Tâches closes
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {progress.completedTasks}/{progress.totalTasks}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-slate-100">Avancement du projet</p>
            <p className="text-sm font-semibold text-slate-300">
              {progress.completedTasks} / {progress.totalTasks || 0} tâches
            </p>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
            <span
              className="block h-full rounded-full bg-emerald-400"
              style={{ width: `${Math.max(0, Math.min(progress.percentage, 100))}%` }}
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.4rem] bg-white/8 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Reste à traiter
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {remainingTasks} tâche{remainingTasks > 1 ? "s" : ""}
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-white/8 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Statut mission
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {projectStatusLabels[project.status]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
