const items = [
  {
    title: "Projets structures",
    description: "Pédagogiques ou réels, reliés à un niveau et à une capacité.",
  },
  {
    title: "Livrables supervises",
    description: "Chaque soumission suit une room projet et une relecture humaine.",
  },
  {
    title: "Feedbacks verifies",
    description: "Les retours alimentent la progression et les signaux de pilotage.",
  },
  {
    title: "Preuves portfolio",
    description: "Les preuves validées peuvent être exposées dans la vitrine étudiante.",
  },
  {
    title: "Attestations",
    description: "Les emissions restent consultables individuellement avec reference.",
  },
];

export function LandingCredibilityStrip() {
  return (
    <section className="border-y border-slate-200/70 bg-white/78">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-5">
          {items.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.5rem] border border-slate-200/80 bg-white/92 p-5 shadow-sm"
            >
              <p className="text-base font-semibold text-slate-950">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
