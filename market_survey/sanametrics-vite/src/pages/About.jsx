// src/pages/About.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="bg-white border-b">
        <div className="container py-10 md:py-14">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
              À propos
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
              Donner aux équipes de terrain
              <br />
              des outils d’enquête modernes.
            </h1>
            <p className="mt-4 text-sm md:text-base text-slate-600 max-w-xl">
              Sana a été pensé pour les organisations qui ont besoin de
              comprendre leur public, leurs clients ou leurs bénéficiaires,
              sans perdre du temps dans des outils compliqués.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-10 space-y-10">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="section-card p-5">
            <h3 className="font-semibold mb-1">Vision</h3>
            <p className="text-sm text-slate-600">
              Rendre la collecte et l’analyse de données accessibles à toutes
              les équipes, même sans profil technique.
            </p>
          </div>
          <div className="section-card p-5">
            <h3 className="font-semibold mb-1">Mission</h3>
            <p className="text-sm text-slate-600">
              Offrir une plateforme simple, fiable et adaptée au terrain pour
              construire des enquêtes, suivre les réponses et agir plus vite.
            </p>
          </div>
          <div className="section-card p-5">
            <h3 className="font-semibold mb-1">Valeurs</h3>
            <p className="text-sm text-slate-600">
              Simplicité, fiabilité, transparence dans l’usage des données et
              focus sur l’impact réel.
            </p>
          </div>
        </div>

        <div className="section-card p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Un outil né du terrain
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-xl">
              Sana n’est pas seulement un éditeur de formulaires. Il a été
              pensé pour des contextes réels : études de marché, feedback
              client, enquêtes internes, évaluations de projets, etc.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-slate-600">
            <span>✓ Compatible avec connexion limitée (mode offline)</span>
            <span>✓ Adapté aux équipes multi-sites</span>
            <span>✓ Pensé pour l’Afrique et les réalités du terrain</span>
          </div>
        </div>

        <div className="section-card p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Envie d’en savoir plus ?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Testez Sana avec une première enquête et voyez comment vos
              données prennent vie dans le dashboard.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/editor"
              className="
                  px-5 py-2.5
                  rounded-full
                  border border-white
                  text-white !text-white
                  bg-[#2563eb]          
                  hover:bg-[#1e4fd1]     
                  transition
                "
            >
              Créer une enquête
            </Link>
            <Link
              to="/features"
              className="px-5 py-2.5 rounded-full border border-slate-300 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              Voir les fonctionnalités
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
