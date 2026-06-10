import { ApplicationStatus } from "@prisma/client";
import { connection } from "next/server";
import { getProjectDetails } from "@/actions/projectActions";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BackButton } from "@/components/navigation/back-button";
import { ApplicationActions } from "@/components/projects/application-actions";
import { ProjectDetails } from "@/components/projects/project-details";

export const dynamic = "force-dynamic";

type StudentProjectDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StudentProjectDetailsPage({
  params,
}: StudentProjectDetailsPageProps) {
  await connection();

  const { id } = await params;
  const project = await getProjectDetails(id);
  const applicationStatus = project.studentApplication?.status as ApplicationStatus | undefined;

  return (
    <DashboardShell className="max-w-6xl">
      <div className="space-y-6">
        <BackButton fallbackHref="/dashboard/student/projects" />

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <ProjectDetails project={project} />

          <aside className="space-y-6">
            <ApplicationActions
              mode="student"
              projectId={project.id}
              applicationId={project.studentApplication?.id}
              applicationStatus={applicationStatus ?? null}
            />

            <DashboardCard
              title="Avant de candidater"
              description="VÃ©rifiez d'abord que votre niveau, vos compÃ©tences et votre disponibilitÃ© sont cohÃ©rents avec ce projet."
            >
              <div className="space-y-4 text-sm leading-7 text-slate-600">
                <p>
                  Une candidature acceptÃ©e crÃ©e automatiquement votre affectation projet et
                  dÃ©bloque l&apos;accÃ¨s Ã  la room associÃ©e.
                </p>
                <p>
                  Si vous Ãªtes dÃ©jÃ  membre, revenez plutÃ´t Ã  votre tableau de bord ou Ã  la room
                  active pour continuer la mission.
                </p>
              </div>
            </DashboardCard>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
