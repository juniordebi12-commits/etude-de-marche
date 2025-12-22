// src/pages/ProductAdvancedAnalytics.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function ProductAdvancedAnalytics() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <section className="bg-slate-900 text-white">
        <div className="container py-12 md:py-16">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300 mb-3">
              PRODUITS · ANALYSE AVANCÉE
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
              Des réponses brutes aux décisions claires.
            </h1>
            <p className="mt-4 text-sm md:text-base text-slate-200 max-w-xl">
              Suivi en temps réel, filtres, comparaisons par segment,
              export CSV… tout ce qu’il faut pour transformer vos enquêtes
              en indicateurs actionnables.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex px-4 py-2.5 rounded-full text-sm font-semibold transition bg-[#2563eb] hover:bg-[#1e4fd1] text-white !text-white border border-transparent"
              >
                Ouvrir le dashboard
              </Link>
              <Link
                to="/surveys"
                className="px-5 py-2.5 rounded-full border border-white/30 text-sm md:text-base text-white/90"
              >
                Choisir une enquête à analyser
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1 : Vue globale */}
      <section className="container py-10 md:py-14">
        <h2 className="text-xl md:text-2xl font-bold mb-2">
          Votre centre de contrôle des enquêtes.
        </h2>
        <p className="text-sm md:text-base text-slate-600 max-w-2xl mb-8">
          Un tableau de bord unique pour suivre le volume de réponses, les
          enquêtes les plus actives et les tendances clés.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="text-xs text-slate-500 mb-1">INDICATEUR</div>
            <div className="font-semibold mb-1">Vue globale</div>
            <p className="text-sm text-slate-600">
              Nombre total d’enquêtes, réponses reçues, top enquêtes par volume
              et par taux de complétion.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="text-xs text-slate-500 mb-1">SUIVI TEMPS RÉEL</div>
            <div className="font-semibold mb-1">Courbes & tendances</div>
            <p className="text-sm text-slate-600">
              Suivez la progression de vos collecte jour par jour pour savoir
              quand relancer.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="text-xs text-slate-500 mb-1">ACTIONS</div>
            <div className="font-semibold mb-1">Exports en un clic</div>
            <p className="text-sm text-slate-600">
              Export CSV des réponses, des enquêteurs ou d’un seul
              répondant pour analyse externe.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2 : Analyse par question */}
      <section className="bg-white border-t">
        <div className="container py-10 md:py-14">
          <h2 className="text-xl md:text-2xl font-bold mb-2">
            Comprenez chaque question, pas seulement la moyenne.
          </h2>
          <p className="text-sm md:text-base text-slate-600 max-w-2xl mb-8">
            Pour chaque question, Sana calcule la répartition des réponses,
            met en avant les choix dominants et regroupe les verbatims.
          </p>

          <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
            <div className="p-5 bg-slate-50 border rounded-xl">
              <h3 className="font-semibold mb-2">Questions à choix</h3>
              <p className="text-sm text-slate-600 mb-3">
                Visualisez les pourcentages de chaque option, les réponses les
                plus choisies et les écarts entre segments (si présents).
              </p>
              <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                <li>Répartition des réponses par option</li>
                <li>Classement des choix par popularité</li>
                <li>Prêt à exploiter dans vos rapports</li>
              </ul>
            </div>

            <div className="p-5 bg-slate-50 border rounded-xl">
              <h3 className="font-semibold mb-2">Réponses ouvertes</h3>
              <p className="text-sm text-slate-600 mb-3">
                Les verbatims sont regroupés question par question pour faciliter
                la lecture et l’identification des thèmes récurrents.
              </p>
              <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                <li>Liste des réponses texte par question</li>
                <li>Copier-coller direct pour vos rapports</li>
                <li>Compatibles avec vos propres outils d’analyse sémantique</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="inline-flex px-4 py-2.5 rounded-full text-sm font-semibold transition bg-[#2563eb] hover:bg-[#1e4fd1] text-white !text-white border border-transparent"
            >
              Explorer un exemple de résultats
            </Link>
            <Link
              to="/surveys"
              className="px-5 py-2.5 rounded-full bg-white text-[var(--brand,#4f46e5)] text-sm md:text-base shadow-sm"
            >
              Choisir une enquête à analyser
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
