import Link from "next/link";
import { connection } from "next/server";
import { AcademicValidationStatus, ProjectType } from "@prisma/client";
import { listAvailableProjectsForStudent, type ProjectListItem } from "@/actions/projectActions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFilters } from "@/components/projects/project-filters";
import { levelLabels, projectTypeLabels } from "@/lib/ui/status-labels";

export const dynamic = "force-dynamic";

type StudentProjectsPageProps = {
  searchParams?: Promise<{
    query?: string;
    search?: string;
    type?: "FICTIONAL" | "REAL" | "";
    level?: "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "";
    skills?: string;
    availability?: "AVAILABLE" | "FULL" | "";
    applicationStatus?: "NOT_APPLIED" | "PENDING" | "ACCEPTED" | "REJECTED" | "";
    sort?: "RECENT" | "DEADLINE" | "LEVEL" | "AVAILABLE_PLACES";
    page?: string;
  }>;
};

function buildStudentPageHref(page: number, query: URLSearchParams) {
  const next = new URLSearchParams(query);

  if (page <= 1) {
    next.delete("page");
  } else {
    next.set("page", String(page));
  }

  const value = next.toString();
  return value ? `/dashboard/student/projects?${value}` : "/dashboard/student/projects";
}

function getRecommendation(projects: ProjectListItem[], viewerLevel: string | null) {
  const pedagogical = projects.find((project) => project.type === ProjectType.FICTIONAL);
  const realProject = projects.find((project) => project.type === ProjectType.REAL);
  const suggested = pedagogical ?? realProject ?? projects[0] ?? null;

  if (!suggested) {
    return {
      title: "Étape suivante",
      body: viewerLevel
        ? `Votre niveau ${viewerLevel} est prêt pour de nouvelles candidatures. Ajustez les filtres pour explorer les options ouvertes.`
        : "Complétez votre profil puis explorez les projets ouverts pour préparer votre prochaine candidature.",
      accent: "generic" as const,
    };
  }

  return {
    title: "Projet conseillé",
    body: `${suggested.title} semble cohérent avec votre niveau et peut enrichir votre portfolio avec des preuves concrètes.`,
    accent: suggested.type === ProjectType.REAL ? ("real" as const) : ("pedagogical" as const),
  };
}

function getDiscoveryStats(projects: ProjectListItem[]) {
  const pedagogicalCount = projects.filter((project) => project.type === ProjectType.FICTIONAL).length;
  const realCount = projects.filter((project) => project.type === ProjectType.REAL).length;
  const openPlaces = projects.reduce((sum, project) => {
    if (typeof project.capacity !== "number") {
      return sum;
    }

    return sum + Math.max(project.capacity - project.activeMemberCount, 0);
  }, 0);

  return {
    pedagogicalCount,
    realCount,
    openPlaces,
  };
}

