import React from "react";
import { Link } from "react-router-dom";

export default function Collaboration() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="bg-[#3b82f6] text-white">
        <div className="container py-12 md:py-16">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2">
              Outils Pro · Collaboration
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
              Construisez vos enquêtes
              <br />
              en équipe, en temps réel.
            </h1>
            <p className="mt-4 text-sm md:text-base text-indigo-50 max-w-xl">
              Invitez des collègues, partagez des accès et centralisez les
              retours du terrain dans un seul espace.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/surveys"
                className="px-5 py-2.5 rounded-full bg-white text-[#1d4ed8] text-sm font-semibold shadow-sm hover:bg-slate-100 transition"
              >
                Voir mes enquêtes
              </Link>
              <Link
                to="/editor"
                className="inline-flex px-4 py-2.5 rounded-full text-sm font-semibold transition bg-[#2563eb] hover:bg-[#1e4fd1] text-white !text-white border border-transparent"
              >
                Créer une nouvelle enquête
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-10 space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="section-card p-5">
            <h3 className="font-semibold mb-2">Partage d’enquêtes</h3>
            <p className="text-sm text-slate-600">
              Donnez accès à certaines enquêtes seulement à votre équipe
              projet, tout en gardant le contrôle sur les droits.
            </p>
          </div>
          <div className="section-card p-5">
            <h3 className="font-semibold mb-2">Rôles & permissions</h3>
            <p className="text-sm text-slate-600">
              Distinguez les personnes qui conçoivent les enquêtes, celles qui
              collectent sur le terrain, et celles qui analysent.
            </p>
          </div>
          <div className="section-card p-5">
            <h3 className="font-semibold mb-2">Commentaires internes</h3>
            <p className="text-sm text-slate-600">
              Ajoutez des notes, des remarques d’analyse ou des actions à
              mener directement sur une enquête ou un rapport.
            </p>
          </div>
        </div>

        <div className="section-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Une plateforme pensée pour les équipes
              </h2>
              <p className="mt-2 text-sm text-slate-600 max-w-xl">
                Qu’il s’agisse d’une ONG, d’une PME ou d’un cabinet d’étude,
                chacun peut collaborer sur les mêmes enquêtes sans se marcher
                dessus.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-slate-600">
              <span>✓ Accès par projet ou par client</span>
              <span>✓ Historique des modifications</span>
              <span>✓ Centralisation des retours terrain</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
