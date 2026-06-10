const valueCards = [
  {
    title: "Etudiants",
    description:
      "Comprendre quoi faire ensuite, prouver ce qui a été produit et transformer les évaluations en progression visible.",
    points: [
      "Candidatures et rooms projet",
      "Livrables et feedbacks traces",
      "Portfolio et attestations partageables",
    ],
    accent: "from-sky-50 to-white",
  },
  {
    title: "Superviseurs",
    description:
      "Suivre les cohortes, arbitrer les candidatures, relire les livrables et publier un feedback actionnable.",
    points: [
      "Pilotage des candidatures",
      "Suivi des blocages et deadlines",
      "Evaluation et scoring projet",
    ],
    accent: "from-slate-900 to-[#12385d]",
    inverse: true,
  },
  {
    title: "Entreprises",
    description:
      "Lire les projets réels, suivre les talents affectés et contribuer au feedback sans alourdir le workflow.",
    points: [
      "Vue room sur projets entreprise",
      "Lecture des livrables soumis",
      "Feedback qualifié sur les étudiants affectés",
    ],
    accent: "from-emerald-50 to-white",
  },
  {
    title: "Institutions et admins",
    description:
      "Piloter la validation, surveiller les risques, gérer les accès sensibles et garder une lecture programme claire.",
    points: [
      "Validation académique et audit",
      "Portefeuille projets et alertes",
      "Acces admin, superviseur et entreprise",
    ],
    accent: "from-amber-50 to-white",
  },
];

export function LandingValueSection() {
  return (
    <section id="valeur" className="bg-white/70 py-20 sm:py-24">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="app-eyebrow">Valeur</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Une meme plateforme, quatre lectures utiles du meme parcours.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            La landing doit montrer que le produit n&apos;est pas une simple vitrine étudiante :
            c&apos;est un système de coordination entre étudiants, supervision, entreprises et pilotage.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {valueCards.map((card) => (
            <article
              key={card.title}
              className={`rounded-[2rem] border border-slate-200/80 bg-gradient-to-br p-7 shadow-sm ${
                card.inverse ? "text-white" : "text-slate-950"
              } ${card.accent}`}
            >
              <h3 className="text-2xl font-semibold tracking-tight">{card.title}</h3>
              <p
                className={`mt-4 text-sm leading-7 ${
                  card.inverse ? "text-slate-200" : "text-slate-600"
                }`}
              >
                {card.description}
              </p>
              <ul className="mt-6 space-y-3">
                {card.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm leading-6">
                    <span
                      className={`mt-1 h-2.5 w-2.5 rounded-full ${
                        card.inverse ? "bg-emerald-300" : "bg-slate-900"
                      }`}
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
