import { PublicShell } from "@/components/layout/public-shell";
import { LinkButton } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <PublicShell className="flex items-center">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-[2rem] border border-rose-200 bg-white/94 p-8 shadow-[0_18px_40px_rgba(244,63,94,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
            Acces refuse
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
            Vous n&apos;avez pas les droits pour cette page.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-700">
            La vérification de rôle se fait côté serveur. Connectez-vous avec un
            compte autorisé ou revenez à votre espace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/login">Se connecter</LinkButton>
            <LinkButton href="/dashboard" variant="secondary">Revenir au dashboard</LinkButton>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
