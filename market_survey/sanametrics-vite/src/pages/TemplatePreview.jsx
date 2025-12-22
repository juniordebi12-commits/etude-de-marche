// src/pages/TemplatePreview.jsx
import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import * as templatesStore from "../data/templatesStore";
import TemplatesData from "../data/TemplatesData";

/**
 * TemplatePreview — affiche le modèle (image, meta, questions)
 * - récupère d'abord depuis templatesStore (localStorage)
 * - fallback vers TemplatesData.PRESETS pour les questions si nécessaire
 */

function normalizeImage(image) {
  if (!image) return null;
  if (typeof image !== "string") return null;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  // si chemin relatif /media/... tu peux préfixer avec API_BASE si besoin
  return image;
}

export default function TemplatePreview() {
  const { id } = useParams();
  const nav = useNavigate();

  // lecture depuis le store (inclut TemplatesData par défaut)
  const template = templatesStore.getTemplate(id);
  if (!template) {
    return <div className="container py-8">Modèle introuvable.</div>;
  }

  // questions : priorité template.questions (créé via UI), sinon PRESETS central
  const preset = (TemplatesData?.PRESETS && TemplatesData.PRESETS[id]) || null;
  const questions = Array.isArray(template.questions) && template.questions.length
    ? template.questions
    : (preset?.questions || []);

  const imageUrl = normalizeImage(template.image || preset?.image);

  return (
    <div className="container py-8">
      {/* Retour + header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => nav(-1)}
            className="px-3 py-1 rounded border border-slate-200 text-sm hover:bg-slate-50"
            aria-label="Retour"
          >
            ← Retour
          </button>
          <h1 className="text-2xl font-bold">{template.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 mr-2 hidden sm:inline">Catégorie</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-sm font-medium text-slate-700">
            {template.category || "Général"}
          </span>

          <Link
            to={`/editor?template=${template.id}`}
            className="inline-flex items-center px-4 py-2 rounded-md bg-white text-[var(--brand,#4f46e5)] border border-transparent shadow-sm hover:bg-slate-50 text-sm font-semibold"
            aria-label={`Utiliser le modèle ${template.title}`}
          >
            Utiliser ce modèle
          </Link>
        </div>
      </div>

      {/* HERO / image */}
      <div className="bg-gradient-to-r from-white to-slate-50 rounded-2xl border p-6 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {imageUrl && (
            <div className="w-full sm:w-56 flex-shrink-0 rounded-xl overflow-hidden border">
              <img
                src={imageUrl}
                alt={template.title}
                loading="lazy"
                className="w-full h-40 object-cover"
              />
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{template.title}</h2>
                <p className="text-sm text-slate-600 mt-1 max-w-xl">{template.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs border border-emerald-100">
                    {questions.length} questions
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs border border-indigo-100">
                    {template.category || "Général"}
                  </span>
                </div>
              </div>

              <div className="hidden sm:block text-xs text-slate-400 text-right">
                <div>Créez et personnalisez</div>
                <div className="mt-2">Prêt pour collecte terrain & online</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUESTIONS — aperçu détaillé */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <div className="section-card p-4">
            <h3 className="font-semibold text-lg mb-3">Aperçu des questions</h3>

            {questions.length === 0 && (
              <div className="text-sm text-slate-500">Aucune question prédéfinie pour ce modèle.</div>
            )}

            <ol className="space-y-4">
              {questions.map((q, i) => (
                <li key={i} className="p-4 border rounded-lg bg-white shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900">{i + 1}. {q.text}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {q.question_type}
                        {q.choices && q.choices.length ? ` · ${q.choices.length} options` : ""}
                      </div>

                      {/* Aperçu visuel des choix */}
                      {q.choices && q.choices.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {q.choices.slice(0, 6).map((c, ci) => (
                            <span key={ci} className="inline-flex items-center px-2.5 py-1 rounded-full border text-xs text-slate-700 bg-slate-50">
                              {c.text}
                            </span>
                          ))}
                          {q.choices.length > 6 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-xs text-slate-500 bg-white">
                              +{q.choices.length - 6} autres
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-slate-400">{q.question_type === "text" ? "Réponse libre" : q.question_type}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Notes & bonnes pratiques */}
          <div className="section-card p-4">
            <h4 className="font-semibold mb-2">Conseils pour utiliser ce modèle</h4>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              <li>Personnalisez les questions pour votre public local (langue, unités, devises).</li>
              <li>Regroupez les questions longues en sections pour améliorer le taux de complétion.</li>
              <li>Ajoutez une question de contact si vous souhaitez recontacter des répondants.</li>
            </ul>
          </div>
        </div>

        {/* Carte de résumé à droite */}
        <aside className="space-y-4">
          <div className="section-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Modèle</div>
                <div className="font-semibold">{template.title}</div>
              </div>
              <div className="text-xs text-slate-400">{template.id}</div>
            </div>

            <div className="mt-3 text-sm text-slate-600">
              <div><strong>Questions :</strong> {questions.length}</div>
              <div className="mt-1"><strong>Catégorie :</strong> {template.category || "Général"}</div>
              <div className="mt-2 text-xs text-slate-400">Image : {template.image ? "inclus" : "aucune"}</div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Link
                to={`/editor?template=${template.id}`}
                className="px-3 py-2 text-sm rounded bg-white text-[var(--brand,#4f46e5)] border shadow-sm text-center"
              >
                Copier dans l'éditeur
              </Link>
              <button
                onClick={() => {
                  const payload = {
                    id: template.id,
                    title: template.title,
                    description: template.description,
                    questions: questions,
                  };
                  navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
                  alert("Preset copié dans le presse-papier (JSON minimal).");
                }}
                className="px-3 py-2 text-sm rounded bg-slate-100 text-slate-700 border"
              >
                Copier preset (JSON)
              </button>
            </div>
          </div>

          {/* Aperçu rapide des premières questions */}
          <div className="section-card p-4">
            <h5 className="font-semibold mb-2">Aperçu rapide</h5>
            <div className="text-sm text-slate-600 space-y-2">
              {questions.slice(0, 4).map((q, i) => (
                <div key={i} className="p-2 bg-white border rounded text-sm">
                  <div className="font-medium">{q.text}</div>
                  <div className="text-xs text-slate-400 mt-1">{q.question_type}</div>
                </div>
              ))}
              {questions.length === 0 && <div className="text-xs text-slate-400">Aucune question</div>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
