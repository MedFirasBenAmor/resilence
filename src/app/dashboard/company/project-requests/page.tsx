import Link from "next/link";
import { connection } from "next/server";
import { listCompanyProjectRequests } from "@/actions/projectRequestActions";
import { CompanyProjectRequestForm } from "@/components/company/company-project-request-form";
import { CompanyProjectRequestsList } from "@/components/company/company-project-requests-list";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function CompanyProjectRequestsPage() {
  await connection();

  const requests = await listCompanyProjectRequests();

  return (
    <DashboardShell className="max-w-7xl">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Demandes entreprises"
          title="Demandes de projets"
          description="Soumettez ici un cahier des charges entreprise. L'administration le relira, l'approuvera ou le convertira ensuite en projet publié."
          actions={
            <Link href="/dashboard/company" className="app-button-secondary">
              Retour dashboard
            </Link>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <CompanyProjectRequestForm />
          <section className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Historique de vos demandes</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Retrouvez le statut de revue, les notes admin et les demandes déjà converties en projets.
              </p>
            </div>
            <CompanyProjectRequestsList requests={requests} />
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
