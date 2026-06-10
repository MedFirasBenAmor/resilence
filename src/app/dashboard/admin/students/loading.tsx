export default function AdminStudentsLoading() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="animate-pulse space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="h-4 w-44 rounded bg-slate-200" />
          <div className="mt-4 h-8 w-80 rounded bg-slate-200" />
        </div>
        <div className="h-32 rounded-3xl bg-slate-100" />
        <div className="h-96 rounded-3xl bg-slate-100" />
      </div>
    </main>
  );
}
