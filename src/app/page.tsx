import { LandingCredibilityStrip } from "@/components/landing/landing-credibility-strip";
import { LandingFinalCta } from "@/components/landing/landing-final-cta";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingProofSection } from "@/components/landing/landing-proof-section";
import { LandingProgressionSection } from "@/components/landing/landing-progression-section";
import { LandingValueSection } from "@/components/landing/landing-value-section";
import { LandingWorkflowSection } from "@/components/landing/landing-workflow-section";

export default function HomePage() {
  return (
    <main className="app-shell-bg min-h-screen text-slate-950">
      <LandingHeader />
      <LandingHero />
      <LandingCredibilityStrip />
      <LandingProgressionSection />
      <LandingValueSection />
      <LandingWorkflowSection />
      <LandingProofSection />
      <LandingFinalCta />
      <LandingFooter />
    </main>
  );
}
