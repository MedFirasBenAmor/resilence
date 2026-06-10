import { InvitationStatus, UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { AcceptRoleInvitationForm } from "@/components/auth/accept-role-invitation-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { DASHBOARD_PATHS } from "@/lib/auth/constants";
import {
  getInvitationByToken,
  resolveInvitationLifecycleStatus,
} from "@/lib/auth/invitations";
import { notFound, redirect } from "next/navigation";

type InvitationPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function RoleInvitationPage({ params }: InvitationPageProps) {
  const session = await auth();

  if (session?.user?.role) {
    redirect(DASHBOARD_PATHS[session.user.role]);
  }

  const { token } = await params;
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    notFound();
  }

  const lifecycleStatus = resolveInvitationLifecycleStatus(
    invitation.status,
    invitation.expiresAt,
  );
  const roleLabel =
    invitation.role === UserRole.SUPERVISOR ? "Superviseur" : "Entreprise";

  return (
    <AuthShell
      tabs={[
        { label: "Connexion", href: "/login" },
        { label: "Inscription étudiant", href: "/register" },
        { label: "Invitation", href: `/register/invite/${token}`, active: true },
      ]}
      formEyebrow="Invitation admin"
      formTitle={`Finaliser votre accès ${roleLabel.toLowerCase()}`}
      formDescription="Cette page correspond à un lien d’invitation sécurisé. Elle permet uniquement d’activer le compte associé à l’email invité."
      sideEyebrow="Accès par invitation"
      sideTitle={`Un accès ${roleLabel.toLowerCase()} préparé par l’administration.`}
      sideDescription="Cette invitation a été générée par un administrateur pour créer un compte professionnel rattaché au bon rôle et au bon contexte."
      sideCards={[
        {
          title: "Invitation tracée",
          description:
            "Chaque accès sensible passe par un lien d’invitation unique, horodaté et relié à un audit.",
          accent: "indigo",
        },
        {
          title: "Parcours par rôle",
          description:
            "Le compte créé hérite directement des permissions prévues pour un superviseur ou une entreprise.",
          accent: "emerald",
        },
        {
          title: "Activation simple",
          description:
            "Vous confirmez votre identité, choisissez un mot de passe et ouvrez votre espace en une seule étape.",
          accent: "amber",
        },
      ]}
      sideList={[
        `Email autorisé : ${invitation.email}`,
        invitation.companyName
          ? `Organisation rattachée : ${invitation.companyName}`
          : "Invitation sans organisation préremplie",
        `Expiration : ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(invitation.expiresAt)}`,
      ]}
      footerNote="Si l’invitation a expiré ou a été révoquée, un administrateur doit émettre un nouveau lien."
    >
      {lifecycleStatus !== InvitationStatus.PENDING && lifecycleStatus !== "EXPIRED" ? (
        <InvitationStateNotice
          tone="amber"
          title="Invitation indisponible"
          description="Cette invitation n’est plus disponible. Merci de demander un nouveau lien si vous devez encore créer ce compte."
        />
      ) : lifecycleStatus === "EXPIRED" ? (
        <InvitationStateNotice
          tone="rose"
          title="Invitation expirée"
          description="Ce lien a dépassé sa date de validité. Merci de contacter un administrateur pour recevoir une nouvelle invitation."
        />
      ) : (
        <AcceptRoleInvitationForm
          token={token}
          email={invitation.email}
          roleLabel={roleLabel}
          companyName={invitation.companyName}
        />
      )}
    </AuthShell>
  );
}

function InvitationStateNotice({
  tone,
  title,
  description,
}: {
  tone: "amber" | "rose";
  title: string;
  description: string;
}) {
  const toneClassName =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <div className={`rounded-[1.75rem] border px-6 py-5 text-sm leading-6 ${toneClassName}`}>
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-2">{description}</p>
    </div>
  );
}
