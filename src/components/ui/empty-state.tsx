import { LinkButton } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="app-panel-muted p-8 text-center">
      <div className="mx-auto max-w-xl">
        <p className="app-eyebrow">
          Etat vide
        </p>
        <h2 className="mt-3 text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        {actionHref && actionLabel ? (
          <LinkButton
            href={actionHref}
            className="mt-5"
            variant="secondary"
          >
            {actionLabel}
          </LinkButton>
        ) : null}
      </div>
    </div>
  );
}
