import React, { useMemo, useState } from "react";
import { API_BASE } from "../api/useApi";
import { useAuth } from "../api/useAuth";
import { useNavigate } from "react-router-dom";
import { saveAIPreviewToSession } from "../api/useAIModel";

const EXAMPLES = [
  "Crée un questionnaire de satisfaction client pour une banque.",
  "Prépare une enquête sur les habitudes d’achat dans un supermarché.",
  "Crée un questionnaire d’évaluation d’une formation professionnelle.",
];

const TYPE_LABELS = {
  text: "Réponse libre",
  textarea: "Réponse longue",
  single: "Choix unique",
  multiple: "Choix multiples",
  number: "Nombre",
  rating: "Évaluation",
  date: "Date",
};

function getQuestionText(question) {
  return (
    question?.text ||
    question?.label ||
    question?.question ||
    question?.title ||
    "Question sans libellé"
  );
}

function getQuestionOptions(question) {
  const options = question?.options || question?.choices || question?.answers;

  if (!Array.isArray(options)) return [];

  return options.map((option) =>
    typeof option === "string"
      ? option
      : option?.label || option?.text || option?.value || "Choix"
  );
}

function normalizeTemplateForEditor(template) {
  const supportedTypes = ["text", "single", "multiple", "number"];

  return {
    title: template?.title || "",
    description: template?.description || "",
    image: template?.image || "",
    questions: (template?.questions || []).map((question) => {
      const rawType = String(
        question?.question_type || question?.type || "text"
      ).toLowerCase();

      const choices = getQuestionOptions(question);

      return {
        text: getQuestionText(question),
        question_type: supportedTypes.includes(rawType)
          ? rawType
          : "text",
        choices: choices.map((choice) => ({ text: choice })),
      };
    }),
  };
}

export default function OpenAIChat() {
  const { access } = useAuth();
  const nav = useNavigate();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState(null);
  const [error, setError] = useState("");

  const questions = useMemo(
    () => (Array.isArray(template?.questions) ? template.questions : []),
    [template]
  );

  async function send() {
    const request = input.trim();

    if (!request) {
      setError("Décris d’abord le questionnaire que tu souhaites créer.");
      return;
    }

    setLoading(true);
    setError("");
    setTemplate(null);

    try {
      const response = await fetch(`${API_BASE}/api/openai/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(access ? { Authorization: `Bearer ${access}` } : {}),
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `
Tu es un expert en études et questionnaires.
Génère uniquement un objet JSON valide, sans texte avant ou après, au format :

{
  "title": "Titre court",
  "description": "Description courte",
  "image": "",
  "questions": [
    {
      "text": "Question claire",
      "type": "text | textarea | single | multiple | number | rating | date",
      "required": true,
      "options": ["Choix 1", "Choix 2"]
    }
  ]
}

Règles :
- Propose entre 5 et 10 questions utiles.
- Utilise "single" ou "multiple" seulement si des options sont nécessaires.
- Pour les autres types, renvoie "options": [].
- Évite les questions ambiguës et les doublons.
              `.trim(),
            },
            {
              role: "user",
              content: request,
            },
          ],
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            "La génération du questionnaire a échoué."
        );
      }

      if (!data.template || !Array.isArray(data.template.questions)) {
        throw new Error("Le modèle reçu ne contient pas de questions valides.");
      }

      setTemplate(data.template);
    } catch (err) {
      setError(err.message || "Une erreur est survenue pendant la génération.");
    } finally {
      setLoading(false);
    }
  }

  function injectIntoEditor() {
    if (!template) return;

    saveAIPreviewToSession(normalizeTemplateForEditor(template));
    nav("/editor");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container py-10 md:py-16">
        <section className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Assistant SanaMetrics
          </p>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            Créez un questionnaire avec l’IA.
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Décrivez votre besoin. L’assistant prépare un modèle que vous
            pourrez vérifier puis personnaliser dans l’éditeur.
          </p>

          <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl md:p-7">
            <label
              htmlFor="ai-request"
              className="text-sm font-semibold text-white"
            >
              Quel questionnaire souhaites-tu créer ?
            </label>

            <textarea
              id="ai-request"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={5}
              placeholder="Ex. Crée une enquête de satisfaction pour les clients d’une banque à Brazzaville. Je veux connaître la qualité de l’accueil, la rapidité du service et les points à améliorer."
              className="mt-3 w-full resize-y rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setInput(example)}
                  className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-blue-500 hover:text-white"
                >
                  {example}
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-400">
                Tu pourras modifier toutes les questions avant de publier
                l’enquête.
              </p>

              <button
                type="button"
                onClick={send}
                disabled={loading || !input.trim()}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Génération en cours…" : "Générer le questionnaire"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-100">
              {error}
            </div>
          )}
        </section>

        {template && (
          <section className="mx-auto mt-10 max-w-5xl">
            <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl">
              <div className="border-b border-slate-800 p-6 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Aperçu du questionnaire proposé
                </p>

                <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-2xl">
                    <h2 className="text-2xl font-extrabold text-white md:text-3xl">
                      {template.title || "Questionnaire sans titre"}
                    </h2>

                    {template.description && (
                      <p className="mt-3 leading-7 text-slate-300">
                        {template.description}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-center">
                    <div className="text-2xl font-extrabold text-cyan-300">
                      {questions.length}
                    </div>
                    <div className="text-xs font-medium text-slate-300">
                      questions proposées
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-8">
                <div className="space-y-4">
                  {questions.map((question, index) => {
                    const type = String(question?.type || "text").toLowerCase();
                    const options = getQuestionOptions(question);

                    return (
                      <article
                        key={`${getQuestionText(question)}-${index}`}
                        className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 md:p-5"
                      >
                        <div className="flex gap-4">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                            {index + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold leading-6 text-white">
                                {getQuestionText(question)}
                              </h3>

                              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                                {TYPE_LABELS[type] || "Réponse libre"}
                              </span>

                              {question?.required !== false && (
                                <span className="text-xs font-semibold text-rose-300">
                                  Obligatoire
                                </span>
                              )}
                            </div>

                            {options.length > 0 ? (
                              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                {options.map((option, optionIndex) => (
                                  <div
                                    key={`${option}-${optionIndex}`}
                                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300"
                                  >
                                    {type === "multiple" ? "☐" : "◯"} {option}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="mt-4 rounded-lg border border-dashed border-slate-700 px-3 py-2 text-sm text-slate-500">
                                Réponse à renseigner par le participant
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="mt-8 flex flex-col gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-400">
                    Ce modèle reste modifiable : questions, choix, ordre et
                    informations de l’enquête.
                  </p>

                  <button
                    type="button"
                    onClick={injectIntoEditor}
                    className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
                  >
                    Ouvrir et modifier dans l’éditeur →
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}