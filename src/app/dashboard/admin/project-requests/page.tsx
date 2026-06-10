import Link from "next/link";
import { connection } from "next/server";
import { listAdminProjectRequests } from "@/actions/projectRequestActions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DataTableLite } from "@/components/ui/data-table-lite";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  COMPANY_PROJECT_REQUEST_STATUS_LABELS,
  COMPANY_PROJECT_REQUEST_STATUS_TONES,
} from "@/lib/project-request-ui";

export const dynamic = "force-dynamic";

export default async function AdminProjectRequestsPage() {
  await connection();

  const requests = await listAdminProjectRequests();

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Demandes entreprises"
          title="Revue des cahiers de charge"
          description="Pilotez ici les demandes de projets soumises par les entreprises avant conversion en projet publie."
        />

        {requests.length ? (
          <DataTableLite
            headers={["Entreprise", "Demande", "Niveau", "Statut", "Actions"]}
            rows={requests.map((request) => [
              <div key={`${request.id}-company`}>
                <p className="font-medium text-slate-950">{request.companyName}</p>
                <p className="mt-1 text-sm text-slate-500">{request.domain}</p>
              </div>,
              <div key={`${request.id}-request`} className="max-w-md">
                <p className="font-medium text-slate-950">{request.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{request.shortSummary}</p>
              </div>,
              <div key={`${request.id}-level`} className="text-sm text-slate-700">
                <p>{request.desiredLevel}</p>
                <p className="mt-1 text-slate-500">{request.expectedTeamSize} pers.</p>
              </div>,
              <StatusBadge
                key={`${request.id}-status`}
                label={COMPANY_PROJECT_REQUEST_STATUS_LABELS[request.status]}
                tone={COMPANY_PROJECT_REQUEST_STATUS_TONES[request.status]}
              />,
              <div key={`${request.id}-actions`} className="flex flex-wrap gap-2">
                <Link href={`/dashboard/admin/project-requests/${request.id}`} className="app-button-secondary">
                  Ouvrir
                </Link>
                <Link href={request.specBookUrl} className="app-button-secondary" target="_blank">
                  PDF
                </Link>
              </div>,
            ])}
          />
        ) : (
          <EmptyState
            title="Aucune demande entreprise"
            description="Les cahiers des charges soumis par les entreprises apparaîtront ici."
          />
        )}
      </div>
    </DashboardShell>
  );
}
