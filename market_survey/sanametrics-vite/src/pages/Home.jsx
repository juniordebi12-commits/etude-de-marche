// src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import Features from "./Features";

function Hero() {
  return (
    <section className="bg-transparent">
      <div className="container grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-12 md:py-20 min-h-[60vh]">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
            Analyse simple.
            <br />
            <span className="text-[var(--brand,#4f46e5)]">
              Résultats puissants.
            </span>
          </h1>

          <p className="mt-3 text-slate-600 max-w-xl text-sm md:text-base">
            Créez des enquêtes en quelques secondes, collectez des réponses partout
            et obtenez des insights précis pour prendre de meilleures décisions,
            même quand le réseau est instable.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/editor"
              className="
                inline-block
                px-6 py-3
                rounded-md
                font-semibold
                text-white !text-white
                shadow-sm
                bg-[var(--sana-blue)]
                hover:bg-[var(--sana-blue-700)]
                transition
              "
            >
              Commencer
            </Link>

            <Link
              to="/features"
              className="inline-block px-5 py-3 border rounded-md text-sm md:text-base"
              style={{
                borderColor: "rgba(79,70,229,0.25)",
                color: "var(--brand,#4f46e5)",
              }}
            >
              Découvrir
            </Link>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Exemple d&apos;éditeur
            </p>

            <div className="mt-4 space-y-3 text-sm">
              <div className="p-3 border border-slate-200 rounded-lg text-slate-800 bg-slate-50/60">
                Question 1 — Note de satisfaction (1 à 5)
              </div>
              <div className="p-3 border border-slate-200 rounded-lg text-slate-800 bg-slate-50/60">
                Question 2 — Commentaire libre
              </div>
              <div className="p-3 border border-slate-200 rounded-lg text-slate-800 bg-slate-50/60">
                Question 3 — Choix multiples (fréquence d&apos;achat)
              </div>
            </div>

            <div className="mt-4 flex justify-between text-xs text-slate-500">
              <span>3 questions</span>
              <span>Prévu pour 120 réponses</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ForFieldSection() {
  return (
    <section className="bg-white border-t border-slate-100">
      <div className="container py-10 md:py-14 grid gap-8 md:grid-cols-[1.2fr,0.8fr] items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">
            Pensé pour vos études de terrain
          </h2>
          <p className="text-sm md:text-base text-slate-600 mb-4 max-w-xl">
            Que vous interrogiez des clients, des agriculteurs ou des étudiants,
            Sana vous aide à garder toutes vos données au même endroit, sans Excel
            éclaté ni formulaires papier.
          </p>

          <ul className="space-y-2.5 text-sm md:text-base text-slate-700">
            <li className="flex gap-2">
              <span className="mt-1 text-emerald-500">✔</span>
              <span>Formulaires adaptés au téléphone pour les enquêteurs.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 text-emerald-500">✔</span>
              <span>Mode offline : les réponses se synchronisent dès que le réseau revient.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 text-emerald-500">✔</span>
              <span>Exports CSV en un clic pour vos rapports et présentations.</span>
            </li>
          </ul>
        </div>

        <div className="section-card p-5 md:p-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Exemple d&apos;usage
          </div>
          <div className="text-sm font-semibold text-slate-900 mb-1">
            Étude sur les habitudes de consommation
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Une équipe de 4 enquêteurs collecte des réponses sur plusieurs marchés
            locaux. Toute la saisie se fait directement sur mobile.
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-slate-400 mb-1">Enquêteurs</div>
              <div className="text-lg font-bold text-slate-900">4</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-slate-400 mb-1">Réponses/jour</div>
              <div className="text-lg font-bold text-slate-900">250+</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 col-span-2">
              <div className="text-slate-400 mb-1">Temps de consolidation</div>
              <div className="text-sm font-semibold text-emerald-600">
                De plusieurs jours à quelques minutes.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


export default function Home() {
  return (
    <div>
      <Hero />
      <Features />
      <ForFieldSection />
    </div>
  );
}
