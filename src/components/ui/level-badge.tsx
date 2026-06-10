import { type StudentLevel, type StudentSubLevel } from "@prisma/client";
import { levelLabels, subLevelLabels } from "@/lib/ui/status-labels";
import { StatusBadge } from "@/components/ui/status-badge";

type LevelBadgeProps = {
  level: StudentLevel;
  subLevel?: StudentSubLevel | null;
};

export function LevelBadge({ level, subLevel }: LevelBadgeProps) {
  return (
    <span className="inline-flex flex-wrap gap-2">
      <StatusBadge label={levelLabels[level]} tone="accent" />
      {subLevel ? <StatusBadge label={subLevelLabels[subLevel]} tone="neutral" /> : null}
    </span>
  );
}
