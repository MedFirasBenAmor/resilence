import { LinkButton } from "@/components/ui/button";

export function LandingFinalCta() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.2rem] bg-[linear-gradient(145deg,_#0f172a_0%,_#102b47_52%,_#12385d_100%)] px-6 py-12 text-white shadow-[0_30px_90px_rgba(15,23,42,0.2)] sm:px-10 sm:py-16">
          <div className="absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              Pilotage MVP
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Lancez un parcours pilote avec une base déjà structurée.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Créez un compte étudiant pour démarrer, ou reconnectez-vous pour retrouver
              les dashboards, les rooms et les preuves déjà suivies.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LinkButton href="/register" variant="secondary">
                Créer un compte étudiant
              </LinkButton>
              <LinkButton href="/login">Se connecter</LinkButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
