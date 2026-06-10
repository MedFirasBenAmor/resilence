import { connection } from "next/server";
import { createProjectAction, listProjectCompanyOptions } from "@/actions/projectActions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectForm } from "@/components/projects/project-form";

export const dynamic = "force-dynamic";

export default async function AdminNewProjectPage() {
  await connection();

  const companies = await listProjectCompanyOptions();

  return (
    <DashboardShell className="max-w-5xl">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Gestion projets"
          title="Creer un nouveau projet"
          description="L'administration pilote la creation des projets, leur cadrage initial et leur publication dans le catalogue."
        />

        <section className="app-panel-strong app-fade-in-up p-8">
          <ProjectForm
            action={createProjectAction}
            submitLabel="Creer le projet"
            companies={companies}
            initialValues={{
              title: "",
              summary: "",
              description: "",
              type: "FICTIONAL",
              status: "DRAFT",
              targetLevel: "LEVEL_1",
              companyId: "",
              capacity: 3,
              startDate: "",
              endDate: "",
              requiredSkillsInput: "",
            }}
          />
        </section>
      </div>
    </DashboardShell>
  );
}
