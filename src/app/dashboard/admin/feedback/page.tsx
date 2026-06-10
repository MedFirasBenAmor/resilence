import { connection } from "next/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { listAdminFeedback } from "@/lib/feedback-data";
import { AdminFeedbackFilters } from "@/components/scoring/admin-feedback-filters";
import { AdminFeedbackTable } from "@/components/scoring/admin-feedback-table";

export const dynamic = "force-dynamic";

type AdminFeedbackPageProps = {
  searchParams?: Promise<Record<string, string | undefined>>;
};

function buildAdminFeedbackPageHref(
  page: number,
  filters: {
    projectId: string;
    studentId: string;
    evaluatorId: string;
    query: string;
    lowScoreOnly: boolean;
    dateFrom: string;
    dateTo: string;
  },
) {
  const params = new URLSearchParams();

  if (filters.projectId) {
    params.set("projectId", filters.projectId);
  }

  if (filters.studentId) {
    params.set("studentId", filters.studentId);
  }

  if (filters.evaluatorId) {
    params.set("evaluatorId", filters.evaluatorId);
  }

  if (filters.query) {
    params.set("query", filters.query);
  }

  if (filters.lowScoreOnly) {
    params.set("lowScoreOnly", "true");
  }

  if (filters.dateFrom) {
    params.set("dateFrom", filters.dateFrom);
  }

  if (filters.dateTo) {
    params.set("dateTo", filters.dateTo);
  }

  params.set("page", String(page));

  return `/dashboard/admin/feedback?${params.toString()}`;
}

export default async function AdminFeedbackPage({
  searchParams,
}: AdminFeedbackPageProps) {
  await connection();

  const filters = (await searchParams) ?? {};
  const feedback = await listAdminFeedback(filters);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Feedback & scoring"
          title="Supervision admin des évaluations"
          description="Consultez les retours récents, repérez rapidement les scores faibles et gardez une vue transversale sur la progression des étudiants."
          className="app-fade-in-up"
        />

        <AdminFeedbackFilters filters={feedback.filters} />
        <AdminFeedbackTable feedbacks={feedback.items} />

        {feedback.totalItems > 0 ? (
          <div className="app-panel flex items-center justify-between gap-3 p-4">
            <a
              href={
                feedback.page > 1
                  ? buildAdminFeedbackPageHref(feedback.page - 1, feedback.filters)
                  : "#"
              }
              aria-disabled={feedback.page <= 1}
              className="app-button-secondary aria-disabled:pointer-events-none aria-disabled:opacity-40"
            >
              Precedent
            </a>
            <span className="rounded-xl bg-slate-100/90 px-4 py-2 text-sm text-slate-700">
              Page {feedback.page} / {Math.max(feedback.totalPages, 1)}
            </span>
            <a
              href={
                feedback.page < feedback.totalPages
                  ? buildAdminFeedbackPageHref(feedback.page + 1, feedback.filters)
                  : "#"
              }
              aria-disabled={feedback.page >= feedback.totalPages}
              className="app-button-secondary aria-disabled:pointer-events-none aria-disabled:opacity-40"
            >
              Suivant
            </a>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
