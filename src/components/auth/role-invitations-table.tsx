import { InvitationStatus, UserRole } from "@prisma/client";
import { InvitationLifecycleActions } from "@/components/auth/invitation-lifecycle-actions";
import { DataTableLite } from "@/components/ui/data-table-lite";
import { StatusBadge } from "@/components/ui/status-badge";
import { resolveInvitationLifecycleStatus } from "@/lib/auth/invitations";

type InvitationRow = {
  id: string;
  email: string;
  role: UserRole;
  companyName: string | null;
  token: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
  invitedByName: string | null;
  acceptedByName: string | null;
};

const invitationLabels: Record<InvitationStatus | "EXPIRED", string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptee",
  REVOKED: "Revoquee",
  EXPIRED: "Expiree",
};

const invitationTones: Record<
  InvitationStatus | "EXPIRED",
  "neutral" | "success" | "danger"
> = {
  PENDING: "neutral",
  ACCEPTED: "success",
  REVOKED: "danger",
  EXPIRED: "danger",
};

function formatDate(value: Date | null) {
  if (!value) {
    return "Non renseignee";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function RoleInvitationsTable({ invitations }: { invitations: InvitationRow[] }) {
  if (!invitations.length) {
    return (
      <div className="app-panel-muted p-8 text-sm text-slate-600">
        Aucune invitation n&apos;a encore été créée.
      </div>
    );
  }

  return (
    <DataTableLite
      headers={["Invitation", "Role", "Statut", "Lien", "Historique", "Actions"]}
      rows={invitations.map((invitation) => {
        const lifecycleStatus = resolveInvitationLifecycleStatus(
          invitation.status,
          invitation.expiresAt,
        );

        return [
          <div key={`${invitation.id}-identity`}>
            <p className="font-semibold text-slate-950">{invitation.email}</p>
            {invitation.companyName ? (
              <p className="mt-1 text-sm text-slate-600">{invitation.companyName}</p>
            ) : null}
          </div>,
          <div key={`${invitation.id}-role`} className="text-sm text-slate-700">
            <p>{invitation.role === UserRole.SUPERVISOR ? "Superviseur" : "Entreprise"}</p>
          </div>,
          <StatusBadge
            key={`${invitation.id}-status`}
            label={invitationLabels[lifecycleStatus]}
            tone={invitationTones[lifecycleStatus]}
          />,
          <div key={`${invitation.id}-link`} className="text-sm text-slate-700">
            <p className="break-all font-medium text-slate-900">{`/register/invite/${invitation.token}`}</p>
            <p className="mt-2 text-slate-500">Expire le {formatDate(invitation.expiresAt)}</p>
          </div>,
          <div key={`${invitation.id}-history`} className="text-sm text-slate-600">
            <p>Creee le {formatDate(invitation.createdAt)}</p>
            <p className="mt-1">Par {invitation.invitedByName ?? "Admin"}</p>
            <p className="mt-3">Acceptee le {formatDate(invitation.acceptedAt)}</p>
            <p className="mt-1">Par {invitation.acceptedByName ?? "Pas encore"}</p>
          </div>,
          <InvitationLifecycleActions
            key={`${invitation.id}-actions`}
            invitationId={invitation.id}
            canExpire={lifecycleStatus === InvitationStatus.PENDING}
            canRevoke={lifecycleStatus === InvitationStatus.PENDING}
          />,
        ];
      })}
    />
  );
}
