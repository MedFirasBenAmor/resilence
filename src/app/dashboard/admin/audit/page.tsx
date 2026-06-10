import { connection } from "next/server";
import { UserRole } from "@prisma/client";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DataTableLite } from "@/components/ui/data-table-lite";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAuditLogs, AUDIT_ACTION_LABELS } from "@/lib/admin-audit";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type AdminAuditPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminAuditPage({ searchParams }: AdminAuditPageProps) {
  await connection();
  await requireRole(UserRole.ADMIN, "/dashboard/admin/audit");
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const audit = await listAuditLogs(resolvedSearchParams);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Observabilite"
          title="Journal d'audit admin"
          description="Suivez ici les actions sensibles du MVP: invitations, candidatures, livrables, feedbacks et attestations."
        />

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Evenements filtres
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{audit.totalItems}</p>
            <p className="mt-2 text-sm text-slate-600">Resultats pour la vue courante.</p>
          </div>
          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Dernieres 24h
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{audit.recentCount}</p>
            <p className="mt-2 text-sm text-slate-600">Volume récent, tous événements confondus.</p>
          </div>
          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Page courante
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {audit.filters.page}/{audit.totalPages}
            </p>
            <p className="mt-2 text-sm text-slate-600">{audit.pageSize} lignes maximum par page.</p>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <form className="grid gap-4 md:grid-cols-[1fr_1fr_1.4fr_auto]">
            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium text-slate-900">Action</span>
              <select
                name="action"
                defaultValue={audit.filters.action}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
              >
                <option value="">Toutes les actions</option>
                {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium text-slate-900">Cible</span>
              <input
                name="targetType"
                defaultValue={audit.filters.targetType}
                placeholder="RoleInvitation, Feedback..."
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium text-slate-900">Recherche</span>
              <input
                name="query"
                defaultValue={audit.filters.query}
                placeholder="email acteur, targetId, type..."
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 shadow-sm transition focus:border-sky-400"
              />
            </label>
            <div className="flex items-end gap-2">
              <button type="submit" className="app-button-primary">
                Filtrer
              </button>
              <a href="/dashboard/admin/audit" className="app-button-secondary">
                Reset
              </a>
            </div>
          </form>
        </section>

        {audit.items.length ? (
          <DataTableLite
            headers={["Date", "Action", "Cible", "Acteur", "Details"]}
            rows={audit.items.map((item) => [
              <div key={`${item.id}-date`} className="text-sm text-slate-700">
                <p className="font-medium text-slate-950">
                  {new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(item.createdAt)}
                </p>
              </div>,
              <div key={`${item.id}-action`} className="space-y-2">
                <StatusBadge label={item.actionLabel} tone="neutral" />
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{item.action}</p>
              </div>,
              <div key={`${item.id}-target`} className="text-sm text-slate-700">
                <p className="font-medium text-slate-950">{item.targetType}</p>
                <p className="mt-1 break-all text-slate-500">{item.targetId ?? "Sans targetId"}</p>
              </div>,
              <div key={`${item.id}-actor`} className="text-sm text-slate-700">
                <p className="font-medium text-slate-950">{item.actorName}</p>
                <p className="mt-1 text-slate-500">{item.actorEmail ?? "Systeme"}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                  {item.actorRole ?? "SYSTEM"}
                </p>
              </div>,
              <p key={`${item.id}-details`} className="max-w-md text-sm leading-6 text-slate-600">
                {item.detailsSummary}
              </p>,
            ])}
          />
        ) : (
          <EmptyState
            title="Aucune entree d'audit"
            description="Ajustez les filtres ou declenchez une action sensible pour voir la trace correspondante."
          />
        )}

        <section className="flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-slate-600">
            Page {audit.filters.page} sur {audit.totalPages}
          </p>
          <div className="flex gap-2">
            {audit.filters.page > 1 ? (
              <a
                className="app-button-secondary"
                href={`/dashboard/admin/audit?action=${encodeURIComponent(audit.filters.action)}&targetType=${encodeURIComponent(audit.filters.targetType)}&query=${encodeURIComponent(audit.filters.query)}&page=${audit.filters.page - 1}`}
              >
                Precedent
              </a>
            ) : null}
            {audit.filters.page < audit.totalPages ? (
              <a
                className="app-button-secondary"
                href={`/dashboard/admin/audit?action=${encodeURIComponent(audit.filters.action)}&targetType=${encodeURIComponent(audit.filters.targetType)}&query=${encodeURIComponent(audit.filters.query)}&page=${audit.filters.page + 1}`}
              >
                Suivant
              </a>
            ) : null}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
