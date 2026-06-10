import Link from "next/link";
import { type StudentPortfolioData } from "@/lib/portfolio-data";
import { LevelBadge } from "@/components/ui/level-badge";
import { StatusBadge } from "@/components/ui/status-badge";

type PortfolioHeaderProps = {
  profile: StudentPortfolioData["profile"];
  globalScore: number;
  projectCount: number;
  deliverableCount: number;
};

function getInitials(label: string) {
  return label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function PortfolioLink({
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

export function PortfolioHeader({
  profile,
  globalScore,
  projectCount,
  deliverableCount,
}: PortfolioHeaderProps) {
  return (
    <section className="app-panel-strong app-fade-in-up p-6 sm:p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 flex-1 gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.8rem] bg-slate-900 text-3xl font-semibold text-white shadow-[0_16px_36px_rgba(15,23,42,0.16)]">
            {getInitials(profile.displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="app-eyebrow">Portfolio étudiant</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {profile.displayName}
              </h1>
              <StatusBadge
                label={profile.isPortfolioPublic ? "Visible publiquement" : "Prive"}
                tone={profile.isPortfolioPublic ? "success" : "neutral"}
              />
              <LevelBadge level={profile.level} subLevel={profile.subLevel} />
            </div>
            {profile.headline ? (
              <p className="mt-3 text-lg text-slate-700">{profile.headline}</p>
            ) : null}
            {profile.bio ? (
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{profile.bio}</p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <PortfolioLink href={profile.cvUrl} label="CV" />
              <PortfolioLink href={profile.githubUrl} label="GitHub" />
              <PortfolioLink href={profile.linkedinUrl} label="LinkedIn" />
              <PortfolioLink href={profile.portfolioUrl} label="Site externe" />
              {profile.publicPortfolioPath ? (
                <PortfolioLink href={profile.publicPortfolioPath} label="Version publique" />
              ) : null}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 xl:w-[250px] xl:grid-cols-1">
          <MetricBox label="Score" value={String(Math.round(globalScore))} />
          <MetricBox label="Projets" value={String(projectCount)} />
          <MetricBox label="Livrables" value={String(deliverableCount)} />
        </div>
      </div>
    </section>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200/90 bg-white/86 px-4 py-5 text-center shadow-sm">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}
