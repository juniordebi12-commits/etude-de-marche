import React from "react";

export default function Enterprise() {
  return (
    <div className="bg-white min-h-screen">
      <div className="container py-12 md:py-16">
        {/* Hero */}
        <section className="grid gap-8 md:grid-cols-2 items-center mb-12 md:mb-16">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              Sana pour les équipes, ONG et entreprises
            </h1>
            <p className="text-sm md:text-base text-slate-600 max-w-xl">
              Déployez des enquêtes structurées, même sur le terrain. Nous assurons
              l'hébergement sécurisé, l'accompagnement et la restitution actionable.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <a
                href="mailto:contact@sana.app?subject=Demande%20d%C3%A9mo%20Entreprise"
                className="inline-flex px-4 py-2.5 rounded-full text-sm font-semibold transition bg-[#2563eb] hover:bg-[#1e4fd1] text-white !text-white border border-transparent"
              >
                Demander une démo
              </a>
              <a
                href="mailto:contact@sana.app?subject=Infos%20tarifs%20Entreprise"
                className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-800 text-sm hover:bg-slate-50 transition"
              >
                Parler à un conseiller
              </a>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl border p-5 md:p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Pensé pour les organisations qui gèrent :
            </h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• Des études de marché récurrentes</li>
              <li>• Des enquêtes de satisfaction clients ou bénéficiaires</li>
              <li>• Des suivis de programmes (ONG, projets terrain)</li>
              <li>• Des enquêtes internes auprès des équipes</li>
            </ul>
            <p className="text-[11px] text-slate-400 mt-4">
              Hébergement sécurisé, comptes multiples, gestion des accès et
              accompagnement à la mise en place.
            </p>
          </div>
        </section>

        {/* Offre services (packs) */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Offres d'accompagnement</h2>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="p-6 bg-white border rounded-2xl shadow-sm">
              <div className="text-xs font-semibold text-slate-500 mb-2">Starter</div>
              <div className="text-lg font-semibold mb-2">490 €/mois</div>
              <p className="text-sm text-slate-600 mb-3">
                2 enquêtes personnalisées / mois, rapport PDF (6 pages), 1 réunion.
              </p>
              <ul className="text-sm text-slate-600 mb-4">
                <li>• Analyse & recommandations</li>
                <li>• Support prioritaire</li>
              </ul>
              <a href="mailto:contact@sana.app?subject=Pack%20Starter" className="inline-flex px-4 py-2.5 rounded-full text-sm font-semibold transition bg-[#2563eb] hover:bg-[#1e4fd1] text-white !text-white border border-transparent">
                Demander ce pack
              </a>
            </div>

            <div className="p-6 bg-white border rounded-2xl shadow-sm">
              <div className="text-xs font-semibold text-slate-500 mb-2">Pro</div>
              <div className="text-lg font-semibold mb-2">990 €/mois</div>
              <p className="text-sm text-slate-600 mb-3">
                4 enquêtes / mois, rapport détaillé, dashboard dédié, 2 réunions.
              </p>
              <ul className="text-sm text-slate-600 mb-4">
                <li>• Intégration simple à vos systèmes</li>
                <li>• SLA & garanties</li>
              </ul>
              <a href="mailto:contact@sana.app?subject=Pack%20Pro" className="inline-flex px-4 py-2.5 rounded-full text-sm font-semibold transition bg-[#2563eb] hover:bg-[#1e4fd1] text-white !text-white border border-transparent">
                Demander ce pack
              </a>
            </div>

            <div className="p-6 bg-white border rounded-2xl shadow-sm">
              <div className="text-xs font-semibold text-slate-500 mb-2">Full Enterprise</div>
              <div className="text-lg font-semibold mb-2">Sur devis</div>
              <p className="text-sm text-slate-600 mb-3">
                Accompagnement complet, analyste dédié, atelier mensuel, intégrations sur-mesure.
              </p>
              <ul className="text-sm text-slate-600 mb-4">
                <li>• Reporting avancé</li>
                <li>• Intégration & sécurité à l’échelle</li>
              </ul>
              <a href="mailto:contact@sana.app?subject=Pack%20Enterprise" className="inline-flex px-4 py-2.5 rounded-full text-sm font-semibold transition bg-[#2563eb] hover:bg-[#1e4fd1] text-white !text-white border border-transparent">
                Demander une proposition
              </a>
            </div>
          </div>

          <p className="mt-6 text-xs text-slate-500">
            Les tarifs des packs services sont hors abonnement SaaS. L'abonnement (Pro / Team) couvre l'accès à la plateforme ; les packs ajoutent de la main-d'œuvre, des rapports et des garanties de service.
          </p>
        </section>

        {/* Comment on travaille */}
        <section className="bg-slate-50 border rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Un accompagnement simple en 3 étapes</h2>
          <div className="grid gap-6 md:grid-cols-3 text-sm">
            <div>
              <div className="text-xs font-semibold text-[var(--brand,#4f46e5)] mb-1">1. Diagnostic</div>
              <p className="text-slate-600">
                On clarifie vos cas d’usage : enquêtes terrain, suivi de projets, satisfaction client, etc.
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--brand,#4f46e5)] mb-1">2. Mise en place</div>
              <p className="text-slate-600">
                On structure vos modèles de questionnaires, vos espaces et vos droits utilisateurs.
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--brand,#4f46e5)] mb-1">3. Suivi & ajustements</div>
              <p className="text-slate-600">
                On suit les premiers mois avec vous pour ajuster les rapports, indicateurs et workflows.
              </p>
            </div>
          </div>

          <div className="mt-6 text-xs text-slate-500">
            Envoyez quelques lignes sur votre contexte à{" "}
            <a href="mailto:contact@sana.app" className="text-[var(--brand,#4f46e5)] hover:underline">
              contact@sana.app
            </a>{" "}
            et nous revenons vers vous avec une proposition adaptée.
          </div>
        </section>
      </div>
    </div>
  );
}
