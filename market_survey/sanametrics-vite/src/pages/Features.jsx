// src/pages/Features.jsx
import React from "react";
import { Link } from "react-router-dom";

function FeatureCard({ label, title, children, to }) {
  return (
    <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
      <div>
        {label && (
          <div className="text-[11px] uppercase tracking-wide text-[var(--brand,#4f46e5)] mb-1">
            {label}
          </div>
        )}
        <h3 className="font-semibold mb-2 text-slate-900 text-sm md:text-base">
          {title}
        </h3>
        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
          {children}
        </p>
      </div>

      {to && (
        <div className="mt-4">
          <Link
            to={to}
            className="inline-flex items-center text-[11px] md:text-xs font-medium text-[var(--brand,#4f46e5)] hover:text-indigo-700"
          >
            Découvrir cette fonctionnalité
            <span className="ml-1">↗</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function Features() {
  return (
    <section className="bg-slate-50 border-t border-slate-100">
      <div className="container py-12 md:py-16" id="features">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-wide text-[var(--brand,#4f46e5)] uppercase mb-2">
            Pensé pour les équipes exigeantes
          </p>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-slate-900">
            De l’idée au rapport, dans le même outil
          </h2>
          <p className="text-sm md:text-base text-slate-600">
            Sana couvre tout le cycle de vos enquêtes : création, collecte sur
            le terrain, analyse avancée, rapports automatiques et travail en
            équipe.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {/* Création / Modèles */}
          <FeatureCard
            label="Création"
            title="Éditeur moderne & modèles prêts"
            to="/templates"   // ➜ Produits → Modèles prêts
          >
            Concevez vos questionnaires en quelques minutes ou partez de
            modèles prêts (Satisfaction client, NPS, Feedback service) que vous
            adaptez à votre contexte.
          </FeatureCard>

          {/* IA */}
          <FeatureCard
            label="Intelligence"
            title="Génération assistée par IA"
            to="/features/ai"   // ➜ Produits → Génération IA
          >
            Décrivez votre besoin, Sana propose une première version des
            questions, les reformule et vous aide à structurer un formulaire
            clair et complet.
          </FeatureCard>

          {/* Offline / collecte */}
          <FeatureCard
            label="Terrain"
            title="Collecte robuste, même hors-ligne"
            to="/surveys"   // tu peux créer une vraie page /offline plus tard
          >
            Les réponses sont enregistrées sur l’appareil et se synchronisent
            automatiquement dès que le réseau revient. Parfait pour les études
            de terrain et zones à faible connexion.
          </FeatureCard>

          {/* Analyse avancée */}
          <FeatureCard
            label="Analyse"
            title="Dashboards & analyse avancée"
            to="/features/analysis"   // ➜ Produits → Analyse avancée
          >
            Visualisez instantanément le volume de réponses, les répartitions
            par choix, les tendances et les scores critiques comme le NPS.
          </FeatureCard>

          {/* Rapports automatiques */}
          <FeatureCard
            label="Rapports"
            title="Rapports automatiques & exports"
            to="/reports"   // ➜ Produits → Rapports automatiques (page à créer si pas encore)
          >
            Exportez les données en CSV et générez des synthèses prêtes à être
            partagées dans vos présentations, comptes rendus ou réunions.
          </FeatureCard>

          {/* Outils Pro – Collaboration / Intégrations */}
          <FeatureCard
            label="Outils Pro"
            title="Collaboration & intégrations"
          >
            Travaillez à plusieurs sur les enquêtes, partagez les résultats aux
            bonnes personnes et connectez Sana à vos outils (BI, CRM, etc.).
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}
