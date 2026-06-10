type ProgressSummaryProps = {
  studentName: string;
  technicalAverage: number;
  maturityAverage: number;
  globalScore: number;
  evaluatedProjects: number;
};

export function ProgressSummary({
  studentName,
  technicalAverage,
  maturityAverage,
  globalScore,
  evaluatedProjects,
}: ProgressSummaryProps) {
  const metrics = [
    { label: "Score technique", value: technicalAverage, tone: "bg-cyan-400" },
    { label: "Maturité projet", value: maturityAverage, tone: "bg-emerald-400" },
    { label: "Score global", value: globalScore, tone: "bg-slate-900" },
  ];

  return (
    <section className="app-panel-strong app-fade-in-up p-8">
      <p className="app-eyebrow">Progression</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        Votre parcours, en chiffres et en retours.
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
        {studentName}, cette vue consolide vos scores techniques, votre maturite projet
        et l&apos;historique des feedbacks déjà reçus.
      </p>
      <div className="mt-7 rounded-[1.75rem] border border-sky-100/90 bg-[linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(236,253,245,0.82))] p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr_auto]">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {metric.label}
              </p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-tight text-slate-950">
                  {Math.round(metric.value)}
                </span>
                <span className="pb-1 text-base text-slate-500">/100</span>
              </div>
              <div className="app-metric-bar mt-4">
                <span className={metric.tone} style={{ width: `${Math.max(0, Math.min(metric.value, 100))}%` }} />
              </div>
            </div>
          ))}
          <div className="rounded-[1.4rem] bg-white/80 px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Projets evalues</p>
            <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">{evaluatedProjects}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
