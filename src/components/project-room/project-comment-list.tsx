import { EmptyState } from "@/components/ui/empty-state";

type ProjectCommentListProps = {
  comments: Array<{
    id: string;
    body: string;
    createdAt: Date;
    authorName: string;
    deliverableTitle: string | null;
  }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function ProjectCommentList({ comments }: ProjectCommentListProps) {
  if (!comments.length) {
    return (
      <EmptyState
        title="Aucun commentaire"
        description="Ajoutez un message de suivi pour clarifier une décision, un blocage ou la prochaine étape."
      />
    );
  }

  return (
    <section className="space-y-4">
      {comments.map((comment) => (
        <article key={comment.id} className="app-panel app-hover-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-950">{comment.authorName}</h3>
            <p className="text-sm text-slate-500">{formatDate(comment.createdAt)}</p>
          </div>
          {comment.deliverableTitle ? (
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Lié au livrable: {comment.deliverableTitle}
            </p>
          ) : null}
          <div className="mt-4 rounded-[1.3rem] bg-slate-50/90 px-4 py-4">
            <p className="text-sm leading-7 text-slate-700">{comment.body}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
