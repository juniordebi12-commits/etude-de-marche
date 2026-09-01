import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../api/useAuth";

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-4 rounded-3xl bg-blue-200/40 blur-2xl" />

      <div className="relative rounded-3xl border border-slate-800 bg-[#111b32] p-5 shadow-xl md:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Étude en cours
            </div>
            <div className="mt-1 font-bold text-white">
              Satisfaction clients
            </div>
          </div>

          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Active
          </span>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-blue-500/15 p-3">
            <div className="text-xs text-slate-400">Répondants</div>
            <div className="mt-1 text-xl font-extrabold text-blue-300">
              128
            </div>
          </div>

          <div className="rounded-xl bg-violet-500/15 p-3">
            <div className="text-xs text-slate-400">Complétion</div>
            <div className="mt-1 text-xl font-extrabold text-violet-300">
              86%
            </div>
          </div>

          <div className="rounded-xl bg-emerald-500/15 p-3">
            <div className="text-xs text-slate-400">Questions</div>
            <div className="mt-1 text-xl font-extrabold text-emerald-300">
              12
            </div>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-100">
            Collecte cette semaine
          </span>
          <span className="text-sm font-bold text-blue-400">+32%</span>
        </div>

        <div className="flex h-28 items-end gap-2">
          {[35, 52, 42, 68, 55, 82, 94].map((height, index) => (
            <div
              key={index}
              className="flex-1 rounded-t-md bg-blue-500"
              style={{ height: `${height}%`, opacity: 0.55 + index * 0.06 }}
            />
          ))}
        </div>

        <div className="mt-3 flex justify-between text-xs text-slate-400">
          <span>Lun.</span>
          <span>Mar.</span>
          <span>Mer.</span>
          <span>Jeu.</span>
          <span>Ven.</span>
          <span>Sam.</span>
          <span>Dim.</span>
        </div>
      </div>
    </div>
  );
}

function Hero({ loggedIn }) {
  const primaryTo = loggedIn ? "/editor" : "/register";
  const primaryLabel = loggedIn ? "Créer une enquête" : "Créer mon compte";
  const secondaryTo = loggedIn ? "/dashboard" : "/pricing";
  const secondaryLabel = loggedIn ? "Ouvrir le dashboard" : "Voir les tarifs";

  return (
    <section className="overflow-hidden bg-[#f8fafc]">
      <div className="container grid grid-cols-1 items-center gap-12 py-14 md:grid-cols-2 md:py-24">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            La plateforme d’études de terrain
          </div>

          <h1 className="text-4xl font-extrabold leading-tight text-slate-950 md:text-5xl">
            Créez, collectez et analysez vos enquêtes dans{" "}
            <span className="text-blue-600">un seul outil.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
            SanaMetrics vous aide à créer un questionnaire, collecter les
            réponses et produire des résultats clairs avec des exports Excel,
            PDF et une analyse assistée par IA.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to={primaryTo}
              className="rounded-xl bg-blue-600 px-6 py-3 text-center font-semibold text-white text-on-brand shadow-sm transition hover:bg-blue-700"
            >
              {primaryLabel}
            </Link>

            <Link
              to={secondaryTo}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              {secondaryLabel}
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
            <span>✓ Modèles prêts et IA</span>
            <span>✓ Dashboard clair</span>
            <span>✓ Exports PDF et Excel</span>
          </div>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

function WorkflowSection() {
  const steps = [
    {
      number: "01",
      title: "Créez votre enquête",
      description:
        "Partez d’un modèle, créez vos questions ou utilisez l’IA pour obtenir une première structure.",
    },
    {
      number: "02",
      title: "Partagez et collectez",
      description:
        "Diffusez votre formulaire et centralisez les réponses collectées sur le terrain.",
    },
    {
      number: "03",
      title: "Analysez et exportez",
      description:
        "Suivez les indicateurs, consultez les graphiques et téléchargez un rapport Excel ou PDF.",
    },
  ];

  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="container py-14 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-blue-600">UN PARCOURS SIMPLE</p>

          <h2 className="mt-3 text-2xl font-bold text-slate-950 md:text-3xl">
            De la question à la décision, sans complication.
          </h2>

          <p className="mt-4 text-slate-600">
            Tout ce dont vous avez besoin pour mener une enquête utile et
            exploiter ses résultats.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.number}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
            >
              <div className="text-3xl font-extrabold text-blue-300">
                {step.number}
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                {step.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CoreFeaturesSection() {
  const features = [
    {
      title: "Création accélérée",
      text: "Utilisez l’éditeur, partez d’un modèle ou demandez à l’IA de préparer votre questionnaire.",
    },
    {
      title: "Collecte centralisée",
      text: "Suivez les répondants, le volume de réponses et le niveau de complétion de chaque enquête.",
    },
    {
      title: "Résultats exploitables",
      text: "Visualisez les graphiques, obtenez une synthèse IA et exportez vos résultats dans des formats professionnels.",
    },
  ];

  return (
    <section className="bg-[#f8fafc]">
      <div className="container py-14 md:py-20">
        <div className="grid items-start gap-10 md:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              L’ESSENTIEL POUR DÉMARRER
            </p>

            <h2 className="mt-3 text-2xl font-bold text-slate-950 md:text-3xl">
              Un outil simple pour comprendre votre marché.
            </h2>

            <p className="mt-5 leading-7 text-slate-600">
              SanaMetrics ne cherche pas à tout faire. La plateforme vous donne
              les outils essentiels pour mener une enquête de qualité et
              prendre des décisions à partir de données réelles.
            </p>
          </div>

          <div className="grid gap-4">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {feature.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCallToAction({ loggedIn }) {
  const destination = loggedIn ? "/editor" : "/register";
  const label = loggedIn ? "Créer une enquête" : "Commencer gratuitement";

  return (
    <section className="bg-[#f8fafc] pb-14 md:pb-20">
      <div className="container">
        <div className="rounded-3xl border border-slate-700 bg-[#111b32] px-6 py-12 md:px-12 md:py-14">
          <div className="mx-auto flex max-w-4xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-cyan-300">
                Commencez simplement
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
                Prêt à mieux comprendre votre marché ?
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Créez une première enquête et retrouvez ses résultats dans votre
                dashboard.
              </p>
            </div>

            <Link
              to={destination}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white text-on-brand transition hover:bg-blue-500"
            >
              {label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { isAuthenticated, access } = useAuth();
  const loggedIn = isAuthenticated || Boolean(access);

  return (
    <div className="bg-[#f8fafc]">
      <Hero loggedIn={loggedIn} />
      <WorkflowSection />
      <CoreFeaturesSection />
      <FinalCallToAction loggedIn={loggedIn} />
    </div>
  );
}