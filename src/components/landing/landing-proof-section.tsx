export function LandingProofSection() {
  return (
    <section className="bg-white/70 py-20 sm:py-24">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
        <section className="app-panel-strong p-7 sm:p-8">
          <p className="app-eyebrow">Portfolio</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Une vitrine construite a partir de preuves, pas d&apos;affirmations.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Les projets significatifs, les livrables valides et les feedbacks utiles
            deviennent les elements centraux du profil public.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-slate-50/95 p-5">
              <p className="text-sm font-semibold text-slate-900">Preuves visibles</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Projets, livrables, scores et retours selectionnes.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-50/95 p-5">
              <p className="text-sm font-semibold text-slate-900">Contrôle étudiant</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
              Le portfolio public reste activable et configurable.
              </p>
            </div>
          </div>
        </section>

        <section className="app-panel p-7 sm:p-8">
          <p className="app-eyebrow">Attestations</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Des attestations verifiables, contextualisees et credibles.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Le produit doit mettre en avant la trace projet, le niveau, le contexte
            d&apos;émission et la référence de vérification, sans recourir à des claims
            techniques non supportes.
          </p>
          <div className="mt-6 rounded-[1.8rem] border border-amber-100 bg-[linear-gradient(145deg,_rgba(255,251,235,0.96),_rgba(255,255,255,0.99))] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Page attestation
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Référence, émetteur, projet et compétences mobilisées
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              L&apos;objectif n&apos;est pas de surjouer la securite, mais de rendre la lecture
              institutionnelle, fiable et verifiable.
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}
