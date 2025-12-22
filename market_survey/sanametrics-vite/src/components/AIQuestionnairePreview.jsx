import React from "react";
import { useNavigate } from "react-router-dom";
import * as templatesStore from "../data/templatesStore";

/**
 * Affiche le résultat IA (mock ou réel)
 * et permet de l'utiliser comme modèle (template)
 */
function mapQuestionType(type) {
  switch (type) {
    case "rating":
      return "number";
    case "yes_no":
      return "single";
    case "text":
    default:
      return "text";
  }
}

export default function AIQuestionnairePreview({ data }) {
  const navigate = useNavigate();

  if (!data) return null;

  function handleUseAsTemplate() {
    const id = `ai-${Date.now()}`;

    const template = {
      id,
      title: data.title || "Modèle IA",
      description: data.description || "",
      image: data.cover?.image_url || null,
      category: "IA",
      questions: (data.questions || []).map((q) => ({
        text: q.label || "",
        question_type: mapQuestionType(q.type),
        choices: q.choices || [],
      })),
    };

    templatesStore.saveTemplate(template);

    navigate(`/editor?template=${id}`);
  }

  return (
    <div className="section-card p-6 border rounded-xl bg-white">
      {/* IMAGE */}
      {data.cover?.image_url && (
        <div className="mb-4 rounded-xl overflow-hidden border">
          <img
            src={data.cover.image_url}
            alt={data.title}
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      {/* TITLE */}
      <h2 className="text-2xl font-bold mb-2">{data.title}</h2>

      {/* DESCRIPTION */}
      {data.description && (
        <p className="text-slate-600 mb-4">{data.description}</p>
      )}

      {/* QUESTIONS */}
      <div className="space-y-3 mb-6">
        {(data.questions || []).map((q, i) => (
          <div key={i} className="p-3 border rounded-lg bg-slate-50">
            <div className="font-medium">
              {i + 1}. {q.label}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Type : {q.type}
            </div>
          </div>
        ))}
      </div>

      {/* ACTION */}
      <button
        onClick={handleUseAsTemplate}
        className="px-5 py-2.5 rounded-full bg-[#2563eb] text-white font-semibold hover:bg-[#1e4fd1]"
      >
        Utiliser comme modèle
      </button>
    </div>
  );
}
