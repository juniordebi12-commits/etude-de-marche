import React from "react";
import { Link } from "react-router-dom";

const CREDIT_PACKS = [
  {
    id: "decouverte",
    name: "Découverte",
    credits: 10,
    price: "1 000 FCFA",
    unitPrice: "100 FCFA / crédit",
    description: "Pour découvrir les fonctions IA de SanaMetrics.",
    examples: [
      "Environ 5 questionnaires générés",
      "Ou environ 3 analyses IA",
      "Aucun abonnement",
    ],
  },
  {
    id: "terrain",
    name: "Terrain",
    credits: 40,
    price: "3 000 FCFA",
    unitPrice: "75 FCFA / crédit",
    description: "Pour les équipes qui collectent régulièrement.",
    examples: [
      "Environ 20 questionnaires générés",
      "Ou environ 13 analyses IA",
      "25 % de crédits en plus",
    ],
  },
  {
    id: "croissance",
    name: "Croissance",
    credits: 100,
    price: "6 000 FCFA",
    unitPrice: "60 FCFA / crédit",
    description: "Le meilleur équilibre pour suivre plusieurs enquêtes.",
    examples: [
      "Environ 50 questionnaires générés",
      "Ou environ 33 analyses IA",
      "Pack le plus avantageux",
    ],
    recommended: true,
  },
  {
    id: "organisation",
    name: "Organisation",
    credits: 250,
    price: "12 000 FCFA",
    unitPrice: "48 FCFA / crédit",
    description: "Pour les organisations et équipes à fort volume.",
    examples: [
      "Environ 125 questionnaires générés",
      "Ou environ 83 analyses IA",
      "Meilleur prix par crédit",
    ],
  },
];

function CreditPack({ pack }) {
  return (
    <article
      className={`relative flex flex-col rounded-2xl border p-6 ${
        pack.recommended
          ? "border-blue-500 bg-slate-900 shadow-lg shadow-blue-950/30"
          : "border-slate-800 bg-slate-900/70"
      }`}
    >
      {pack.recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
          Recommandé
        </span>
      )}

      <div>
        <p className="text-sm font-medium text-cyan-400">{pack.name}</p>

        <div className="mt-3 flex items-end gap-2">
          <span className="text-4xl font-extrabold text-white">
            {pack.credits}
          </span>
          <span className="pb-1 text-sm text-slate-400">crédits</span>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-300">
          {pack.description}
        </p>

        <div className="mt-6 border-y border-slate-800 py-4">
          <p className="text-2xl font-bold text-white">{pack.price}</p>
          <p className="mt-1 text-xs text-slate-400">{pack.unitPrice}</p>
        </div>

        <ul className="mt-5 space-y-3 text-sm text-slate-200">
          {pack.examples.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="font-bold text-cyan-400">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        to={`/billing?pack=${pack.id}`}
        className="mt-7 block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold transition hover:bg-blue-500"
        style={{ color: "#FFFFFF" }}
      >
        Choisir ce pack
      </Link>
    </article>
  );
}

export default function Pricing() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-slate-800">
  <div className="container py-14 md:py-16">
    <div className="mx-auto max-w-3xl text-center">
      <p
        className="text-xs font-semibold uppercase tracking-[0.22em]"
        style={{ color: "#22D3EE" }}
      >
        Crédits IA SanaMetrics
      </p>

      <h1
        className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl"
        style={{ color: "#FFFFFF" }}
      >
        Payez uniquement ce que vous utilisez.
      </h1>

      <p
        className="mx-auto mt-5 max-w-2xl text-base leading-8 md:text-lg"
        style={{ color: "#CBD5E1" }}
      >
        Achetez des crédits une seule fois et utilisez-les quand vous en avez
        besoin. Aucun abonnement, aucune limite mensuelle.
      </p>
    </div>
  </div>
</section>
      <section className="container py-14 md:py-20">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="text-sm font-medium text-cyan-400">
            Des crédits utiles, pas des fonctionnalités bloquées
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
            Vos enquêtes restent accessibles
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Créer, partager, collecter et exporter vos enquêtes reste
            disponible. Les crédits sont utilisés uniquement pour les fonctions
            d’intelligence artificielle.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {CREDIT_PACKS.map((pack) => (
            <CreditPack key={pack.id} pack={pack} />
          ))}
        </div>
      </section>

      <section className="container pb-14 md:pb-20">
        <div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-7">
            <p className="text-sm font-semibold text-cyan-400">
              Génération de questionnaire
            </p>

            <h2 className="mt-2 text-xl font-bold text-white">
              2 crédits par génération
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-300">
              Décrivez votre besoin et l’IA propose un questionnaire structuré
              que vous pouvez relire et modifier avant de l’envoyer vers
              l’éditeur.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-7">
            <p className="text-sm font-semibold text-cyan-400">
              Analyse d’enquête
            </p>

            <h2 className="mt-2 text-xl font-bold text-white">
              À partir de 3 crédits par analyse
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-300">
              Choisissez une enquête et obtenez une synthèse lisible, les
              tendances importantes, les points d’attention et des
              recommandations concrètes.
            </p>
          </article>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/60">
        <div className="container grid gap-8 py-12 md:grid-cols-[1fr_1.2fr] md:py-16">
          <div>
            <p className="text-sm font-semibold text-cyan-400">
              Questions fréquentes
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              Simple et transparent
            </h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-white">
                Les crédits expirent-ils chaque mois ?
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Non. Les crédits achetés restent disponibles sur votre compte :
                il ne s’agit pas d’un abonnement mensuel.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white">
                Puis-je utiliser SanaMetrics sans crédits ?
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Oui. Les crédits sont réservés aux fonctions IA. Vous pouvez
                créer, collecter, consulter et exporter vos enquêtes sans
                crédit.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white">
                Comment connaître mon solde ?
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Votre solde et l’historique des utilisations seront affichés
                dans votre espace crédits.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-14 md:py-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-blue-500/30 bg-slate-900 p-8 md:flex-row md:items-center md:p-10">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-white md:text-3xl">
              Commencez avec vos premières idées.
            </h2>

            <p className="mt-3 text-slate-300">
              Créez une enquête manuellement ou laissez l’IA vous proposer une
              première version en quelques secondes.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/ai-chat"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
              style={{ color: "#FFFFFF" }}
            >
              Générer avec l’IA
            </Link>

            <Link
              to="/billing"
              className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-400 hover:bg-slate-800"
            >
              Voir mon solde
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}