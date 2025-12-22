import React from "react";
import { Link } from "react-router-dom";

export default function Integrations() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="bg-[#3b82f6] text-white">
        <div className="container py-12 md:py-16">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2">
              Outils Pro · Intégrations
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
              Connecté à vos outils,
              <br />
              sans friction.
            </h1>
            <p className="mt-4 text-sm md:text-base text-indigo-50 max-w-xl">
              Exportez vos données vers vos outils préférés ou intégrez Sana
              directement dans vos workflows existants.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-full bg-white text-[#1d4ed8] text-sm font-semibold shadow-sm hover:bg-slate-100 transition"
              >
                Voir les données d’enquêtes
              </Link>
              <Link
                to="/docs/api" // tu peux adapter si tu n'as pas encore de page docs
                className="inline-flex px-4 py-2.5 rounded-full text-sm font-semibold transition bg-[#2563eb] hover:bg-[#1e4fd1] text-white !text-white border border-transparent"
              >
                Documentation API
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-10 space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="section-card p-5">
            <h3 className="font-semibold mb-2">Exports intelligents</h3>
            <p className="text-sm text-slate-600">
              Récupérez vos données en CSV pour Excel, Google Sheets ou tout
              autre outil d’analyse.
            </p>
          </div>
          <div className="section-card p-5">
            <h3 className="font-semibold mb-2">API (bientôt)</h3>
            <p className="text-sm text-slate-600">
              Connectez votre CRM, votre outil de suivi de projet ou votre
              data warehouse pour automatiser les flux.
            </p>
          </div>
          <div className="section-card p-5">
            <h3 className="font-semibold mb-2">Webhooks (bientôt)</h3>
            <p className="text-sm text-slate-600">
              Recevez un événement à chaque nouvelle réponse reçue pour lancer
              des actions dans vos autres outils.
            </p>
          </div>
        </div>

        <div className="section-card p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Vos données restent à vous
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            Vous pouvez à tout moment récupérer l’intégralité des réponses
            collectées, les sauvegarder, les retraiter ou les connecter à vos
            dashboards internes.
          </p>
        </div>
      </section>
    </div>
  );
}
