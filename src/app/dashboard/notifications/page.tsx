import Link from "next/link";
import { connection } from "next/server";
import {
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from "@/actions/notificationActions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getNotificationsForCurrentUser } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  await connection();

  const notifications = await getNotificationsForCurrentUser(100);
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <DashboardShell className="max-w-5xl">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Centre de notifications"
          title="Notifications"
          description="Retrouvez ici les événements importants de votre parcours : candidatures, validations, livrables, feedbacks et attestations."
          actions={
            unreadCount > 0 ? (
              <form action={markAllNotificationsAsReadAction}>
                <button type="submit" className="app-button-secondary">
                  Tout marquer comme lu
                </button>
              </form>
            ) : null
          }
        />

        <section className="app-panel rounded-[1.9rem] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {notifications.length} notification(s)
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {unreadCount} non lue(s)
              </p>
            </div>
          </div>

          {notifications.length ? (
            <div className="mt-5 space-y-4">
              {notifications.map((notification) => {
                const isUnread = !notification.readAt;

                return (
                  <article
                    key={notification.id}
                    className={`rounded-[1.5rem] border px-5 py-4 ${
                      isUnread
                        ? "border-cyan-200 bg-cyan-50/60"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold text-slate-950">
                            {notification.title}
                          </h2>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                              isUnread
                                ? "bg-cyan-100 text-cyan-900"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {isUnread ? "Non lue" : "Lue"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {notification.message}
                        </p>
                        <p className="mt-3 text-xs font-medium text-slate-500">
                          {new Intl.DateTimeFormat("fr-FR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(notification.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {notification.href ? (
                          <Link href={notification.href} className="app-button-secondary">
                            Ouvrir
                          </Link>
                        ) : null}
                        {isUnread ? (
                          <form action={markNotificationAsReadAction}>
                            <input type="hidden" name="notificationId" value={notification.id} />
                            <button type="submit" className="app-button-secondary">
                              Marquer comme lu
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="Aucune notification"
                description="Les prochaines candidatures, validations, revues ou attestations apparaîtront ici."
              />
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
