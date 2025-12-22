import React, { useState } from "react";
import { Link } from "react-router-dom";

// Pricing.jsx inspired by Notion pricing layout but adapted to SanaMetrics
// Tailwind-based, responsive, includes: hero, tier comparison, credits packs, FAQ, CTA

const TIERS = [
  {
    id: "free",
    name: "Free",
    price: "0 FCFA",
    subtitle: "Pour tester",
    bullets: [
      "2 enquêtes actives",
      "100 réponses / mois",
      "Export CSV",
      "Mode terrain hors-ligne (basique)",
    ],
    creditsIncluded: 0,
    cta: { label: "Commencer gratuitement", to: "/editor" },
  },
  {
    id: "pro",
    name: "Pro",
    price: "9 900 FCFA",
    suffix: "/mois",
    subtitle: "Pour professionnels & petites équipes",
    bullets: [
      "Enquêtes illimitées",
      "Réponses illimitées*",
      "Génération IA de questionnaires",
      "Dashboard & analyses avancées",
    ],
    creditsIncluded: 25000,
    cta: { label: "Passer en Pro", to: "/surveys" },
    recommended: true,
  },
  {
    id: "enterprise",
    name: "Entreprise",
    price: "Sur mesure",
    subtitle: "Grand volume / support dédié",
    bullets: [
      "Multi-comptes & droits avancés",
      "Intégrations & API sur mesure",
      "Accompagnement & onboarding",
      "Contrat et facturation entreprise",
    ],
    creditsIncluded: null,
    cta: { label: "Demander une démo", href: "mailto:contact@sana.app" },
  },
];

const CREDIT_PACKS = [
  { id: "c1", title: "Découverte", credits: 5000, price: "4 900 FCFA" },
  { id: "c2", title: "Pro", credits: 25000, price: "19 900 FCFA" },
  { id: "c3", title: "Volume", credits: 120000, price: "79 900 FCFA" },
];

