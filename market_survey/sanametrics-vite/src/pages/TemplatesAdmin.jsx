// src/pages/TemplatesAdmin.jsx
import React, { useState } from "react";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../data/templatesStore";
import { Link, useNavigate } from "react-router-dom";

export default function TemplatesAdmin() {
  const [templates, setTemplates] = useState(getTemplates());
  const [editing, setEditing] = useState(null); // id du modèle en cours d'édition
  const [form, setForm] = useState({
    title: "",
    description: "",
    image: "",
    category: "",
    questions: [],
  });

  const nav = useNavigate();

  function resetForm() {
    setForm({
      title: "",
      description: "",
      image: "",
      category: "",
      questions: [],
    });
    setEditing(null);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleAddQuestion() {
    const text = prompt("Texte de la question ?");
    if (!text) return;
    const type = prompt("Type (text/single/multiple/number)", "text");
    const q = {
      text,
      question_type: type || "text",
      choices: [],
    };
    if (type === "single" || type === "multiple") {
      const raw = prompt("Choix séparés par des virgules ?");
      if (raw) {
        q.choices = raw.split(",").map((c, i) => ({
          id: i + 1,
          text: c.trim(),
        }));
      }
    }
    setForm((f) => ({
      ...f,
      questions: [...f.questions, q],
    }));
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      alert("Un modèle doit avoir un titre.");
      return;
    }

    if (editing) {
      updateTemplate(editing, form);
    } else {
      createTemplate(form);
    }

    setTemplates(getTemplates());
    resetForm();
  }

  function handleEdit(t) {
    setEditing(t.id);
    setForm({
      title: t.title || "",
      description: t.description || "",
      image: t.image || "",
      category: t.category || "",
      questions: t.questions || [],
    });
  }

  function handleDelete(id) {
    if (!window.confirm("Supprimer ce modèle ?")) return;
    deleteTemplate(id);
    setTemplates(getTemplates());
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Administration des Modèles</h1>

      {/* FORMULAIRE */}
      <div className="section-card p-4 mb-8">
        <h2 className="text-xl font-semibold mb-3">
          {editing ? "Modifier un modèle" : "Créer un modèle"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Titre du modèle"
            className="border p-2 rounded"
          />

          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="Catégorie"
            className="border p-2 rounded"
          />

          <input
            name="image"
            value={form.image}
            onChange={handleChange}
            placeholder="URL de l’image"
            className="border p-2 rounded md:col-span-2"
          />

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            className="border p-2 rounded md:col-span-2"
            rows={3}
          />
        </div>

        {/* QUESTIONS */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Questions ({form.questions.length})</h3>

          <div className="space-y-2">
            {form.questions.map((q, i) => (
              <div key={i} className="p-2 border rounded bg-white">
                <div className="font-medium">{q.text}</div>
                <div className="text-xs text-slate-500">{q.question_type}</div>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddQuestion}
            className="mt-3 px-3 py-1 rounded bg-emerald-600 text-white"
          >
            + Ajouter une question
          </button>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSubmit}
            className="btn-primary px-4 py-2"
          >
            {editing ? "Mettre à jour" : "Créer le modèle"}
          </button>
          {editing && (
            <button
              onClick={resetForm}
              className="btn-outline px-4 py-2"
            >
              Annuler
            </button>
          )}
        </div>
      </div>

      {/* LISTE DES MODÈLES */}
      <h2 className="text-xl font-semibold mb-4">Liste des modèles</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {templates.map((t) => (
          <div
            key={t.id}
            className="bg-white border rounded-xl shadow-sm overflow-hidden"
          >
            {t.image && (
              <img
                src={t.image}
                alt=""
                className="h-40 w-full object-cover"
              />
            )}

            <div className="p-4">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold">{t.title}</h3>
                <span className="text-xs text-slate-400">{t.category || "Général"}</span>
              </div>

              <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                {t.description}
              </p>

              <div className="flex gap-2 mt-4">
                <Link
                  to={`/templates/${t.id}`}
                  className="px-3 py-1 border rounded text-sm"
                >
                  Aperçu
                </Link>

                <button
                  onClick={() => handleEdit(t)}
                  className="px-3 py-1 border rounded text-sm"
                >
                  Modifier
                </button>

                <button
                  onClick={() => handleDelete(t.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                >
                  Suppr
                </button>
              </div>

              <div className="text-xs text-slate-400 mt-2">
                {t.questions?.length || 0} questions
              </div>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="section-card mt-6 text-center text-slate-500">
          Aucun modèle pour le moment.
        </div>
      )}
    </div>
  );
}
