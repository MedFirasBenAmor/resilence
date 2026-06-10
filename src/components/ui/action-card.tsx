import { LinkButton } from "@/components/ui/button";

type ActionCardProps = {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
};

export function ActionCard({ title, description, href, ctaLabel }: ActionCardProps) {
  return (
    <article className="app-panel app-hover-card app-fade-in-up relative overflow-hidden p-5 sm:p-6">
      <div aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
      <h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
      <div className="mt-5 border-t border-slate-200/80 pt-4">
        <LinkButton href={href} variant="secondary" className="w-full justify-between sm:w-auto">
          <span>{ctaLabel}</span>
          <span aria-hidden="true">→</span>
        </LinkButton>
      </div>
    </article>
  );
}
