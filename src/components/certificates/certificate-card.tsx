import Link from "next/link";
import { type PortfolioCertificateRow } from "@/lib/portfolio-data";
import { CertificateStatusBadge } from "@/components/certificates/certificate-status-badge";

type CertificateCardProps = {
  certificate: PortfolioCertificateRow;
};

export function CertificateCard({ certificate }: CertificateCardProps) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white/92 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{certificate.title}</h3>
          <p className="mt-2 text-sm text-slate-600">
            {certificate.projectTitle ?? "Attestation generale"} • Ref. {certificate.referenceCode}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
            Code de vérification {certificate.verificationCode}
          </p>
        </div>
        <CertificateStatusBadge status={certificate.status} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={`/certificates/${certificate.id}`}
          className="inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Voir l&apos;attestation
        </Link>
        {certificate.issuedAt ? (
          <p className="text-sm text-slate-500">
            Emise le{" "}
            {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
              certificate.issuedAt,
            )}
          </p>
        ) : (
          <p className="text-sm text-slate-500">Attestation en preparation</p>
        )}
      </div>
    </article>
  );
}
