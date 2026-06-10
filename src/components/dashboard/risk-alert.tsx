type RiskAlertProps = {
  title: string;
  description: string;
  severity?: "high" | "medium";
};

function getToneClass(severity: RiskAlertProps["severity"]) {
  if (severity === "high") {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }

  return "border-amber-200 bg-amber-50 text-amber-900";
}

export function RiskAlert({
  title,
  description,
  severity = "medium",
}: RiskAlertProps) {
  return (
    <article className={`rounded-2xl border p-4 ${getToneClass(severity)}`}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6">{description}</p>
    </article>
  );
}
