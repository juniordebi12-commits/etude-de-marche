// src/pages/Formulaires.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Formulaires() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* HERO */}
      <section className="bg-[#3b82f6] text-white">
        <div className="container py-14 md:py-20 grid gap-10 md:grid-cols-2 items-center">
          <div>
            <p className="text-sm font-medium text-indigo-100/90 tracking-wide mb-3">
              Produits SanaMetrics · Formulaires
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
              Des formulaires modernes,
              <span className="block md:inline">
                {" "}
                prêts à collecter en 2 minutes.
              </span>
            </h1>

            <p className="text-sm md:text-base text-indigo-50 max-w-xl">
              Créez des formulaires élégants pour vos enquêtes, demandes internes,
              inscriptions ou feedbacks clients, sans jamais ouvrir un tableur.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/editor"
                className="px-6 py-3 rounded-full bg-white text-[#1d4ed8] font-semibold text-sm md:text-base shadow-sm hover:bg-slate-100 transition"
              >
                Créer un formulaire maintenant
              </Link>

              <Link
                to="/surveys"
                className="inline-flex px-4 py-2.5 rounded-full text-sm font-semibold transition bg-[#2563eb] hover:bg-[#1e4fd1] text-white !text-white border border-transparent"
              >
                Voir mes formulaires
              </Link>
            </div>

            <p className="mt-4 text-[11px] md:text-xs text-indigo-100/90">
              Aucune carte bancaire requise · Collecte en ligne et hors-ligne ·
              Export Excel &amp; CSV
            </p>
          </div>

          {/* Mockup à droite */}
          <div className="flex justify-end">
            <div className="relative w-full max-w-md">
              {/* carte arrière */}
              <div className="absolute -top-6 -right-4 w-full h-full rounded-3xl bg-indigo-900/30 blur-[1px]" />
              {/* carte principale */}
              <div className="relative bg-white rounded-3xl shadow-xl p-5 border border-slate-100 text-slate-800">
                {/* Header du formulaire */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Formulaire de satisfaction
                    </p>
                    <p className="text-xs text-slate-400">
                      Après une visite en magasin
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 whitespace-nowrap">
                    En ligne
                  </span>
                </div>

                <div className="space-y-3 text-[11px]">
                  {/* Bloc coordonnées */}
                  <div className="p-3 border border-slate-200 rounded-xl">
                    <p className="text-[11px] font-medium text-slate-700 mb-1">
                      Vos coordonnées
                    </p>
                    <p className="text-[10px] text-slate-400 mb-2">
                      Ces informations ne seront jamais partagées.
                    </p>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <p className="text-[10px] text-slate-500 mb-1">
                          Nom complet
                        </p>
                        <div className="h-6 rounded-lg border border-slate-200 bg-slate-50" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-slate-500 mb-1">
                          Téléphone (optionnel)
                        </p>
                        <div className="h-6 rounded-lg border border-slate-200 bg-slate-50" />
                      </div>
                    </div>
                  </div>

                  {/* Bloc expérience */}
                  <div className="p-3 border border-slate-200 rounded-xl">
                    <p className="text-[11px] font-medium text-slate-700 mb-1">
                      Comment s&apos;est passée votre expérience ?
                    </p>
                    <p className="text-[10px] text-slate-400 mb-2">
                      Décrivez en quelques mots ce qui vous a marqué.
                    </p>
                    <div className="h-12 rounded-lg border border-slate-200 bg-slate-50" />
                  </div>

                  {/* Bloc satisfaction */}
                  <div className="p-3 border border-slate-200 rounded-xl">
                    <p className="text-[11px] font-medium text-slate-700 mb-1">
                      Votre niveau de satisfaction global
                    </p>
                    <p className="text-[10px] text-slate-400 mb-2">
                      Choisissez l&apos;option qui vous correspond le mieux.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded-full border border-slate-200 text-[10px] text-slate-900 bg-slate-50">
                        Très satisfait
                      </span>
                      <span className="px-2 py-1 rounded-full border border-slate-200 text-[10px] text-slate-900 bg-white">
                        Satisfait
                      </span>
                      <span className="px-2 py-1 rounded-full border border-slate-200 text-[10px] text-slate-900 bg-white">
                        À améliorer
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bouton envoyer */}
                <div className="mt-4 flex justify-end">
                  <div className="h-7 px-4 rounded-full bg-[#3b82f6]/90 flex items-center justify-center text-[11px] text-white font-medium">
                    Envoyer les réponses
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1 : pourquoi les formulaires SanaMetrics */}
      <section className="container py-12 md:py-16">
        <div className="max-w-3xl mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-2">
            Tout ce qu&apos;il faut pour des formulaires sérieux, sans complexité.
          </h2>
          <p className="text-sm md:text-base text-slate-600">
            Centralisez vos formulaires d&apos;enquêtes, d&apos;inscription, de suivi
            terrain ou d&apos;évaluation dans un seul outil, connecté directement à vos
            analyses.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-[var(--brand,#4f46e5)] mb-2">
              Construire
            </p>
            <h3 className="font-semibold mb-2 text-slate-900">
              Éditeur simple et flexible
            </h3>
            <p className="text-sm text-slate-600">
              Glissez des questions texte, choix unique, multiple ou numériques.
              Réorganisez-les en un clic, ajoutez des sections et des logiques.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-[var(--brand,#4f46e5)] mb-2">
              Collecter
            </p>
            <h3 className="font-semibold mb-2 text-slate-900">
              Liens partageables &amp; mode offline
            </h3>
            <p className="text-sm text-slate-600">
              Diffusez vos formulaires par lien, QR code ou collecte terrain.
              Les réponses sont stockées même sans connexion, puis synchronisées.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-[var(--brand,#4f46e5)] mb-2">
              Analyser
            </p>
            <h3 className="font-semibold mb-2 text-slate-900">
              Données prêtes pour le dashboard
            </h3>
            <p className="text-sm text-slate-600">
              Chaque formulaire alimente directement vos tableaux de bord,
              exports CSV/Excel et rapports automatiques.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2 : cas d'usage */}
      <section className="bg-white border-y border-slate-100">
        <div className="container py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-2">
                Des formulaires pour tous vos scénarios.
              </h2>
              <p className="text-sm md:text-base text-slate-600 max-w-xl">
                Remplacez les feuilles papier et les fichiers dispersés par des formulaires
                clairs, traçables et partageables.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              "Enquêtes de satisfaction clients",
              "Études de marché terrain",
              "Suivi des ventes & points de vente",
              "Formulaires RH (candidatures, onboardings)",
              "Inscription à des programmes ou événements",
              "Rapports quotidiens d&apos;équipes terrain",
            ].map((label) => (
              <div
                key={label}
                className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-700"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 : étapes */}
      <section className="container py-12 md:py-16">
        <div className="max-w-3xl mb-8 text-center mx-auto">
          <h2 className="text-xl md:text-2xl font-bold mb-2">
            3 étapes pour passer de l&apos;idée au formulaire rempli
          </h2>
          <p className="text-sm md:text-base text-slate-600">
            SanaMetrics a été pensé pour les équipes qui n&apos;ont pas le temps
            de se battre avec des outils compliqués.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="h-8 w-8 rounded-full bg-[var(--brand,#4f46e5)]/10 flex items-center justify-center mb-3 text-[var(--brand,#4f46e5)] text-sm font-semibold">
              1
            </div>
            <h3 className="font-semibold mb-2 text-slate-900">
              Créez votre formulaire
            </h3>
            <p className="text-sm text-slate-600">
              Ajoutez vos questions, options et sections en quelques clics
              grâce à l&apos;éditeur visuel.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="h-8 w-8 rounded-full bg-[var(--brand,#4f46e5)]/10 flex items-center justify-center mb-3 text-[var(--brand,#4f46e5)] text-sm font-semibold">
              2
            </div>
            <h3 className="font-semibold mb-2 text-slate-900">
              Partagez ou collectez sur le terrain
            </h3>
            <p className="text-sm text-slate-600">
              Partagez le lien ou laissez vos enquêteurs remplir le formulaire
              même sans réseau.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="h-8 w-8 rounded-full bg-[var(--brand,#4f46e5)]/10 flex items-center justify-center mb-3 text-[var(--brand,#4f46e5)] text-sm font-semibold">
              3
            </div>
            <h3 className="font-semibold mb-2 text-slate-900">
              Analysez les réponses
            </h3>
            <p className="text-sm text-slate-600">
              Visualisez les résultats dans le dashboard, filtrez par enquêteur
              et exportez en un clic.
            </p>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-[#3b82f6] text-white">
        <div className="container py-10 md:py-14 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-2">
              Prêt à tester vos premiers formulaires SanaMetrics ?
            </h2>
            <p className="text-sm md:text-base text-indigo-100 max-w-xl">
              Créez un formulaire de test, partagez-le à votre équipe et voyez
              comment les réponses arrivent automatiquement dans le dashboard.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/editor"
              className="px-6 py-3 rounded-full bg-white text-[#1d4ed8] font-semibold text-sm md:text-base shadow-sm hover:bg-slate-100 transition"
            >
              Créer un formulaire
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex px-4 py-2.5 rounded-full text-sm font-semibold transition bg-[#2563eb] hover:bg-[#1e4fd1] text-white !text-white border border-transparent"
            >
              Voir le dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
