import { connection } from "next/server";
import { BackButton } from "@/components/navigation/back-button";
import { PublicShell } from "@/components/layout/public-shell";
import { requirePublicPortfolioData } from "@/lib/portfolio-data";
import { PublicPortfolioView } from "@/components/portfolio/public-portfolio-view";

export const dynamic = "force-dynamic";

type PublicPortfolioPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicPortfolioPage({
  params,
}: PublicPortfolioPageProps) {
  await connection();

  const { slug } = await params;
  const portfolio = await requirePublicPortfolioData(slug);

  return (
    <PublicShell>
      <div className="space-y-4">
        <BackButton fallbackHref="/dashboard/student/portfolio" />
        <PublicPortfolioView portfolio={portfolio} />
      </div>
    </PublicShell>
  );
}
