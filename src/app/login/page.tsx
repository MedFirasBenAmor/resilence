import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { DASHBOARD_PATHS } from "@/lib/auth/constants";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session?.user?.role) {
    redirect(DASHBOARD_PATHS[session.user.role]);
  }

  const params = await searchParams;

  return (
    <AuthShell
      tabs={[
        { label: "Connexion", href: "/login", active: true },
        { label: "Inscription étudiant", href: "/register" },
      ]}
      formEyebrow="Connexion"
      formTitle="Accéder à la plateforme"
      formDescription="Connectez-vous pour reprendre votre projet, consulter vos feedbacks et retrouver vos preuves de compétence."
      sideEyebrow="Accès institutionnel"
      sideTitle="Une entrée unique pour suivre projets, livrables et progression."
      sideDescription="La plateforme relie inscription, projets, supervision, portfolio et attestations dans un espace clair et sécurisé."
      sideCards={[
        {
          title: "Accès sécurisé",
          description:
            "Sessions protégées, permissions vérifiées côté serveur et journal d’audit sur les actions sensibles.",
          accent: "indigo",
        },
        {
          title: "Parcours par rôle",
          description:
            "Étudiant, superviseur, entreprise et admin disposent chacun d’un environnement adapté à leur responsabilité.",
          accent: "emerald",
        },
        {
          title: "Preuves de compétence",
          description:
            "Livrables, feedbacks, scores et portfolio restent reliés au même parcours de professionnalisation.",
          accent: "amber",
        },
      ]}
      sideList={[
        "Projets structurés, niveaux progressifs et capacités maîtrisées",
        "Feedback superviseur, scoring et progression visibles",
        "Portfolio valorisable et attestations reliées aux preuves",
      ]}
      footerNote="Invitation admin requise pour les comptes superviseur et entreprise."
      formFooter={
        <p className="text-sm leading-6 text-slate-500">
          Pas encore de compte étudiant ?{" "}
          <Link href="/register" className="font-semibold text-slate-900">
            Créer un compte
          </Link>
          .
        </p>
      }
    >
      <LoginForm next={params?.next} />
    </AuthShell>
  );
}
