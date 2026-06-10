import { type CertificateRecordView } from "@/actions/certificateActions";
import { CertificateStatusBadge } from "@/components/certificates/certificate-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LevelBadge } from "@/components/ui/level-badge";

type CertificatePageProps = {
  certificate: CertificateRecordView;
};

export function CertificatePage({ certificate }: CertificatePageProps) {
  return (
    <div className="mx-auto max-w-5xl px-2 py-4 sm:px-4 sm:py-8">
      <section className="app-panel-strong overflow-hidden p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="app-eyebrow">
              Attestation verifiable
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {certificate.title}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Cette attestation confirme la participation et la progression professionnelle
              de {certificate.studentName}.
            </p>
          </div>
          <CertificateStatusBadge status={certificate.status} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="app-panel-muted p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Etudiant
            </p>
            <p className="mt-3 text-xl font-semibold text-slate-950">{certificate.studentName}</p>
            <div className="mt-4">
              <LevelBadge level={certificate.level} />
            </div>
          </div>
          <div className="app-panel-muted p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Verification
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              Reference {certificate.referenceCode}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Code {certificate.verificationCode}
            </p>
            {certificate.issuedAt ? (
              <p className="mt-3 text-sm text-slate-600">
                Emise le{" "}
                {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
                  certificate.issuedAt,
                )}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="app-panel p-6">
              <h2 className="text-lg font-semibold text-slate-950">Contexte projet</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Projet
                  </dt>
                  <dd className="mt-2 text-sm text-slate-700">
                    {certificate.projectTitle ?? "Attestation non rattachée à un projet unique"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Superviseur
                  </dt>
                  <dd className="mt-2 text-sm text-slate-700">
                    {certificate.supervisorName ?? "Non renseigne"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Emise par
                  </dt>
                  <dd className="mt-2 text-sm text-slate-700">
                    {certificate.issuerName ?? "Non renseigne"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Periode
                  </dt>
                  <dd className="mt-2 text-sm text-slate-700">
                    {certificate.membershipPeriod?.startedAt
                      ? new Intl.DateTimeFormat("fr-FR", {
                          dateStyle: "medium",
                        }).format(certificate.membershipPeriod.startedAt)
                      : "Debut non renseigne"}
                    {certificate.membershipPeriod?.endedAt
                      ? ` - ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(certificate.membershipPeriod.endedAt)}`
                      : ""}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="app-panel p-6">
              <h2 className="text-lg font-semibold text-slate-950">Synthese</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {certificate.summary ??
                  "Cette attestation confirme la mobilisation des compétences attendues sur le périmètre de travail validé."}
              </p>
            </section>
          </div>

          <section className="app-panel p-6">
            <h2 className="text-lg font-semibold text-slate-950">Competences mobilisees</h2>
            {certificate.skills.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {certificate.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState
                  title="Competences non renseignees"
                  description="Les compétences mobilisées n'ont pas encore été documentées pour cette attestation."
                />
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
