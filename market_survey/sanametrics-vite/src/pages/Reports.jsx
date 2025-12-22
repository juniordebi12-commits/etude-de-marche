import React from "react";
import { Link } from "react-router-dom";

export default function Reports() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="bg-[#3b82f6] text-white">
        <div className="container py-12 md:py-16">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2">
              Produits · Rapports automatiques
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
              Des rapports prêts
              <br />
              à partager en un clic.
            </h1>
            <p className="mt-4 text-sm md:text-base text-indigo-50 max-w-xl">
              Transformez vos réponses d’enquêtes en rapports clairs :
              graphiques, indicateurs clés et exports automatiques, sans
              passer des heures dans Excel.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-full bg-white text-[#1d4ed8] text-sm font-semibold shadow-sm hover:bg-slate-100 transition"
              >
                Voir un exemple de rapport
              </Link>
              <Link
                to="/editor"
                className="inline-flex px-4 py-2.5 rounded-full text-sm font-semibold transition bg-[#2563eb] hover:bg-[#1e4fd1] text-white !text-white border border-transparent"
              >
                Créer une enquête
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-10 space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="section-card p-5">
            <h3 className="font-semibold mb-2">Tableau de bord instantané</h3>
            <p className="text-sm text-slate-600">
              Nombre de réponses, taux de complétion, satisfaction moyenne,
              NPS… tout est calculé automatiquement pour chaque enquête.
            </p>
          </div>
          <div className="section-card p-5">
            <h3 className="font-semibold mb-2">Graphiques prêts à l’emploi</h3>
            <p className="text-sm text-slate-600">
              Barres, camemberts et tendances dans le temps, générés
              directement à partir de vos questions à choix unique ou multiple.
            </p>
          </div>
          <div className="section-card p-5">
            <h3 className="font-semibold mb-2">Exports en un clic</h3>
            <p className="text-sm text-slate-600">
              Exportez les réponses brutes en CSV ou partagez une vue synthèse
              avec votre équipe ou vos partenaires.
            </p>
          </div>
        </div>

        <div className="section-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Un reporting qui suit vos enquêtes
              </h2>
              <p className="mt-2 text-sm text-slate-600 max-w-xl">
                Chaque nouvelle réponse met à jour automatiquement les chiffres :
                plus besoin de recréer des tableaux. Vos rapports restent
                synchronisés avec le terrain.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-slate-600">
              <span>✓ Filtres par période</span>
              <span>✓ Comparaison entre enquêtes</span>
              <span>✓ Mise en avant des indicateurs clés</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
