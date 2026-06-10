import Link from "next/link";
import { connection } from "next/server";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { RecentList } from "@/components/dashboard/recent-list";
import { RiskAlert } from "@/components/dashboard/risk-alert";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ActionCard } from "@/components/ui/action-card";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { getAdminDashboardData } from "@/lib/dashboardQueries";
import {
  academicStatusLabels,
  deliverableStatusLabels,
  levelLabels,
} from "@/lib/ui/status-labels";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await connection();

  const dashboard = await getAdminDashboardData();

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Pilotage"
          title="Vue d'ensemble du programme"
          description={`Bonjour ${dashboard.adminName}. Repérez d'abord les validations en attente, les projets à surveiller et les scores faibles qui demandent un suivi rapide.`}
          actions={
            <Link href="/dashboard/admin/students" className="app-button-primary">
              Validations en attente
            </Link>
          }
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Étudiants actifs"
            value={dashboard.kpis.totalStudents}
            hint={`${dashboard.kpis.partnerCompanies} entreprises partenaires`}
          />
          <KpiCard
            label="Projets ouverts"
            value={dashboard.kpis.activeProjects}
            hint={`${dashboard.kpis.pendingApplications} candidatures en attente`}
          />
          <KpiCard
            label="Validations en attente"
            value={dashboard.kpis.pendingValidation}
            hint="Profils à traiter"
          />
          <KpiCard
            label="Score moyen plateforme"
            value={
              dashboard.lowScoreAlerts.length
                ? (
                    dashboard.lowScoreAlerts.reduce((sum, alert) => sum + alert.globalScore, 0) /
                    dashboard.lowScoreAlerts.length
                  ).toFixed(0)
                : "-"
            }
            hint={`${dashboard.kpis.deliverablesToReview} livrables à relire`}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          <ActionCard
            title="Valider les étudiants"
            description="Traitez les profils en attente pour débloquer l'accès aux projets."
            href="/dashboard/admin/students"
            ctaLabel="Ouvrir"
          />
          <ActionCard
            title="Gérer les projets"
            description="L'administration pilote la création, l'édition et la gouvernance de tous les projets."
            href="/dashboard/admin/projects"
            ctaLabel="Voir les projets"
          />
          <ActionCard
            title="Consulter les feedbacks"
            description="Supervisez les évaluations récentes et les signaux faibles."
            href="/dashboard/admin/feedback"
            ctaLabel="Voir les feedbacks"
          />
          <ActionCard
            title="Revoir les livrables"
            description="Accédez rapidement aux rooms où des livrables attendent une relecture."
            href={
              dashboard.pendingReviewDeliverables[0]
                ? `/dashboard/projects/${dashboard.pendingReviewDeliverables[0].projectId}/room`
                : "/dashboard/admin/projects"
            }
            ctaLabel="Accéder"
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <DashboardCard
              title="Validations en attente"
              description="Traitez d'abord les profils qui débloquent l'accès aux candidatures et au passage en projet."
            >
              {dashboard.pendingStudents.length ? (
                <div className="space-y-3">
                  {dashboard.pendingStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex flex-col gap-4 rounded-[1.6rem] border border-slate-200/90 bg-white/88 px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 text-sm font-semibold text-slate-700">
                          {student.displayName
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-950">{student.displayName}</p>
                          <p className="mt-1 truncate text-sm text-slate-500">
                            {student.email} - {levelLabels[student.level]} - {academicStatusLabels[student.status]}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href="/dashboard/admin/students" className="app-button-secondary text-sm">
                          Examiner
                        </Link>
                        <Link href="/dashboard/admin/students" className="app-button-primary text-sm">
                          Valider
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Aucun profil en attente"
                  description="Les validations académiques en attente apparaîtront ici."
                  actionHref="/dashboard/admin/students"
                  actionLabel="Ouvrir la validation étudiante"
                />
              )}
            </DashboardCard>

            <DashboardCard
              title="Projets nécessitant une attention"
              description="Suivez les livrables en attente de relecture et les projets qui doivent avancer."
              href="/dashboard/admin/projects"
              hrefLabel="Voir"
            >
              {dashboard.alerts.length ? (
                <div className="space-y-3">
                  {dashboard.alerts.map((alert) => (
                    <RiskAlert
                      key={alert}
                      title="A surveiller"
                      description={alert}
                      severity={alert.includes("signal faible") ? "medium" : "high"}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Aucune alerte immédiate"
                  description="Les alertes simples apparaîtront ici quand un seuil utile sera dépassé."
                />
              )}
            </DashboardCard>

            <DashboardCard
              title="Livrables en attente de relecture"
              description="Redirigez rapidement vers la bonne room projet pour accélérer le cycle de feedback."
            >
              {dashboard.pendingReviewDeliverables.length ? (
                <RecentList
                  items={dashboard.pendingReviewDeliverables.map((deliverable) => ({
                    id: deliverable.id,
                    title: deliverable.title,
                    description: `${deliverable.projectTitle} - ${deliverableStatusLabels[deliverable.status]}`,
                    meta: deliverable.submittedAt
                      ? `Soumis le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(deliverable.submittedAt)}`
                      : "Soumission sans date",
                    href: `/dashboard/projects/${deliverable.projectId}/room`,
                  }))}
                />
              ) : (
                <EmptyState
                  title="Aucun livrable en attente"
                  description="Les relectures à accélérer remonteront ici automatiquement."
                />
              )}
            </DashboardCard>
          </div>

          <div className="space-y-6">
            <DashboardCard
              title="Scores faibles à surveiller"
              description="Ces cas méritent souvent un suivi rapide : blocage technique, manque d'autonomie ou maturité fragile."
            >
              {dashboard.lowScoreAlerts.length ? (
                <div className="space-y-3">
                  {dashboard.lowScoreAlerts.map((alert) => (
                    <RiskAlert
                      key={alert.id}
                      title={`${alert.studentName} - ${alert.projectTitle ?? "Projet"}`}
                      description={`Technique ${alert.technicalAverage.toFixed(1)} - Maturité ${alert.maturityAverage.toFixed(1)} - Global ${alert.globalScore.toFixed(1)}`}
                      severity={alert.severity}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Aucun score faible récent"
                  description="Les alertes de scoring faible apparaîtront ici quand un feedback critique sera enregistré."
                />
              )}
            </DashboardCard>

            <DashboardCard
              title="Feedbacks récents"
              description="Gardez une vision transversale sur les évaluations publiées récemment."
              href="/dashboard/admin/feedback"
              hrefLabel="Tout voir"
            >
              {dashboard.recentFeedbacks.length ? (
                <RecentList
                  items={dashboard.recentFeedbacks.map((feedback) => ({
                    id: feedback.id,
                    title: feedback.title ?? feedback.studentName,
                    description: `${feedback.studentName} - ${feedback.projectTitle ?? "Projet"} - ${feedback.evaluatorName ?? "Évaluateur"} - Score global ${feedback.globalScore.toFixed(1)}`,
                    meta: new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
                      feedback.createdAt,
                    ),
                  }))}
                />
              ) : (
                <EmptyState
                  title="Aucun feedback récent"
                  description="Les évaluations récentes apparaîtront ici dès qu'un superviseur ou un admin commencera à scorer."
                />
              )}
            </DashboardCard>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
