import Link from "next/link";
import type { CompanyProjectRequestListItem } from "@/actions/projectRequestActions";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  COMPANY_PROJECT_REQUEST_STATUS_LABELS,
  COMPANY_PROJECT_REQUEST_STATUS_TONES,
} from "@/lib/project-request-ui";

type CompanyProjectRequestsListProps = {
  requests: CompanyProjectRequestListItem[];
};

export function CompanyProjectRequestsList({
  requests,
}: CompanyProjectRequestsListProps) {
  if (!requests.length) {
    return (
      <EmptyState
        title="Aucune demande de projet"
        description="Les cahiers des charges soumis apparaîtront ici avec leur statut de revue admin."
      />
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <article
          key={request.id}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-950">{request.title}</h3>
                <StatusBadge
                  label={COMPANY_PROJECT_REQUEST_STATUS_LABELS[request.status]}
                  tone={COMPANY_PROJECT_REQUEST_STATUS_TONES[request.status]}
                />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{request.shortSummary}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                <span>{request.domain}</span>
                <span>{request.desiredLevel}</span>
                <span>{request.expectedTeamSize} pers.</span>
                <span>{request.estimatedDuration}</span>
              </div>
            </div>
            <Link href={request.specBookUrl} className="app-button-secondary" target="_blank">
              Voir le PDF
            </Link>
          </div>

          {request.adminReviewNote ? (
            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
              <p className="font-medium text-slate-900">Note admin</p>
              <p className="mt-1">{request.adminReviewNote}</p>
            </div>
          ) : null}

          {request.convertedProjectId ? (
            <p className="mt-4 text-sm text-emerald-700">
              Cette demande a ete convertie en projet publie.
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
