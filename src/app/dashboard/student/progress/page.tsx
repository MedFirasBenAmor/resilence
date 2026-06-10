import { connection } from "next/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { SectionHeader } from "@/components/layout/section-header";
import { getStudentProgress } from "@/lib/feedback-data";
import { FeedbackList } from "@/components/scoring/feedback-list";
import { ProgressSummary } from "@/components/scoring/progress-summary";
import { ProjectProgressTable } from "@/components/scoring/project-progress-table";

export const dynamic = "force-dynamic";

export default async function StudentProgressPage() {
  await connection();

  const progress = await getStudentProgress();

  return (
    <DashboardShell>
      <div className="space-y-6">
        <ProgressSummary
          studentName={progress.studentName}
          technicalAverage={progress.technicalAverage}
          maturityAverage={progress.maturityAverage}
          globalScore={progress.globalScore}
          evaluatedProjects={progress.evaluatedProjects}
        />

        <DashboardCard
          title="Progression par projet"
          description="Détail des évaluations reçues sur chaque mission ou projet évalué."
        >
          <ProjectProgressTable projects={progress.projects} />
        </DashboardCard>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <SectionHeader
              title="Feedbacks recus"
              description="Retours qualitatifs et syntheses de score projet par projet."
            />
            <FeedbackList feedbacks={progress.feedbacks} />
          </div>

          <DashboardCard
            title="Lecture rapide"
            description="Relisez d'abord les retours qui combinent un score faible et un commentaire precis, puis revenez sur le detail du projet concerne."
          >
            <div className="space-y-4">
              <div className="rounded-[1.5rem] bg-slate-50/90 p-4">
                <p className="text-sm font-semibold text-slate-900">Technique</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Plus le score est élevé, plus votre exécution, votre qualité de code et votre autonomie sont jugées solides.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50/90 p-4">
                <p className="text-sm font-semibold text-slate-900">Maturité projet</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Cette lecture couvre la fiabilité, la communication, le travail en équipe et le respect des échéances.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50/90 p-4">
                <p className="text-sm font-semibold text-slate-900">Global</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Le score global consolide les deux dimensions pour donner une vision simple et comparable.
                </p>
              </div>
            </div>
          </DashboardCard>
        </section>
      </div>
    </DashboardShell>
  );
}
