import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { DASHBOARD_PATHS } from "@/lib/auth/constants";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user?.role) {
    redirect(DASHBOARD_PATHS[session.user.role]);
  }

  return (
    <AuthShell
      tabs={[
        { label: "Connexion", href: "/login" },
        { label: "Inscription étudiant", href: "/register", active: true },
      ]}
      formEyebrow="Inscription étudiant"
      formTitle="Créer votre espace étudiant"
      formDescription="L’inscription publique est réservée aux étudiants. Les comptes superviseur et entreprise sont créés uniquement par invitation admin."
      sideEyebrow="Parcours pilote"
      sideTitle="Entrez dans un parcours de professionnalisation structuré et progressif."
      sideDescription="Profil, candidatures, projet, livrables, feedbacks, scoring, portfolio et attestations restent reliés dans le même espace."
      sideCards={[
        {
          title: "Projets structurés",
          description:
            "Candidatez à des projets pédagogiques ou réels selon votre niveau et votre progression.",
          accent: "indigo",
        },
        {
          title: "Livrables suivis",
          description:
            "Chaque rendu est relié au projet, à la room et aux validations du parcours.",
          accent: "emerald",
        },
        {
          title: "Portfolio valorisable",
          description:
            "Vos preuves de compétence et attestations restent mobilisables pour la suite du parcours.",
          accent: "amber",
        },
      ]}
      sideList={[
        "Inscription simple, puis complétion du profil étudiant",
        "Accès superviseur et entreprise uniquement par invitation admin",
        "Workflow pilote aligné sur projets, feedbacks et progression",
      ]}
      footerNote="Les informations de compte servent ensuite à ouvrir votre dashboard étudiant et votre portfolio."
      formFooter={
        <p className="text-sm leading-6 text-slate-500">
          Vous avez déjà un compte ?{" "}
          <Link href="/login" className="font-semibold text-slate-900">
            Se connecter
          </Link>
          .
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
