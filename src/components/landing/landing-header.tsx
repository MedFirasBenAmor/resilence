import Link from "next/link";
import { LinkButton } from "@/components/ui/button";

function BrandMark() {
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-900/10 bg-slate-950 text-emerald-300 shadow-sm">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path
          fill="currentColor"
          d="M12 3.5a1 1 0 0 1 .92.61l1.63 3.9l4.2.34a1 1 0 0 1 .57 1.76l-3.2 2.74l.98 4.08a1 1 0 0 1-1.48 1.08L12 15.88l-3.62 2.13a1 1 0 0 1-1.48-1.08l.98-4.08l-3.2-2.74a1 1 0 0 1 .57-1.76l4.2-.34l1.63-3.9a1 1 0 0 1 .92-.61Z"
        />
      </svg>
    </span>
  );
}

const links = [
  { href: "#fonctionnement", label: "Fonctionnement" },
  { href: "#parcours", label: "Parcours" },
  { href: "#valeur", label: "Valeur" },
  { href: "/login", label: "Connexion" },
];

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/88 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="text-base font-semibold tracking-tight text-slate-950 sm:text-lg">
              Resilience Platform
            </p>
            <p className="text-xs text-slate-500">Pilotage de la professionnalisation</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Navigation principale">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm font-semibold text-slate-700 sm:inline-flex">
            Se connecter
          </Link>
          <LinkButton href="/register">Commencer</LinkButton>
        </div>
      </div>
    </header>
  );
}
