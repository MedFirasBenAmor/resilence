import Link from "next/link";
import { connection } from "next/server";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DeadlineList } from "@/components/dashboard/deadline-list";
import { RecentList } from "@/components/dashboard/recent-list";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ActionCard } from "@/components/ui/action-card";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  getStudentDeadlineUrgency,
  getSupervisorDashboardData,
  hasSupervisorDashboardContent,
} from "@/lib/dashboardQueries";
import {
  deliverableStatusLabels,
  projectStatusLabels,
  taskStatusLabels,
} from "@/lib/ui/status-labels";

export const dynamic = "force-dynamic";

export default async function SupervisorDashboardPage() {
  await connection();

  const dashboard = await getSupervisorDashboardData();
  const hasContent = hasSupervisorDashboardContent(dashboard);
  const primaryProject = dashboard.projects[0];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Tableau de bord superviseur"
          title={`Bonjour ${dashboard.supervisorName}`}
          description="Concentrez-vous d'abord sur les projets supervisés, les candidatures en attente, les livrables à relire et les tâches bloquées qui ralentissent les étudiants."
          actions={
            <Link
              href={primaryProject ? primaryProject.roomHref : "/dashboard/supervisor/projects"}
              className="app-button-primary"
            >
              {primaryProject ? "Ouvrir la room active" : "Voir les projets supervisés"}
            </Link>
          }
        />

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Projets supervisés" value={dashboard.kpis.supervisedProjects} />
          <KpiCard label="Projets actifs" value={dashboard.kpis.activeProjects} />
          <KpiCard label="Candidatures en attente" value={dashboard.kpis.pendingApplications} />
          <KpiCard label="Étudiants suivis" value={dashboard.kpis.studentsFollowed} />
          <KpiCard label="Livrables à relire" value={dashboard.kpis.deliverablesToReview} />
          <KpiCard label="Tâches bloquées" value={dashboard.kpis.blockedTasks} />
        </section>

        <section className="grid gap-4 lg:grid-cols-5">
          <ActionCard
            title="Projets supervisés"
            description="Accédez à la liste des projets qui vous sont assignés et à leur vue détaillée."
            href="/dashboard/supervisor/projects"
            ctaLabel="Voir la liste"
          />
          <ActionCard
            title="Revoir les candidatures"
            description="Traitez les candidatures en attente sur vos projets supervisés."
            href={primaryProject ? `/dashboard/supervisor/projects/${primaryProject.id}` : "/dashboard/supervisor/projects"}
            ctaLabel="Ouvrir"
          />
          <ActionCard
            title="Ouvrir une room projet"
            description="Retournez rapidement dans l'espace de travail d'un projet actif."
            href={primaryProject ? primaryProject.roomHref : "/dashboard/supervisor/projects"}
            ctaLabel="Entrer"
          />
          <ActionCard
            title="Évaluer un étudiant"
            description="Transformez l'avancement d'un projet en feedback actionnable."
            href={primaryProject ? primaryProject.evaluateHref : "/dashboard/supervisor/projects"}
            ctaLabel="Évaluer"
          />
          <ActionCard
            title="Revoir un livrable"
            description="Priorisez les soumissions qui attendent une relecture rapide."
            href={
              dashboard.pendingReviewDeliverables[0]
                ? `/dashboard/projects/${dashboard.pendingReviewDeliverables[0].projectId}/room`
                : "/dashboard/supervisor/projects"
            }
            ctaLabel="Relire"
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <DashboardCard
              title="Projets sous supervision"
              description="Chaque ligne doit vous aider à arbitrer entre staffing, revue et évaluation."
              href="/dashboard/supervisor/projects"
              hrefLabel="Tous les projets"
            >
              {dashboard.projects.length ? (
                <RecentList
                  items={dashboard.projects.map((project) => ({
                    id: project.id,
                    title: project.title,
                    description: `${projectStatusLabels[project.status]} - ${project.activeMembers} membre(s) actif(s) - ${project.pendingApplications} candidature(s) en attente`,
                    meta: "Accédez au détail projet ou à la room pour agir.",
                    href: `/dashboard/supervisor/projects/${project.id}`,
                  }))}
                />
              ) : (
                <EmptyState
                  title="Aucun projet supervisé"
                  description="Les projets qui vous seront assignés apparaîtront ici pour suivre candidatures, livrables et évaluations."
                  actionHref="/dashboard/supervisor/projects"
                  actionLabel="Voir les projets"
                />
              )}
            </DashboardCard>

            <DashboardCard
              title="Livrables à relire"
              description="Traitez d'abord les soumissions récentes qui attendent un retour humain."
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
                  description="Les soumissions qui demandent une relecture apparaîtront ici."
                />
              )}
            </DashboardCard>
          </div>

          <div className="space-y-6">
            <DashboardCard
              title="Deadlines proches"
              description="Les échéances à court terme vous aident à prévenir les blocages avant qu'ils ne deviennent des retards."
            >
              {dashboard.deadlines.length ? (
                <DeadlineList
                  items={dashboard.deadlines.map((task) => ({
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
                  description="Les prochaines échéances des tâches supervisées apparaîtront ici."
                />
              )}
            </DashboardCard>

            <DashboardCard
              title="Feedbacks récents donnés"
              description="Vérifiez que vos derniers retours couvrent bien les étudiants qui avancent ou qui bloquent."
            >
              {dashboard.recentFeedbacks.length ? (
                <RecentList
                  items={dashboard.recentFeedbacks.map((feedback) => ({
                    id: feedback.id,
                    title: feedback.title ?? `Évaluation de ${feedback.studentName}`,
                    description: `${feedback.studentName} - ${feedback.projectTitle ?? "Projet"} - Score global ${feedback.globalScore.toFixed(1)}`,
                    meta: new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
                      feedback.createdAt,
                    ),
                  }))}
                />
              ) : (
                <EmptyState
                  title="Aucun feedback récent"
                  description="Les évaluations créées depuis vos projets apparaîtront ici."
                />
              )}
            </DashboardCard>
          </div>
        </div>

        {!hasContent ? (
          <EmptyState
            title="Votre tableau de bord se remplira avec vos premiers projets"
            description="Dès qu'un projet vous est assigné, vous pourrez y suivre les candidatures, livrables et feedbacks depuis ce tableau de bord."
          />
        ) : null}
      </div>
    </DashboardShell>
  );
}
