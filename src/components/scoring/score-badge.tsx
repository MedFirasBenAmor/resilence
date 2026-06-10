import { StatusBadge } from "@/components/ui/status-badge";

type ScoreBadgeProps = {
  value: number;
  label?: string;
};

function getScoreTone(value: number) {
  if (value <= 2) {
    return "danger" as const;
  }

  if (value < 4) {
    return "warning" as const;
  }

  return "success" as const;
}

export function ScoreBadge({ value, label }: ScoreBadgeProps) {
  return (
    <StatusBadge
      label={`${label ? `${label}: ` : ""}${value.toFixed(2)}/5`}
      tone={getScoreTone(value)}
    />
  );
}
