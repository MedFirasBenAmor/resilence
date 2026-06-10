import { UserRole } from "@prisma/client";
import { RoleInvitationForm } from "@/components/auth/role-invitation-form";
import { RoleInvitationsTable } from "@/components/auth/role-invitations-table";
import { SupervisorAccountForm } from "@/components/auth/supervisor-account-form";
import { listRoleInvitations } from "@/lib/auth/invitations";
import { requireRole } from "@/lib/rbac";

export default async function AdminAccessPage() {
  await requireRole(UserRole.ADMIN, "/dashboard/admin/access");
  const invitations = await listRoleInvitations();

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Access management
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
            Creer les acces superviseur et gerer les invitations sensibles
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
            Les comptes superviseur peuvent etre crees directement par un admin. Les acces
            entreprise et les autres flux sensibles restent traces via invitation.
          </p>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <SupervisorAccountForm />
            <RoleInvitationForm />
          </div>
          <section className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">
                Invitations en circulation
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Conservez ce flux pour les entreprises et pour toute invitation sensible que
                vous souhaitez garder expirables, revocables et partageables.
              </p>
            </div>
            <RoleInvitationsTable
              invitations={invitations.map((invitation) => ({
                ...invitation,
                invitedByName: invitation.invitedBy
                  ? `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`.trim()
                  : null,
                acceptedByName: invitation.acceptedByUser
                  ? `${invitation.acceptedByUser.firstName} ${invitation.acceptedByUser.lastName}`.trim()
                  : null,
              }))}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
