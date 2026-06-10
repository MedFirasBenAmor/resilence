import Link from "next/link";

const footerLinks = [
  { href: "#fonctionnement", label: "Fonctionnement" },
  { href: "#parcours", label: "Parcours" },
  { href: "#valeur", label: "Valeur" },
  { href: "/login", label: "Connexion" },
  { href: "/register", label: "Commencer" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/84">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
        <div className="max-w-xl">
          <p className="text-xl font-semibold tracking-tight text-slate-950">
            Resilience Platform
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Plateforme de professionnalisation pour projets, livrables, feedbacks,
            scoring, portfolio et attestations.
          </p>
        </div>

        <nav className="flex flex-wrap gap-4 text-sm text-slate-600 lg:justify-end" aria-label="Liens utiles">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-slate-950">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