export default async function StudentProjectsPage({
  searchParams,
}: StudentProjectsPageProps) {
  await connection();

  const rawParams = await searchParams;
  const result = await listAvailableProjectsForStudent({
    search: rawParams?.search ?? rawParams?.query ?? "",
    type: rawParams?.type ?? "",
    level: rawParams?.level ?? "",
    status: "",
    skills: rawParams?.skills ?? "",
    availability: rawParams?.availability ?? "",
    applicationStatus: rawParams?.applicationStatus ?? "",
    sort: rawParams?.sort ?? "RECENT",
    page: rawParams?.page ?? 1,
  });
  const query = new URLSearchParams();

  if (result.filters.search) {
    query.set("search", result.filters.search);
  }

  if (result.filters.type) {
    query.set("type", result.filters.type);
  }

  if (result.filters.level) {
    query.set("level", result.filters.level);
  }

  if (result.filters.skills) {
    query.set("skills", result.filters.skills);
  }

  if (result.filters.availability) {
    query.set("availability", result.filters.availability);
  }

  if (result.filters.applicationStatus) {
    query.set("applicationStatus", result.filters.applicationStatus);
  }

  if (result.filters.sort !== "RECENT") {
    query.set("sort", result.filters.sort);
  }

  const recommendation = getRecommendation(
    result.items,
    result.viewerLevel ? levelLabels[result.viewerLevel] : null,
  );
  const stats = getDiscoveryStats(result.items);
  const activeTypeLabel = result.filters.type
    ? projectTypeLabels[result.filters.type]
    : "Tous les projets";

  return (
    <DashboardShell className="max-w-[1440px]">
      <div className="space-y-6">
        <section className="app-panel-strong app-fade-in-up overflow-hidden rounded-[2rem]">
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.1fr_0.62fr] lg:px-8 lg:py-8">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Catalogue projets
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-[3rem]">
                  Découvrir votre prochain projet
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                  Explorez des projets alignés sur vos compétences, votre progression,
                  votre portfolio et l’expérience réelle que vous souhaitez construire.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <HeroStat label="Catalogue actif" value={`${result.totalItems} projets`} />
                <HeroStat
                  label="Type dominant"
                  value={activeTypeLabel}
                />
                <HeroStat
                  label="Niveau recommandé"
                  value={
                    result.viewerLevel ? levelLabels[result.viewerLevel] : "Profil à compléter"
                  }
                />
              </div>
            </div>

            <aside className="rounded-[1.75rem] border border-slate-900/10 bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.22),_transparent_26%),linear-gradient(180deg,_#16184a_0%,_#111a39_100%)] p-5 text-white shadow-[0_25px_60px_rgba(15,23,42,0.18)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-100/80">
                    Recommandation
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                    {recommendation.title}
                  </h2>
                </div>
                <span className="rounded-full border border-emerald-300/25 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100">
                  {result.viewerLevel ? "Niveau connu" : "Repère"}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-200/90">{recommendation.body}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <RecommendationMiniStat
                  label="Pédagogiques"
                  value={String(stats.pedagogicalCount)}
                />
                <RecommendationMiniStat
                  label="Entreprise"
                  value={String(stats.realCount)}
                />
                <RecommendationMiniStat
                  label="Places estimées"
                  value={stats.openPlaces ? String(stats.openPlaces) : "Ouvert"}
                />
              </div>
            </aside>
          </div>
        </section>

        {result.viewerLevel ? (
          <div className="app-panel-muted px-5 py-4 text-sm font-medium text-slate-600">
            Niveau détecté :{" "}
            <span className="text-slate-950">{levelLabels[result.viewerLevel]}</span>
          </div>
        ) : null}

        {result.validationStatus &&
        result.validationStatus !== AcademicValidationStatus.VALIDATED ? (
          <ErrorState
            title="Validation académique requise"
            description="Votre profil doit être validé par un administrateur avant de pouvoir consulter et rejoindre les projets ouverts."
          />
        ) : (
          <>
            <ProjectFilters
              actionPath="/dashboard/student/projects"
              values={{
                search: result.filters.search ?? "",
                type: result.filters.type ?? "",
                level: result.filters.level ?? "",
                skills: result.filters.skills ?? "",
                availability: result.filters.availability ?? "",
                applicationStatus: result.filters.applicationStatus ?? "",
                sort: result.filters.sort ?? "RECENT",
                page: result.page,
              }}
              resultCount={result.totalItems}
            />

            {result.items.length ? (
              <>
                <section className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
                  <div className="app-panel rounded-[1.8rem] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Lecture du catalogue
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                      Trouver un projet adapté à votre progression
                    </h2>
                    <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
                      <p>
                        Priorisez les projets dont le niveau correspond au vôtre, puis
                        comparez le type, les compétences mobilisées et la capacité restante.
                      </p>
                      <p>
                        Le tri reste partageable via l&apos;URL et se combine avec tous les filtres actifs.
                      </p>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <DiscoveryChip label={`${result.totalItems} disponibles`} tone="indigo" />
                      <DiscoveryChip label={`${stats.pedagogicalCount} pédagogiques`} tone="emerald" />
                      <DiscoveryChip label={`${stats.realCount} entreprise`} tone="amber" />
                    </div>
                  </div>

                  <div className="app-panel rounded-[1.8rem] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Tri actuel
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                          Catalogue filtré et trié
                        </h2>
                      </div>
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                        {result.totalItems} résultat(s)
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <HeroStat label="Requêtes" value={result.filters.search ? "Affinées" : "Toutes"} compact />
                      <HeroStat label="Compétence" value={result.filters.skills || "Aucune"} compact />
                      <HeroStat label="Type" value={activeTypeLabel} compact />
                    </div>
                  </div>
                </section>

                <section className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
                  {result.items.map((project) => (
                    <ProjectCard
                      key={project.id}
                      mode="studentDiscovery"
                      href={`/dashboard/student/projects/${project.id}`}
                      title={project.title}
                      summary={project.summary}
                      type={project.type}
                      status={project.status}
                      targetLevel={project.targetLevel}
                      companyName={project.companyName}
                      supervisorName={project.supervisorName}
                      requiredSkills={project.requiredSkills}
                      capacity={project.capacity}
                      applicationStatus={project.applicationStatus}
                      isMember={project.isMember}
                      applicationCount={project.applicationCount}
                      activeMemberCount={project.activeMemberCount}
                      startDate={project.startDate}
                      endDate={project.endDate}
                    />
                  ))}
                </section>

                <div className="app-panel flex flex-wrap items-center justify-between gap-4 rounded-[1.8rem] px-6 py-4">
                  <div className="text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">{result.totalItems} projet(s) trouvés</p>
                    <p className="mt-1">Page {result.page} sur {Math.max(result.totalPages, 1)}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={buildStudentPageHref(result.page - 1, query)}
                      aria-disabled={result.page <= 1}
                      className="app-button-secondary aria-disabled:pointer-events-none aria-disabled:opacity-40"
                    >
                      Précédent
                    </Link>
                    <Link
                      href={buildStudentPageHref(result.page + 1, query)}
                      aria-disabled={result.page >= result.totalPages}
                      className="app-button-secondary aria-disabled:pointer-events-none aria-disabled:opacity-40"
                    >
                      Suivant
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                title="Aucun projet disponible"
                description="Aucun projet ouvert ne correspond à vos filtres pour le moment. Essayez une recherche plus large ou réinitialisez les filtres."
                actionLabel="Réinitialiser les filtres"
                actionHref="/dashboard/student/projects"
              />
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function HeroStat({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-[1.35rem] border border-slate-200/80 bg-white/90 px-4 py-4 ${compact ? "" : "shadow-sm"}`}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-900 sm:text-base">{value}</p>
    </div>
  );
}

function RecommendationMiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-white/8 px-4 py-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-300">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

function DiscoveryChip({
  label,
  tone,
}: {
  label: string;
  tone: "indigo" | "emerald" | "amber";
}) {
  const toneClassName =
    tone === "indigo"
      ? "border-indigo-200 bg-indigo-50 text-indigo-900"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
        : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${toneClassName}`}>
      {label}
    </span>
  );
}