export default function Pricing() {
  const [billingMode] = useState("mois"); // placeholder for monthly/yearly toggle

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container py-12 md:py-20">
        {/* HERO */}
        <header className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-wider text-indigo-600 font-semibold">Tarifs</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-4">
            Tarification simple, crédits IA sur-mesure
          </h1>
          <p className="mt-4 text-sm text-slate-600">
            Commencez gratuitement puis montez en puissance. Les crédits servent à payer la génération IA (prompts
            + réponses). Vous gardez la maîtrise via des limites côté serveur et packs de crédits achetables.
          </p>
        </header>

        {/* TIER CARDS (Notion-style centered cards) */}
        <section className="grid gap-6 md:grid-cols-3 mb-10 items-stretch">
          {TIERS.map((t) => (
            <div
              key={t.id}
              className={`relative rounded-2xl p-6 shadow-sm border bg-white flex flex-col justify-between transition-transform hover:scale-[1.01] ${
                t.recommended ? "border-[var(--brand,#4f46e5)] shadow-lg" : ""
              }`}
            >
              {t.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--brand,#4f46e5)] text-white px-3 py-1 rounded-full text-xs font-semibold shadow">Recommandé</div>
              )}

              <div>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">{t.name}</h2>
                  <div className="text-sm text-slate-500">{t.subtitle}</div>
                </div>

                <div className="mt-4 flex items-end gap-3">
                  <div className="text-3xl md:text-4xl font-extrabold text-slate-900">{t.price}</div>
                  {t.suffix && <div className="text-sm text-slate-500">{t.suffix}</div>}
                </div>

                <ul className="mt-6 space-y-2 text-sm text-slate-600">
                  {t.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-1 inline-block h-3 w-3 rounded-full bg-[var(--brand,#4f46e5)]" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                {t.creditsIncluded !== null && (
                  <div className="mt-4 text-xs text-slate-500">
                    <strong>{t.creditsIncluded?.toLocaleString() ?? "—"}</strong> crédits IA inclus / mois
                  </div>
                )}
              </div>

              <div className="mt-6">
                {t.cta.to ? (
                  <Link
                    to={t.cta.to}
                    className={`block w-full text-center px-4 py-2 rounded-full font-semibold ${
                      t.recommended ? "inline-flex items-center justify-center w-full px-4 py-2.5 rounded-full text-sm font-semibold transition bg-[#2563eb] hover:bg-[#1e4fd1] text-white !text-white border border-transparent" : "border border-slate-200 bg-white text-slate-900"
                    }`}
                  >
                    {t.cta.label}
                  </Link>
                ) : (
                  <a href={"/entreprises"} className="block w-full text-center px-4 py-2 rounded-full border border-slate-200 bg-white font-semibold">
                    {t.cta.label}
                  </a>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Comparison table (compact) */}
        <section className="mb-12">
          <div className="overflow-x-auto bg-white rounded-2xl border p-4">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b">
                  <th className="py-3">Fonctionnalité</th>
                  {TIERS.map((t) => (
                    <th key={t.id} className="py-3 text-center">{t.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Enquêtes actives", ["2", "Illimité", "Sur demande"]],
                  ["Génération IA", ["Non incluse", "Incluse (quota)", "Sur demande"]],
                  ["Crédits IA inclus", ["0", "25 000", "Sur mesure"]],
                  ["Support", ["Email", "Prioritaire", "Dédié/SLAs"]],
                ].map((row, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-4 text-slate-700 font-medium w-1/3">{row[0]}</td>
                    {row[1].map((val, i) => (
                      <td key={i} className="py-4 text-center text-slate-600">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Credit packs (visual tiles) */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-4">Packs de crédits</h3>
          <div className="flex gap-4 flex-wrap">
            {CREDIT_PACKS.map((p) => (
              <div key={p.id} className="min-w-[220px] bg-white rounded-2xl border p-4 shadow-sm flex flex-col">
                <div className="text-sm text-slate-500">{p.title}</div>
                <div className="mt-2 text-2xl font-extrabold text-slate-900">{p.credits.toLocaleString()} crédits</div>
                <div className="mt-2 text-sm text-slate-600">{p.price}</div>
                <div className="mt-4">
                  <Link to="/billing" className="inline-flex px-4 py-2.5 rounded-full text-sm font-semibold transition bg-[#2563eb] hover:bg-[#1e4fd1] text-white !text-white border border-transparent">
                    Acheter
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ + CTA */}
        <section className="grid md:grid-cols-2 gap-6 items-start">
          <div className="bg-white rounded-2xl border p-6">
            <h4 className="text-lg font-semibold mb-3">Questions fréquentes</h4>
            <div className="space-y-3 text-sm text-slate-600">
              <div>
                <div className="font-medium">Comment sont calculés les crédits ?</div>
                <div className="text-xs text-slate-500 mt-1">Les tokens utilisés par l'IA (entrée + sortie) sont convertis en crédits selon une règle configurable côté serveur (ex : 1 crédit = 1 000 tokens).</div>
              </div>
              <div>
                <div className="font-medium">Que se passe-t-il si je dépasse mon quota ?</div>
                <div className="text-xs text-slate-500 mt-1">Vous pouvez acheter un pack de crédits depuis la page Facturation pour continuer la génération IA.</div>
              </div>
              <div>
                <div className="font-medium">Puis-je annuler mon abonnement ?</div>
                <div className="text-xs text-slate-500 mt-1">Oui — gestion depuis l'espace facturation. Les packs achetés sont crédités immédiatement sur votre compte.</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 min-h-screen">
            <div>
              <h4 className="text-2xl font-extrabold">Prêt à commencer ?</h4>
              <p className="mt-3 text-sm text-indigo-100">Testez gratuitement ou passez en Pro pour débloquer la génération IA et un quota de crédits mensuel.</p>
            </div>
            <div className="mt-6 flex gap-3">
              <Link to="/register" className="inline-flex items-center px-4 py-2 rounded-full bg-white text-[var(--brand,#2563eb)] font-semibold">Créer un compte</Link>
              <Link to="/billing" className="inline-flex px-4 py-2.5 rounded-full text-sm font-semibold transition bg-[#2563eb] hover:bg-[#1e4fd1] text-white !text-white border border-transparent">Gérer mes crédits</Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
