type PortfolioScoreSummaryProps = {
  technicalAverage: number;
  maturityAverage: number;
  globalScore: number;
};

export function PortfolioScoreSummary({
  technicalAverage,
  maturityAverage,
  globalScore,
}: PortfolioScoreSummaryProps) {
  const metrics = [
    { label: "Technique", value: technicalAverage, tone: "bg-cyan-400" },
    { label: "Maturité", value: maturityAverage, tone: "bg-emerald-400" },
    { label: "Global", value: globalScore, tone: "bg-slate-900" },
  ];

  return (
    <section className="app-panel p-6">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Synthese de progression</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Les scores consolides reprennent exactement la meme logique que dans le module
        de scoring pour rester cohérents et vérifiables.
      </p>
      <div className="mt-6 space-y-4">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-slate-800">{metric.label}</span>
              <span className="text-slate-500">{Math.round(metric.value)}/100</span>
            </div>
            <div className="app-metric-bar mt-2">
              <span className={metric.tone} style={{ width: `${Math.max(0, Math.min(metric.value, 100))}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
