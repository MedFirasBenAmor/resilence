type LoadingStateProps = {
  label: string;
};

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div className="app-panel p-8">
      <div className="flex items-center gap-4">
        <div
          className="h-10 w-10 animate-pulse rounded-2xl bg-[linear-gradient(135deg,_rgba(14,165,233,0.22),_rgba(16,185,129,0.2))]"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="mt-1 text-sm text-slate-500">
            L&apos;interface consolide les données utiles pour cette page.
          </p>
        </div>
      </div>
    </div>
  );
}
