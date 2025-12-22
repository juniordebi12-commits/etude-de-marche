import React from "react";
import { Link } from "react-router-dom";

export default function ProductAiGeneration() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <section className="bg-[#3b82f6] text-white">
        <div className="container py-12 md:py-16">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-100 mb-3">
              PRODUITS · GÉNÉRATION IA
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
              Laissez l’IA préparer vos questionnaires pour vous.
            </h1>
            <p className="mt-4 text-sm md:text-base text-indigo-50 max-w-xl">
              Donnez le contexte, l’IA propose les questions, les formulations
              et même les échelles de réponse. Vous gardez le contrôle, elle
              fait le gros du travail.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/ai-chat"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-semibold bg-white text-[#1d4ed8] shadow-sm hover:bg-slate-100 transition"
              >
                Essayer la génération IA
              </Link>
              <Link
                to="/templates"
                className="inline-flex px-4 py-2.5 rounded-full text-sm font-semibold transition bg-[#2563eb] hover:bg-[#1e4fd1] text-white !text-white border border-transparent"
              >
                Utiliser un modèle prêt
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1 : Comment ça marche */}
      <section className="container py-10 md:py-14">
        <h2 className="text-xl md:text-2xl font-bold mb-2">
          De l’idée au questionnaire en quelques secondes.
        </h2>
        <p className="text-sm md:text-base text-slate-600 max-w-2xl mb-8">
          Vous décrivez votre besoin, Sana propose une structure complète :
          sections, questions, types de réponses et échelles adaptées.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-xs font-semibold text-slate-500 mb-1">
              ÉTAPE 1
            </div>
            <div className="font-semibold mb-1">Décrivez votre objectif</div>
            <p className="text-sm text-slate-600">
              “Mesurer la satisfaction après une formation”, “Analyser le
              ressenti des employés”... Écrivez naturellement, l’IA comprend.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-xs font-semibold text-slate-500 mb-1">
              ÉTAPE 2
            </div>
            <div className="font-semibold mb-1">L’IA propose les questions</div>
            <p className="text-sm text-slate-600">
              Questions fermées, NPS, échelles Likert, champs libres…
              automatiquement générés et classés par thème.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="text-xs font-semibold text-slate-500 mb-1">
              ÉTAPE 3
            </div>
            <div className="font-semibold mb-1">Vous ajustez et publiez</div>
            <p className="text-sm text-slate-600">
              Modifiez, supprimez, ajoutez vos propres questions, puis
              partagez le formulaire en un clic.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2 : Cas d’usage */}
      <section className="bg-white border-t">
        <div className="container py-10 md:py-14">
          <h2 className="text-xl md:text-2xl font-bold mb-2">
            Pensée pour vos cas concrets.
          </h2>
          <p className="text-sm md:text-base text-slate-600 max-w-2xl mb-8">
            La génération IA s’adapte à différents contextes sans que vous
            ayez à repartir de zéro à chaque fois.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-5 rounded-xl border bg-slate-50">
              <h3 className="font-semibold mb-1">
                Enquêtes internes (RH & organisation)
              </h3>
              <p className="text-sm text-slate-600 mb-3">
                Climat social, on-boarding, formations, bien-être au travail…
                obtenez des questions structurées, cohérentes et neutres.
              </p>
              <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                <li>Ton neutre et non culpabilisant</li>
                <li>Échelles cohérentes entre les questions</li>
                <li>Questions reformulées pour éviter les biais</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl border bg-slate-50">
              <h3 className="font-semibold mb-1">
                Études de satisfaction & NPS
              </h3>
              <p className="text-sm text-slate-600 mb-3">
                Génération automatique des questions clés, relances et champs
                libres pour comprendre les notes extrêmes.
              </p>
              <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                <li>Structure NPS standardisée</li>
                <li>Questions ouvertes adaptées aux promoteurs/détracteurs</li>
                <li>Prêt à analyser dans le dashboard</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/editor"
              className="inline-flex px-4 py-2.5 rounded-full text-sm font-semibold transition bg-[#2563eb] hover:bg-[#1e4fd1] text-white !text-white border border-transparent"
            >
              Créer un formulaire avec l’IA
            </Link>
            <Link
              to="/surveys"
              className="px-5 py-2.5 rounded-full bg-white text-[#1d4ed8] text-sm md:text-base shadow-sm"
            >
              Voir mes enquêtes existantes
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
