import Link from "next/link";
import { LinkButton } from "@/components/ui/button";

const metrics = [
  { label: "Projets actifs", value: "7" },
  { label: "Livrables suivis", value: "24" },
  { label: "Score consolide", value: "82" },
];

const steps = [
  "Candidature acceptee",
  "Room projet ouverte",
  "Feedback superviseur publie",
];

export function LandingHero() {
  return (
    <section className="overflow-hidden">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-24 lg:pt-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/92 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            MVP pilote pour projets pédagogiques et missions réelles
          </div>

          <h1 className="mt-7 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-[4.3rem]">
            Transformez des étudiants en profils professionnels vérifiables.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">
            Resilience Platform structure la progression par niveaux, suit les projets,
            centralise les livrables, consolide les feedbacks et transforme les preuves
            de travail en portfolio partageable et attestations verifiables.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/register">Commencer</LinkButton>
            <LinkButton href="/login" variant="secondary">
              Se connecter
            </LinkButton>
            <Link
              href="#fonctionnement"
              className="inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
            >
              Voir le fonctionnement
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white/88 px-3 py-1.5">
              Niveau 1 guide
            </span>
            <span className="rounded-full border border-slate-200 bg-white/88 px-3 py-1.5">
              Niveau 2 entreprise
            </span>
            <span className="rounded-full border border-slate-200 bg-white/88 px-3 py-1.5">
              Niveau 3 autonomie
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-x-10 top-8 h-48 rounded-full bg-cyan-200/40 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-emerald-200/45 blur-3xl" />

          <section className="app-panel-strong relative overflow-hidden p-4 sm:p-5">
            <div className="rounded-[2rem] bg-[linear-gradient(160deg,_#0c1a31_0%,_#102b47_48%,_#12385d_100%)] p-6 text-white shadow-[0_28px_70px_rgba(15,23,42,0.22)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                    Parcours étudiant
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                    Ines Rahmani
                  </h2>
                </div>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Niveau 2
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
                    <p className="text-sm text-slate-300">{metric.label}</p>
                    <p className="mt-3 text-3xl font-semibold">{metric.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-white/8 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Room projet active</p>
                    <p className="mt-1 text-sm text-slate-300">
                      Tableau de bord énergie campus
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                    En exécution
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {steps.map((step, index) => (
                    <div key={step} className="flex items-center gap-3 rounded-[1.15rem] bg-white/8 px-4 py-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/15 text-sm font-semibold text-emerald-200">
                        {index + 1}
                      </span>
                      <span className="text-sm text-slate-100">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Portfolio
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Preuves publiees
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Livrables valides, feedbacks et attestations transformes en vitrine
                  professionnelle partageable.
                </p>
              </div>
              <div className="rounded-[1.8rem] border border-amber-100 bg-[linear-gradient(145deg,_rgba(255,251,235,0.95),_rgba(255,255,255,0.98))] p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Attestation
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Emise et verifiable
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Chaque attestation conserve un contexte projet, un niveau et une
                  reference consultable.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
