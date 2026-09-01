import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../api/useAuth";

const features = [
  {
    label: "Création",
    icon: "✦",
    title: "Questionnaires personnalisés",
    description:
      "Créez vos enquêtes avec questions libres, choix uniques, choix multiples et réponses numériques.",
    to: "/editor",
    linkLabel: "Créer une enquête",
  },
  {
    label: "Modèles",
    icon: "▣",
    title: "Modèles prêts à adapter",
    description:
      "Démarrez rapidement avec des modèles de satisfaction, feedback client et études de marché.",
    to: "/templates",
    linkLabel: "Voir les modèles",
  },
  {
    label: "Collecte",
    icon: "◉",
    title: "Collecte centralisée",
    description:
      "Partagez votre enquête et centralisez les réponses collectées depuis téléphone ou ordinateur.",
    to: "/surveys",
    linkLabel: "Gérer mes enquêtes",
  },
  {
    label: "Analyse",
    icon: "↗",
    title: "Dashboard, analyses et exports",
    description:
      "Suivez les indicateurs, consultez les graphiques et exportez les données ou analyses en Excel et PDF.",
    to: "/dashboard",
    linkLabel: "Ouvrir le dashboard",
  },
  {
  label: "Intelligence artificielle",
  icon: "✦",
  title: "Analyse assistée par IA",
  description:
    "Sélectionnez une enquête et obtenez une synthèse claire de vos résultats, des constats et des recommandations utiles.",
  to: "/features/analysis",
  linkLabel: "Analyser une enquête",
},
];

function FeatureCard({ feature }) {
  return (
    <article className="group flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-xl bg-blue-50 px-3 py-2 text-lg font-bold text-blue-600">
          {feature.icon}
        </span>

        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {feature.label}
        </span>
      </div>

      <h3 className="mt-6 text-lg font-bold text-slate-900">
        {feature.title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {feature.description}
      </p>

      <Link
        to={feature.to}
        className="mt-auto pt-6 text-sm font-semibold text-blue-600 transition group-hover:translate-x-1"
      >
        {feature.linkLabel} →
      </Link>
    </article>
  );
}

export default function Features() {
  const { isAuthenticated, access } = useAuth();
  const loggedIn = isAuthenticated || Boolean(access);

  const ctaTo = loggedIn ? "/editor" : "/register";
  const ctaLabel = loggedIn ? "Créer une enquête" : "Commencer gratuitement";

  return (
    <section className="min-h-screen border-y border-slate-200 bg-[#f8fafc]">
      <div className="container py-14 md:py-20" id="features">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
            L’essentiel pour vos enquêtes
          </p>

          <h1 className="mt-3 text-3xl font-extrabold text-slate-950 md:text-4xl">
            Créez, collectez et décidez avec vos données.
          </h1>

          <p className="mt-5 text-sm leading-7 text-slate-600 md:text-base">
            SanaMetrics réunit les outils nécessaires pour préparer une
            enquête, recueillir les réponses et comprendre clairement vos
            résultats.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-blue-200 bg-blue-50 px-6 py-8 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            Prêt à lancer votre première enquête ?
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
            Créez votre questionnaire, partagez-le et retrouvez vos réponses
            dans le dashboard.
          </p>

          <Link
            to={ctaTo}
            className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-on-brand transition hover:bg-blue-700"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}