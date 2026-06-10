import { StudentLevel, StudentSubLevel } from "@prisma/client";
import { ProgressMetric } from "@/components/ui/progress-metric";
import { levelLabels, subLevelLabels } from "@/lib/ui/status-labels";

type ScoreProgressionCardProps = {
  level: StudentLevel | null;
  subLevel: StudentSubLevel | null;
  technicalAverage: number;
  maturityAverage: number;
  globalScore: number;
  feedbackCount: number;
};

export function ScoreProgressionCard({
  level,
  subLevel,
  technicalAverage,
  maturityAverage,
  globalScore,
  feedbackCount,
}: ScoreProgressionCardProps) {
  const hasScore = feedbackCount > 0;

  return (
    <section className="app-panel p-6">
      <p className="app-eyebrow">Progression</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Snapshot</h3>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-4xl font-semibold tracking-tight text-slate-950">
            {hasScore ? globalScore.toFixed(1) : "0.0"}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {hasScore ? "sur 5 consolide" : "Pas encore evalue"}
          </p>
        </div>
        <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50/95 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Niveau actuel
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {level ? levelLabels[level] : "A completer"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {subLevel ? subLevelLabels[subLevel] : "Sous-niveau non renseigne"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MiniStat label="Technique" value={technicalAverage.toFixed(1)} />
        <MiniStat label="Maturité" value={maturityAverage.toFixed(1)} />
      </div>

      <div className="mt-5 space-y-4">
        <ProgressMetric label="Technique" value={technicalAverage} />
        <ProgressMetric label="Maturité" value={maturityAverage} />
      </div>

      <p className="mt-5 text-sm leading-6 text-slate-600">
        {hasScore
          ? `${feedbackCount} évaluation(s) consolidée(s). Tendance positive si vos prochains retours confirment l'exécution et la maturité.`
          : "Le score apparaît après vos premiers livrables et retours de supervision."}
      </p>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] bg-slate-50/95 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
