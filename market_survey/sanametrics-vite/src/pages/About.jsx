import React from "react";
import { Link } from "react-router-dom";

const values = [
  {
    number: "01",
    title: "Vision",
    text: "Rendre la collecte et l’analyse de données accessibles à toutes les équipes, même sans profil technique.",
  },
  {
    number: "02",
    title: "Mission",
    text: "Offrir une plateforme simple, fiable et adaptée au terrain pour construire des enquêtes et agir plus vite.",
  },
  {
    number: "03",
    title: "Valeurs",
    text: "Simplicité, fiabilité, transparence dans l’usage des données et recherche d’un impact concret.",
  },
];

export default function About() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="container py-16 md:py-24">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
              À propos de SanaMetrics
            </p>

            <h1 className="text-4xl font-extrabold leading-tight text-white md:text-6xl">
              Des données utiles,
              <br />
              des décisions plus justes.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              SanaMetrics aide les organisations à créer des enquêtes, collecter
              des informations fiables sur le terrain et transformer chaque
              réponse en décision concrète.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-cyan-200">
                Pensé pour le terrain
              </span>
              <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-blue-200">
                Données centralisées
              </span>
              <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-violet-200">
                Analyse accessible
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-14 md:py-20">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-medium text-cyan-400">Notre engagement</p>
          <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
            Un outil conçu pour les réalités concrètes
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {values.map((value) => (
            <article
              key={value.number}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition hover:-translate-y-1 hover:border-blue-500/50"
            >
              <span className="text-sm font-bold text-cyan-400">
                {value.number}
              </span>
              <h3 className="mt-5 text-xl font-bold text-white">
                {value.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {value.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="container pb-14 md:pb-20">
        <div className="grid gap-6 rounded-3xl border border-blue-500/30 bg-slate-900 p-7 md:grid-cols-[1.2fr_1fr] md:p-10">
          <div>
            <p className="text-sm font-medium text-cyan-400">
              Une solution ancrée dans le réel
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
              Un outil né du terrain
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 md:text-base">
              SanaMetrics ne se limite pas à créer des formulaires. La
              plateforme accompagne les études de marché, le feedback client,
              les enquêtes internes et les évaluations de projets, de la
              collecte jusqu’au rapport final.
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-200">
            <p>✓ Utilisable même avec une connexion limitée</p>
            <p>✓ Adapté aux équipes et collecteurs multi-sites</p>
            <p>✓ Exports Excel et PDF prêts à partager</p>
            <p>✓ Pensé pour l’Afrique et les réalités du terrain</p>
          </div>
        </div>
      </section>

      <section className="container pb-16 md:pb-20">
  <div className="flex flex-col items-start justify-between gap-7 rounded-3xl border border-slate-700 bg-slate-900 px-7 py-10 md:flex-row md:items-center md:px-10">
    <div className="max-w-2xl">
      <p className="text-sm font-medium text-cyan-400">
        Commencez simplement
      </p>

      <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
        Prêt à mieux comprendre votre marché ?
      </h2>

      <p className="mt-3 text-slate-300">
        Créez votre première enquête et suivez vos résultats depuis votre
        dashboard.
      </p>
    </div>

    <div className="flex flex-wrap gap-3">
      <Link
        to="/editor"
        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
        style={{ color: "#FFFFFF" }}
      >
        Créer une enquête
      </Link>

      <Link
        to="/features"
        className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-400 hover:bg-slate-800"
      >
        Voir les fonctionnalités
      </Link>
    </div>
  </div>
</section>
    </main>
  );
}