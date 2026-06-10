import Link from "next/link";
import { AcademicValidationStatus, ApplicationStatus, DeliverableStatus } from "@prisma/client";
import { connection } from "next/server";
import { DeadlineList } from "@/components/dashboard/deadline-list";
import { EmptyState } from "@/components/ui/empty-state";
import { RecentList } from "@/components/dashboard/recent-list";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  ActiveProjectHero,
  type HeroMilestone,
} from "@/components/student-dashboard/active-project-hero";
import { ApplicationsPanel } from "@/components/student-dashboard/applications-panel";
import { PortfolioEvidencePanel } from "@/components/student-dashboard/portfolio-evidence-panel";
import {
  PriorityActionCard,
  type PriorityAction,
} from "@/components/student-dashboard/priority-action-card";
import { RecentFeedbackPanel } from "@/components/student-dashboard/recent-feedback-panel";
import { ScoreProgressionCard } from "@/components/student-dashboard/score-progression-card";
import {
  getStudentDashboardData,
  getStudentDeadlineUrgency,
  hasStudentDashboardContent,
} from "@/lib/dashboardQueries";
import {
  academicStatusLabels,
  deliverableStatusLabels,
  taskStatusLabels,
} from "@/lib/ui/status-labels";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  await connection();

  const dashboard = await getStudentDashboardData();
  const hasContent = hasStudentDashboardContent(dashboard);
  const activeProject = dashboard.activeProjects[0];
  const priorityAction = getPriorityAction(dashboard);
  const pendingApplications = dashboard.recentApplications.filter(
    (application) => application.status === ApplicationStatus.PENDING,
  ).length;
  const approvedDeliverables = dashboard.recentDeliverables.filter(
    (deliverable) => deliverable.status === DeliverableStatus.APPROVED,
  ).length;
  const activeProjectNextMilestone: HeroMilestone | null = activeProject
    ? dashboard.upcomingDeadlines.find((task) => task.projectId === activeProject.id) ?? null
    : null;

  return (
    <DashboardShell className="max-w-[1440px]">
      <div className="space-y-5">
        <PageHeader
          eyebrow="Tableau de bord étudiant"
          title={activeProject ? activeProject.title : "Votre espace de progression"}
          description={
            activeProject
              ? "Retrouvez votre projet actif, vos priorités immédiates, vos feedbacks et vos preuves de progression dans un seul espace."
              : "Suivez vos candidatures, vos livrables, votre progression et les prochaines actions utiles depuis votre cockpit étudiant."
          }
          actions={
            <Link
              href={activeProject ? activeProject.roomHref : "/dashboard/student/projects"}
              className="app-button-primary"
            >
              {activeProject ? "Ouvrir la room" : "Explorer les projets"}
            </Link>
          }
        />

        <section className="grid gap-6 xl:grid-cols-[1.45fr_0.62fr] xl:items-stretch">
          <ActiveProjectHero project={activeProject} nextMilestone={activeProjectNextMilestone} />
          <div className="space-y-6">
            <PriorityActionCard action={priorityAction} />
            <ScoreProgressionCard
              level={dashboard.profile.level}
              subLevel={dashboard.profile.subLevel}
              technicalAverage={dashboard.scoreSummary.technicalAverage}
              maturityAverage={dashboard.scoreSummary.maturityAverage}
              globalScore={dashboard.scoreSummary.globalScore}
              feedbackCount={dashboard.scoreSummary.feedbackCount}
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <RecentFeedbackPanel feedbacks={dashboard.recentFeedbacks} />
          <PortfolioEvidencePanel snapshot={dashboard.portfolioSnapshot} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1fr_1fr]">
          <ApplicationsPanel applications={dashboard.recentApplications} />

          <section className="app-panel p-6">
            <p className="app-eyebrow">Deadlines</p>
            <h3 className="mt-3 text-[2rem] font-semibold tracking-tight text-slate-950">
              Echeances proches
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Les tâches qui peuvent bloquer votre prochaine livraison.
            </p>

            <div className="mt-5">
              {dashboard.upcomingDeadlines.length ? (
                <DeadlineList
                  items={dashboard.upcomingDeadlines.map((task) => ({
                    id: task.id,
                    title: task.title,
                    dueDate: task.dueDate,
                    projectTitle: task.projectTitle,
                    href: `/dashboard/projects/${task.projectId}/room`,
                    statusLabel: taskStatusLabels[task.status],
                    tone: getStudentDeadlineUrgency(task.dueDate),
                  }))}
                />
              ) : (
                <EmptyState
                  title="Aucune deadline proche"
                  description="Vos prochaines tâches avec date d'échéance apparaîtront ici."
                />
              )}
            </div>
          </section>

          <section className="app-panel p-6">
            <p className="app-eyebrow">Travail en cours</p>
            <h3 className="mt-3 text-[2rem] font-semibold tracking-tight text-slate-950">
              Livrables et preuves
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Les derniers livrables pour reprendre l&apos;exécution sans perdre le contexte.
            </p>

            <div className="mt-5">
              {dashboard.recentDeliverables.length ? (
                <RecentList
                  items={dashboard.recentDeliverables.map((deliverable) => ({
                    id: deliverable.id,
                    title: deliverable.title,
                    description: `${deliverable.projectTitle} - ${deliverableStatusLabels[deliverable.status]}`,
                    meta: deliverable.submittedAt
                      ? `Soumis le ${new Intl.DateTimeFormat("fr-FR", {
                          dateStyle: "medium",
                        }).format(deliverable.submittedAt)}`
                      : "Brouillon non soumis",
                    href: `/dashboard/projects/${deliverable.projectId}/room`,
                  }))}
                />
              ) : (
                <EmptyState
                  title="Aucun livrable récent"
                  description="Les soumissions apparaîtront ici après votre première livraison."
                />
              )}
            </div>
          </section>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewStat
            label="Projet actif"
            value={dashboard.activeProjects.length}
            hint={activeProject ? activeProject.title : "Aucun projet en exécution"}
          />
          <OverviewStat
            label="Candidatures"
            value={pendingApplications}
            hint={pendingApplications > 0 ? "En attente de reponse" : "Aucune en attente"}
          />
          <OverviewStat
            label="Preuves portfolio"
            value={dashboard.portfolioSnapshot.itemCount}
            hint={`${approvedDeliverables} livrable(s) valides`}
          />
          <OverviewStat
            label="Attestations"
            value={dashboard.portfolioSnapshot.issuedCertificateCount}
            hint={
              dashboard.portfolioSnapshot.latestCertificate
                ? dashboard.portfolioSnapshot.latestCertificate.title
                : "Aucune attestation emise"
            }
          />
        </section>

        {!hasContent ? (
          <EmptyState
            title="Votre dashboard attend votre premiere mission"
            description="Complétez votre profil, candidatez à un projet, puis revenez ici pour suivre room, livrables, feedbacks et preuves portfolio."
            actionHref="/dashboard/student/projects"
            actionLabel="Explorer les projets"
          />
        ) : null}
      </div>
    </DashboardShell>
  );
}

function OverviewStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <article className="app-panel app-hover-card overflow-hidden p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </p>
        <span className="h-3 w-3 rounded-full bg-emerald-400/85" aria-hidden="true" />
      </div>
      <p className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
    </article>
  );
}

function getPriorityAction(dashboard: Awaited<ReturnType<typeof getStudentDashboardData>>): PriorityAction {
  if (!dashboard.profile.isComplete) {
    return {
      eyebrow: "Action prioritaire",
      title: "Completer votre profil",
      description:
        "Votre profil doit être suffisamment complet pour soutenir les candidatures, la validation académique et la lecture de votre portfolio.",
      ctaLabel: "Ouvrir le profil",
      href: "/dashboard/student/profile",
      tone: "warning",
    };
  }

  if (
    dashboard.profile.validationStatus &&
    dashboard.profile.validationStatus !== AcademicValidationStatus.VALIDATED
  ) {
    return {
      eyebrow: "Attention",
      title: "Vérifier votre validation académique",
      description: `Statut actuel : ${academicStatusLabels[dashboard.profile.validationStatus]}. Tant que la validation n'est pas finalisée, l'accès aux projets peut rester limité.`,
      ctaLabel: "Voir le profil",
      href: "/dashboard/student/profile",
      tone: "warning",
    };
  }

  const urgentDeadline = dashboard.upcomingDeadlines[0];
  if (urgentDeadline) {
    const tone = getStudentDeadlineUrgency(urgentDeadline.dueDate);

    return {
      eyebrow: tone === "overdue" ? "Blocage" : "Action prioritaire",
      title:
        tone === "overdue"
          ? "Rattraper une tâche en retard"
          : "Preparer votre prochaine livraison",
      description: `${urgentDeadline.title} dans ${urgentDeadline.projectTitle}. Commencez par ouvrir la room projet et traiter cette tâche avant qu'elle ne bloque la suite.`,
      ctaLabel: "Voir la room",
      href: `/dashboard/projects/${urgentDeadline.projectId}/room`,
      tone: tone === "overdue" ? "danger" : "warning",
    };
  }

  const recentFeedback = dashboard.recentFeedbacks[0];
  if (recentFeedback) {
    return {
      eyebrow: "Progression",
      title: "Relire votre dernier feedback",
      description: `Le retour sur ${recentFeedback.projectTitle ?? "votre projet"} peut vous aider à comprendre ce qui doit changer dans votre prochaine itération.`,
      ctaLabel: "Voir la progression",
      href: "/dashboard/student/progress",
      tone: "success",
    };
  }

  if (dashboard.activeProjects[0]) {
    return {
      eyebrow: "Execution",
      title: "Reprendre le projet actif",
      description:
        "Votre room projet concentre tâches, livrables et commentaires. Reprenez le flux là où vous vous étiez arrêté.",
      ctaLabel: "Voir la room",
      href: dashboard.activeProjects[0].roomHref,
      tone: "success",
    };
  }

  if (dashboard.recentApplications.some((application) => application.status === ApplicationStatus.PENDING)) {
    return {
      eyebrow: "Suivi",
      title: "Verifier vos candidatures en attente",
      description:
        "Gardez un œil sur les projets déjà ciblés pour anticiper une acceptation, une relance ou un nouveau choix de projet.",
      ctaLabel: "Voir les projets",
      href: "/dashboard/student/projects",
      tone: "neutral",
    };
  }

  if (dashboard.portfolioSnapshot.certificateCount > 0) {
    return {
      eyebrow: "Preuves",
      title: "Consulter votre portfolio",
      description:
        "Vos preuves de travail, vos livrables validés et vos attestations commencent à former une lecture professionnelle cohérente.",
      ctaLabel: "Voir le portfolio",
      href: "/dashboard/student/portfolio",
      tone: "success",
    };
  }

  return {
    eyebrow: "Demarrage",
    title: "Explorer un premier projet",
    description:
      "Candidatez à un projet compatible avec votre niveau pour ouvrir votre premier parcours actif dans la plateforme.",
    ctaLabel: "Explorer les projets",
    href: "/dashboard/student/projects",
    tone: "neutral",
  };
}
