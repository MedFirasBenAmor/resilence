import Link from "next/link";
import { connection } from "next/server";
import { getStudentPortfolioData } from "@/lib/portfolio-data";
import { CertificateCard } from "@/components/certificates/certificate-card";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/layout/section-header";
import { PortfolioDeliverableList } from "@/components/portfolio/portfolio-deliverable-list";
import { PortfolioFeedbackList } from "@/components/portfolio/portfolio-feedback-list";
import { PortfolioHeader } from "@/components/portfolio/portfolio-header";
import { PortfolioProjectList } from "@/components/portfolio/portfolio-project-list";
import { PortfolioScoreSummary } from "@/components/portfolio/portfolio-score-summary";
import { PortfolioVisibilitySettings } from "@/components/portfolio/portfolio-visibility-settings";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function StudentPortfolioPage() {
  await connection();

  const portfolio = await getStudentPortfolioData();

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Portfolio"
          title="Votre vitrine professionnelle."
          description="Page partageable aupres des recruteurs. Vous controlez ici ce qui est visible publiquement, ce qui reste prive et les preuves les plus solides de votre progression."
          actions={
            <>
              {portfolio.profile.publicPortfolioPath ? (
                <Link href={portfolio.profile.publicPortfolioPath} className="app-button-secondary">
                  Apercu public
                </Link>
              ) : null}
              <Link href="/dashboard/student/profile" className="app-button-primary">
                Completer le profil
              </Link>
            </>
          }
        />

        <PortfolioHeader
          profile={portfolio.profile}
          globalScore={portfolio.scoreSummary.globalScore}
          projectCount={portfolio.projects.length}
          deliverableCount={portfolio.deliverables.length}
        />

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-6">
            <PortfolioScoreSummary {...portfolio.scoreSummary} />
            <section className="app-panel p-6">
              <p className="app-eyebrow">Competences cles</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Competences mises en avant
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Gardez une liste courte, claire et crédible des compétences que vous savez déjà mobiliser en projet.
              </p>
              {portfolio.profile.skills.length ? (
                <div className="mt-6 space-y-4">
                  {portfolio.profile.skills.slice(0, 5).map((skill, index) => {
                    const value = Math.max(58, 90 - index * 8);

                    return (
                      <div key={skill}>
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="font-medium text-slate-800">{skill}</span>
                          <span className="text-slate-500">{value}%</span>
                        </div>
                        <div className="app-metric-bar mt-2">
                          <span className="bg-cyan-400" style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5">
                  <EmptyState
                    title="Aucune competence renseignee"
                    description="Ajoutez vos compétences sur votre profil pour mieux représenter votre posture actuelle."
                    actionHref="/dashboard/student/profile"
                    actionLabel="Completer le profil"
                  />
                </div>
              )}
            </section>
          </section>

          <div className="space-y-6">
            <PortfolioVisibilitySettings
              isPortfolioPublic={portfolio.profile.isPortfolioPublic}
              portfolioSlug={portfolio.profile.portfolioSlug}
              publicPortfolioPath={portfolio.profile.publicPortfolioPath}
            />

            <section className="app-panel p-6">
              <p className="app-eyebrow">Attestations</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Attestations verifiables
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Vos attestations sont signées par l&apos;établissement ou les superviseurs autorisés et restent consultables individuellement.
              </p>
              <div className="mt-5 rounded-[1.5rem] bg-slate-50/90 px-4 py-4">
                <p className="text-4xl font-semibold tracking-tight text-slate-950">
                  {portfolio.certificates.length}
                </p>
                <p className="mt-2 text-sm text-slate-500">attestation(s) emise(s)</p>
              </div>
            </section>
          </div>
        </div>

        <section className="space-y-4">
          <SectionHeader
            title="Projets significatifs"
            description="Montrez d'abord les projets qui traduisent le mieux votre niveau de professionnalisation."
          />
          <PortfolioProjectList projects={portfolio.projects} />
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="Livrables valides"
            description="Cette section sert de preuve concrete de ce qui a ete produit et valide."
          />
          <PortfolioDeliverableList deliverables={portfolio.deliverables} />
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="Feedbacks recus"
            description="Gardez visibles les retours les plus utiles pour expliquer votre progression."
          />
          <PortfolioFeedbackList feedbacks={portfolio.feedbacks} />
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="Attestations emises"
            description="Chaque attestation reste verifiable individuellement depuis sa page dediee."
          />
          {portfolio.certificates.length ? (
            <div className="space-y-4">
              {portfolio.certificates.map((certificate) => (
                <CertificateCard key={certificate.id} certificate={certificate} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucune attestation emise"
              description="Les attestations apparaîtront ici lorsqu'un admin ou un superviseur autorisé validera une preuve professionnelle émise."
            />
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
