import { LogoutButton } from "@/components/auth/logout-button";
import { PublicShell } from "@/components/layout/public-shell";

export default function LogoutPage() {
  return (
    <PublicShell className="flex items-center">
      <div className="mx-auto max-w-md">
      <div className="app-panel-strong p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Deconnexion
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
          Fermer la session
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-700">
          La session est stockée côté serveur via un cookie sécurisé.
        </p>
        <div className="mt-8">
          <LogoutButton />
        </div>
      </div>
      </div>
    </PublicShell>
  );
}
