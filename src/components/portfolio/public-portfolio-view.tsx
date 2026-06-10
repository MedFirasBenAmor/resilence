import Link from "next/link";
import { type PublicPortfolioData } from "@/lib/portfolio-data";
import { CertificateCard } from "@/components/certificates/certificate-card";
import { PortfolioDeliverableList } from "@/components/portfolio/portfolio-deliverable-list";
import { PortfolioProjectList } from "@/components/portfolio/portfolio-project-list";
import { PortfolioScoreSummary } from "@/components/portfolio/portfolio-score-summary";
import { LevelBadge } from "@/components/ui/level-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { canExposeDetailedPublicFeedback } from "@/lib/portfolio-access";

type PublicPortfolioViewProps = {
  portfolio: PublicPortfolioData;
};

function PublicLink({
  href,
  label,
}: {
  href: string | null;
  label: string;
}) {
  if (!href) {
    return null;
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
    >
      {label}
    </Link>
  );
}

export function PublicPortfolioView({ portfolio }: PublicPortfolioViewProps) {
  return (
    <div className="mx-auto max-w-6xl px-2 py-4 sm:px-4 sm:py-8">
      <div className="space-y-6">
        <section className="app-panel-strong p-6 sm:p-8">
          <p className="app-eyebrow">
            Portfolio public
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-[3rem]">
            {portfolio.displayName}
          </h1>
          {portfolio.headline ? (
            <p className="mt-3 text-lg text-slate-700">{portfolio.headline}</p>
          ) : null}
          {portfolio.bio ? (
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{portfolio.bio}</p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <LevelBadge level={portfolio.level} subLevel={portfolio.subLevel} />
            <PublicLink href={portfolio.cvUrl} label="CV" />
            <PublicLink href={portfolio.githubUrl} label="GitHub" />
            <PublicLink href={portfolio.linkedinUrl} label="LinkedIn" />
            <PublicLink href={portfolio.portfolioUrl} label="Site externe" />
          </div>
          {portfolio.skills.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {portfolio.skills.map((skill) => (
                <span
                  key={skill}
                  className="app-chip"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <PortfolioScoreSummary {...portfolio.scoreSummary} />

        <section className="space-y-4">
          <div className="app-panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">Projets mis en avant</h2>
            <p className="mt-2 text-sm text-slate-600">
              Les projets présentés ici correspondent à des travaux actifs ou terminés avec
              une valeur professionnelle partageable.
            </p>
          </div>
          <PortfolioProjectList projects={portfolio.projects} publicView />
        </section>

        <section className="space-y-4">
          <div className="app-panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">Livrables valides</h2>
            <p className="mt-2 text-sm text-slate-600">
              Seuls les livrables explicitement valides sont exposes publiquement.
            </p>
          </div>
          <PortfolioDeliverableList deliverables={portfolio.deliverables} />
        </section>

        <section className="space-y-4">
          <div className="app-panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">Attestations emises</h2>
            <p className="mt-2 text-sm text-slate-600">
              {canExposeDetailedPublicFeedback()
                ? "Des feedbacks publics selectionnes peuvent etre affiches ici."
                : "Les feedbacks detailles restent prives dans ce MVP, mais les attestations publiees restent verifiables."}
            </p>
          </div>
          {portfolio.certificates.length ? (
            <div className="space-y-4">
              {portfolio.certificates.map((certificate) => (
                <CertificateCard key={certificate.id} certificate={certificate} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucune attestation publique"
              description="Les attestations émises apparaîtront ici lorsqu'elles seront disponibles."
            />
          )}
        </section>
      </div>
    </div>
  );
}
