import { UserRole } from "@prisma/client";
import { RoleInvitationForm } from "@/components/auth/role-invitation-form";
import { RoleInvitationsTable } from "@/components/auth/role-invitations-table";
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
            Inviter et approuver les roles sensibles
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
            Les roles superviseur et entreprise ne sont plus disponibles en inscription
            publique. Chaque accès passe par une invitation admin traçable, révocable et
            expirable.
          </p>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <RoleInvitationForm />
          <section className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">
                Invitations en circulation
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Suivez ici les approbations déjà émises, leur statut et leur lien
                d&apos;activation. Vous pouvez aussi révoquer ou faire expirer un accès non
                utilise.
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
