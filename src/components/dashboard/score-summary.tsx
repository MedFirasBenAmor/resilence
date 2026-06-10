import { ProgressMetric } from "@/components/ui/progress-metric";

type ScoreSummaryProps = {
  technicalAverage: number;
  maturityAverage: number;
  globalScore: number;
  feedbackCount: number;
};

function getScoreTone(value: number) {
  if (value >= 4) return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (value >= 3) return "bg-amber-50 text-amber-800 border-amber-200";
  if (value > 0) return "bg-rose-50 text-rose-800 border-rose-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

type ScoreCellProps = {
  label: string;
  value: number;
};

function ScoreCell({ label, value }: ScoreCellProps) {
  return (
    <div className={`rounded-2xl border px-4 py-4 ${getScoreTone(value)}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em]">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value.toFixed(1)}</p>
    </div>
  );
}

export function ScoreSummary({
  technicalAverage,
  maturityAverage,
  globalScore,
  feedbackCount,
}: ScoreSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <ScoreCell label="Technique" value={technicalAverage} />
        <ScoreCell label="Maturité" value={maturityAverage} />
        <ScoreCell label="Global" value={globalScore} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <ProgressMetric label="Execution technique" value={technicalAverage} />
        <ProgressMetric label="Maturité professionnelle" value={maturityAverage} />
        <ProgressMetric label="Cap global" value={globalScore} />
      </div>
      <p className="text-sm text-slate-600">
        {feedbackCount > 0
          ? `${feedbackCount} évaluation(s) consolidée(s) pour guider votre prochaine action.`
          : "Aucune évaluation enregistrée pour l'instant."}
      </p>
    </div>
  );
}
