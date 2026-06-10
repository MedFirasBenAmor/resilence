import Link from "next/link";
import { CertificateStatus } from "@prisma/client";
import { StatusBadge } from "@/components/ui/status-badge";
import { certificateStatusLabels, certificateStatusTones } from "@/lib/ui/status-labels";

type PortfolioEvidencePanelProps = {
  snapshot: {
    itemCount: number;
    completedProjectCount: number;
    approvedDeliverableCount: number;
    certificateCount: number;
    issuedCertificateCount: number;
    latestCertificate: {
      id: string;
      title: string;
      status: CertificateStatus;
      issuedAt: Date | null;
    } | null;
  };
};

const metricCards = [
  { key: "itemCount", label: "Preuves portfolio" },
  { key: "completedProjectCount", label: "Projets completes" },
  { key: "approvedDeliverableCount", label: "Livrables valides" },
  { key: "issuedCertificateCount", label: "Attestations emises" },
] as const;

export function PortfolioEvidencePanel({ snapshot }: PortfolioEvidencePanelProps) {
  const hasEvidence =
    snapshot.itemCount > 0 ||
    snapshot.completedProjectCount > 0 ||
    snapshot.approvedDeliverableCount > 0 ||
    snapshot.certificateCount > 0;

  return (
    <section className="app-panel p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="app-eyebrow">Portfolio</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Vos preuves de progression
          </h3>
        </div>
        <Link href="/dashboard/student/portfolio" className="app-button-secondary text-sm">
          Voir le portfolio
        </Link>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {metricCards.map((metric) => (
          <article
            key={metric.key}
            className="rounded-[1.45rem] border border-slate-200/75 bg-slate-50/95 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {snapshot[metric.key]}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-[1.45rem] border border-slate-200/85 bg-white/92 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-950">Statut d&apos;attestation</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {snapshot.latestCertificate
                ? snapshot.latestCertificate.title
                : hasEvidence
                  ? "Aucune attestation emise pour l&apos;instant."
                  : "Le portfolio se construit a partir des projets, livrables et feedbacks valides."}
            </p>
          </div>
          {snapshot.latestCertificate ? (
            <StatusBadge
              label={certificateStatusLabels[snapshot.latestCertificate.status]}
              tone={certificateStatusTones[snapshot.latestCertificate.status]}
            />
          ) : null}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.2rem] bg-slate-50/90 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Pieces visibles
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Projets, livrables valides et retours exploitables.
            </p>
          </div>
          <div className="rounded-[1.2rem] bg-slate-50/90 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Croissance portfolio
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Chaque mission terminée renforce votre lecture professionnelle.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
