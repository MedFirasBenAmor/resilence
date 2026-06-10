const levels = [
  {
    index: "01",
    title: "Niveau 1",
    subtitle: "Projets pédagogiques guidés",
    description:
      "Les étudiants consolident leur base avec des projets cadrés, des attentes claires et une supervision rapprochée.",
    tone:
      "border-sky-100 bg-[linear-gradient(180deg,_rgba(240,249,255,0.95),_rgba(255,255,255,0.98))]",
    badge: "bg-sky-100 text-sky-800",
  },
  {
    index: "02",
    title: "Niveau 2",
    subtitle: "Projets réels en entreprise",
    description:
      "Les candidatures, les memberships, les rooms et les livrables relient la progression a des contextes professionnels concrets.",
    tone:
      "border-emerald-100 bg-[linear-gradient(180deg,_rgba(236,253,245,0.95),_rgba(255,255,255,0.98))]",
    badge: "bg-emerald-100 text-emerald-800",
  },
  {
    index: "03",
    title: "Niveau 3",
    subtitle: "Autonomie professionnelle",
    description:
      "La plateforme consolide les preuves, les feedbacks et les attestations pour rendre l'autonomie visible et partageable.",
    tone:
      "border-amber-100 bg-[linear-gradient(180deg,_rgba(255,251,235,0.96),_rgba(255,255,255,0.99))]",
    badge: "bg-amber-100 text-amber-800",
  },
];

export function LandingProgressionSection() {
  return (
    <section id="parcours" className="py-20 sm:py-24">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="app-eyebrow">Parcours</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Une progression en trois niveaux, lisible par l&apos;étudiant comme par l&apos;institution.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Le cahier de charge se traduit en parcours progressif: guider, confronter au
            réel, puis rendre l&apos;autonomie démontrable.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {levels.map((level) => (
            <article
              key={level.index}
              className={`app-hover-card rounded-[2rem] border p-7 shadow-sm ${level.tone}`}
            >
              <div className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${level.badge}`}>
                {level.title}
              </div>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                {level.index}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                {level.subtitle}
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{level.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
