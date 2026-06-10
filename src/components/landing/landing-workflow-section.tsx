const workflow = [
  "Etudiant",
  "Projet",
  "Candidature",
  "Room",
  "Livrable",
  "Feedback",
  "Score",
  "Portfolio",
  "Attestation",
];

export function LandingWorkflowSection() {
  return (
    <section id="fonctionnement" className="py-20 sm:py-24">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="max-w-2xl">
            <p className="app-eyebrow">Fonctionnement</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Le MVP suit un workflow simple, tracé et exploitable.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Chaque etape ajoute une preuve, une decision ou une lecture utile. Le produit
              doit rendre ce flux intuitif pour le pilote, sans promesses artificielles.
            </p>
          </div>

          <div className="app-panel-strong p-6 sm:p-8">
            <ol className="grid gap-4 md:grid-cols-3">
              {workflow.map((step, index) => (
                <li
                  key={step}
                  className="rounded-[1.6rem] border border-slate-200/85 bg-white/90 p-5 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Etape {index + 1}
                  </p>
                  <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
