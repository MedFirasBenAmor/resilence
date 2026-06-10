import Link from "next/link";
import { ProjectStatus, ProjectType, StudentLevel } from "@prisma/client";
import { EmptyState } from "@/components/ui/empty-state";
import {
  levelLabels,
  projectStatusLabels,
  projectStatusTones,
  projectTypeLabels,
} from "@/lib/ui/status-labels";

export type HeroMilestone = {
  title: string;
  dueDate: Date | null;
};

type ActiveProjectHeroProps = {
  project:
    | {
        id: string;
        title: string;
        status: ProjectStatus;
        type: ProjectType;
        targetLevel: StudentLevel;
        companyName: string | null;
        endDate: Date | null;
        totalTasks: number;
        completedTasks: number;
        progressPercentage: number;
        roomHref: string;
        detailsHref: string;
      }
    | undefined;
  nextMilestone?: HeroMilestone | null;
};

function formatDate(value: Date | null) {
  if (!value) {
    return "Pas de deadline definie";
  }

  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(value);
}

export function ActiveProjectHero({ project, nextMilestone }: ActiveProjectHeroProps) {
  if (!project) {
    return (
      <section className="app-panel-strong p-6 sm:p-8">
        <EmptyState
          title="Aucun projet actif"
          description="Candidatez à un projet pour ouvrir une room, soumettre des livrables et commencer à alimenter votre progression."
          actionHref="/dashboard/student/projects"
          actionLabel="Explorer les projets"
        />
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[2.25rem] bg-[linear-gradient(155deg,_#0d1830_0%,_#102746_44%,_#153d63_100%)] p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:p-8 lg:p-9">
      <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-cyan-300/12 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-44 w-44 rounded-full bg-emerald-300/14 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.08),_transparent_28%)]" />

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <HeroBadge label="Projet actif" tone="accent" />
          <HeroBadge label={projectTypeLabels[project.type]} tone="neutral" />
          <HeroBadge label={projectStatusLabels[project.status]} tone={projectStatusTones[project.status]} />
        </div>

        <h2 className="mt-6 max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.9rem]">
          {project.title}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">
          {project.companyName
            ? `Projet rattaché à ${project.companyName}.`
            : "Projet pédagogique guidé dans votre parcours."}{" "}
          Vous pouvez poursuivre l&apos;exécution depuis la room ou revenir au détail du projet.
        </p>

        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          <InfoPill label="Niveau cible" value={levelLabels[project.targetLevel]} />
          <InfoPill
            label="Prochaine etape"
            value={nextMilestone ? nextMilestone.title : "Room projet active"}
          />
          <InfoPill
            label="Deadline"
            value={nextMilestone?.dueDate ? formatDate(nextMilestone.dueDate) : formatDate(project.endDate)}
          />
        </div>

        <div className="mt-7 rounded-[1.7rem] border border-white/10 bg-white/8 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Progression du projet</p>
              <p className="mt-2 text-sm text-slate-300">
                {project.totalTasks > 0
                  ? `${project.completedTasks}/${project.totalTasks} tâches terminées`
                  : "Les tâches de la room alimenteront la progression ici."}
              </p>
            </div>
            <span className="text-3xl font-semibold tracking-tight text-white">
              {project.progressPercentage}%
            </span>
          </div>
          <div className="app-metric-bar mt-3">
            <span
              className="bg-[linear-gradient(90deg,_#7dd3fc_0%,_#6ee7b7_100%)]"
              style={{ width: `${project.progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={project.roomHref} className="app-button-secondary border-white/10 bg-white text-slate-950">
            Voir la room
          </Link>
          <Link href={project.detailsHref} className="app-button-secondary border-white/10 bg-white/8 text-white">
            Voir le projet
          </Link>
        </div>
      </div>
    </section>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/8 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-300">
        {label}
      </p>
      <p className="mt-3 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function HeroBadge({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "info" | "success" | "warning" | "danger" | "accent";
}) {
  const toneMap = {
    neutral: "border-white/10 bg-white/8 text-slate-100",
    info: "border-sky-300/20 bg-sky-300/10 text-sky-100",
    success: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    warning: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    danger: "border-rose-300/20 bg-rose-300/10 text-rose-100",
    accent: "border-indigo-300/20 bg-indigo-300/12 text-indigo-100",
  } as const;

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${toneMap[tone]}`}
    >
      {label}
    </span>
  );
}
