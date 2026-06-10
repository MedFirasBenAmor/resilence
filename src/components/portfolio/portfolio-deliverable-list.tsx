import Link from "next/link";
import { type PortfolioDeliverableRow } from "@/lib/portfolio-data";
import { DeliverableStatusBadge } from "@/components/project-room/deliverable-status-badge";
import { EmptyState } from "@/components/ui/empty-state";

type PortfolioDeliverableListProps = {
  deliverables: PortfolioDeliverableRow[];
};

export function PortfolioDeliverableList({
  deliverables,
}: PortfolioDeliverableListProps) {
  if (!deliverables.length) {
    return (
      <EmptyState
        title="Aucun livrable valide"
        description="Les livrables approuves ou valides apparaissent ici pour appuyer votre preuve de progression."
      />
    );
  }

  return (
    <div className="space-y-4">
      {deliverables.map((deliverable) => (
        <article key={deliverable.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <h3 className="text-lg font-semibold text-slate-950">{deliverable.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{deliverable.projectTitle}</p>
              {deliverable.description ? (
                <p className="mt-3 text-sm leading-6 text-slate-700">{deliverable.description}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                {deliverable.submissionUrl ? (
                  <Link href={deliverable.submissionUrl} target="_blank" rel="noreferrer" className="font-medium text-sky-700 hover:text-sky-900">
                    Ouvrir la soumission
                  </Link>
                ) : null}
                {deliverable.repositoryUrl ? (
                  <Link href={deliverable.repositoryUrl} target="_blank" rel="noreferrer" className="font-medium text-sky-700 hover:text-sky-900">
                    Voir le repository
                  </Link>
                ) : null}
              </div>
            </div>
            <DeliverableStatusBadge status={deliverable.status} />
          </div>
        </article>
      ))}
    </div>
  );
}
