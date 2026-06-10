type ErrorStateProps = {
  title: string;
  description: string;
};

export function ErrorState({ title, description }: ErrorStateProps) {
  return (
    <div className="rounded-[28px] border border-rose-200 bg-[linear-gradient(135deg,_rgba(255,241,242,1)_0%,_rgba(255,251,235,0.92)_100%)] p-8 shadow-[0_18px_40px_rgba(244,63,94,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
        Probleme de chargement
      </p>
      <h2 className="mt-3 text-xl font-semibold text-rose-950">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-rose-800">{description}</p>
    </div>
  );
}
