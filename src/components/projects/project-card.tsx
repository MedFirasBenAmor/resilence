import Link from "next/link";
import {
  ApplicationStatus,
  ProjectStatus,
  ProjectType,
  StudentLevel,
} from "@prisma/client";
import { ApplicationStatusBadge } from "@/components/projects/application-status-badge";
import { LevelBadge } from "@/components/ui/level-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  projectStatusLabels,
  projectStatusTones,
  projectTypeLabels,
} from "@/lib/ui/status-labels";

type ProjectCardProps = {
  mode: "studentDiscovery" | "adminManagement" | "supervisorReview" | "companyOverview";
  href: string;
  title: string;
  summary: string;
  type: ProjectType;
  status: ProjectStatus;
  targetLevel: StudentLevel;
  companyName: string | null;
  supervisorName: string | null;
  requiredSkills: string[];
  capacity: number | null;
  applicationStatus?: string | null;
  isMember?: boolean;
  applicationCount?: number;
  activeMemberCount?: number;
  startDate?: Date | null;
  endDate?: Date | null;
};

function isApplicationStatus(value: string): value is ApplicationStatus {
  return Object.values(ApplicationStatus).includes(value as ApplicationStatus);
}

function formatProjectDates(startDate?: Date | null, endDate?: Date | null) {
  if (startDate && endDate) {
    return `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
  }

  if (endDate) {
    return `Jusqu’au ${formatShortDate(endDate)}`;
  }

  if (startDate) {
    return `Démarre le ${formatShortDate(startDate)}`;
  }

  return "Calendrier à confirmer";
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function getStudentCtaLabel(
  isMember?: boolean,
  applicationStatus?: string | null,
) {
  if (isMember) {
    return "Projet rejoint";
  }

  if (applicationStatus && isApplicationStatus(applicationStatus)) {
    if (applicationStatus === ApplicationStatus.PENDING) {
      return "Déjà candidaté";
    }

    if (applicationStatus === ApplicationStatus.ACCEPTED) {
      return "Projet rejoint";
    }

    return "Candidature en cours";
  }

  return "Candidater";
}

function getContextLabel(mode: ProjectCardProps["mode"]) {
  if (mode === "adminManagement") {
    return "Gérer le projet";
  }

  if (mode === "supervisorReview") {
    return "Superviser";
  }

  return "Suivi entreprise";
}

export function resolveProjectCardSecondaryCta(
  mode: ProjectCardProps["mode"],
  {
    isMember,
    applicationStatus,
  }: {
    isMember?: boolean;
    applicationStatus?: string | null;
  },
) {
  if (mode === "studentDiscovery") {
    return getStudentCtaLabel(isMember, applicationStatus);
  }

  return getContextLabel(mode);
}

export function ProjectCard({
  mode,
  href,
  title,
  summary,
  type,
  status,
  targetLevel,
  companyName,
  supervisorName,
  requiredSkills,
  capacity,
  applicationStatus,
  isMember,
  applicationCount = 0,
  activeMemberCount = 0,
  startDate,
  endDate,
}: ProjectCardProps) {
  const availablePlaces =
    typeof capacity === "number" ? Math.max(capacity - activeMemberCount, 0) : null;
  const isStudentDiscovery = mode === "studentDiscovery";
  const secondaryCtaLabel = resolveProjectCardSecondaryCta(mode, {
    isMember,
    applicationStatus,
  });
  const showApplyTone = isStudentDiscovery && !isMember && !applicationStatus;

  return (
    <article className="app-panel app-hover-card app-fade-in-up overflow-hidden rounded-[1.9rem]">
      <div className="relative overflow-hidden border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.28),_transparent_28%),radial-gradient(circle_at_82%_18%,_rgba(16,185,129,0.18),_transparent_24%),linear-gradient(180deg,_#0f1b39_0%,_#16264d_100%)] px-6 pb-6 pt-5 text-white">
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/10 to-transparent" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={projectTypeLabels[type]} tone="neutral" />
            <StatusBadge label={projectStatusLabels[status]} tone={projectStatusTones[status]} />
          </div>
          <LevelBadge level={targetLevel} />
        </div>

        <div className="relative mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
            Découverte projet
          </p>
          <h2 className="mt-3 text-[1.65rem] font-semibold tracking-tight text-white">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200/90">
            {summary}
          </p>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricTile
            label="Calendrier"
            value={formatProjectDates(startDate, endDate)}
            tone="indigo"
          />
          <MetricTile
            label="Places"
            value={
              availablePlaces !== null
                ? `${availablePlaces} / ${capacity} dispo`
                : "Capacité ouverte"
            }
            tone="emerald"
          />
          <MetricTile
            label="Candidatures"
            value={`${applicationCount} reçues`}
            tone="amber"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoPanel
            title="Contexte"
            body={companyName ?? "Projet pédagogique interne pour consolider les compétences de terrain."}
          />
          <InfoPanel
            title="Supervision"
            body={supervisorName ?? "Affectation du superviseur en cours de confirmation."}
          />
        </div>

        {requiredSkills.length ? (
          <div>
            <p className="text-sm font-semibold text-slate-900">Compétences mobilisées</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {requiredSkills.slice(0, 6).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/80 p-4">
          <p className="text-sm font-semibold text-slate-900">Pourquoi rejoindre ?</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Ce projet peut renforcer votre progression, enrichir votre portfolio et produire
            des preuves concrètes à valoriser dans la plateforme.
          </p>
        </div>

        {isStudentDiscovery && (applicationStatus || isMember) ? (
          <div className="flex flex-wrap gap-2">
            {applicationStatus && isApplicationStatus(applicationStatus) ? (
              <ApplicationStatusBadge status={applicationStatus} />
            ) : applicationStatus ? (
              <StatusBadge label={`Candidature ${applicationStatus}`} tone="info" />
            ) : null}
            {isMember ? <StatusBadge label="Membre actif" tone="success" /> : null}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 border-t border-slate-200/80 pt-5">
          <Link href={href} className="app-button-primary flex-1 justify-center sm:flex-none">
            Voir les détails
          </Link>
          <div
            className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold ${
              showApplyTone
                ? "border border-amber-200 bg-amber-50 text-amber-900"
                : "border border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            {secondaryCtaLabel}
          </div>
        </div>
      </div>
    </article>
  );
}

function MetricTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "indigo" | "emerald" | "amber";
}) {
  const toneClassName =
    tone === "indigo"
      ? "border-indigo-200 bg-indigo-50/80 text-indigo-950"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
        : "border-amber-200 bg-amber-50/80 text-amber-950";

  return (
    <div className={`rounded-[1.25rem] border px-4 py-3 ${toneClassName}`}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] opacity-70">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function InfoPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200/80 bg-white px-4 py-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{body}</p>
    </div>
  );
}
