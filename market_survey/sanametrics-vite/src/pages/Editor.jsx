// src/pages/Editor.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../api/useAuth";
import {
  createSurvey,
  getSurvey,
  updateSurvey,
  createSurveyWithImage,
  updateSurveyWithImage,
} from "../api/useDashboard";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PRESETS } from "../data/TemplatesData"; // <- import des presets centralisés
import { loadAIPreviewFromSession, clearAIPreview } from "../api/useAIModel";


function emptyQuestion() {
  return { text: "", question_type: "text", choices: [] };
}

export default function Editor() {
  const { access } = useAuth();
  const [searchParams] = useSearchParams();

  const editId = searchParams.get("edit");
  const templateKey = searchParams.get("template");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [hasResponses, setHasResponses] = useState(false);

  const nav = useNavigate();

  useEffect(() => {
  // ===============================
  // 🤖 MODE IA (priorité maximale)
  // ===============================
  if (!editId && !templateKey) {
    const aiDraft = loadAIPreviewFromSession();

    if (aiDraft) {
      setTitle(aiDraft.title || "");
      setDescription(aiDraft.description || "");

      if (aiDraft.image) {
        setImagePreview(aiDraft.image);
      }

      if (Array.isArray(aiDraft.questions) && aiDraft.questions.length > 0) {
        const now = Date.now();
        setQuestions(
          aiDraft.questions.map((q, index) => ({
            id: now + index,
            text: q.text || "",
            question_type: q.question_type || "text",
            choices: (q.choices || []).map((c, ci) => ({
              id: now + index * 100 + ci,
              text: c.text || "",
            })),
          }))
        );
      } else {
        setQuestions([emptyQuestion()]);
      }

      clearAIPreview(); // 🔥 CRUCIAL
      return; // ⛔ STOP TOUT
    }
  }

  // ===============================
  // MODE EDITION (EXISTANT)
  // ===============================
  if (editId) {
    setLoading(true);
    getSurvey(access, editId)
      .then((data) => {
        setTitle(data.title || "");
        setDescription(data.description || "");
        setHasResponses(!!data.has_responses); //
        const qs = (data.questions || []).map((q) => ({
          id: q.id,
          text: q.text || "",
          question_type: q.question_type || "text",
          choices: (q.choices || []).map((c) => ({
            id: c.id,
            text: c.text,
          })),
        }));
        setQuestions(qs.length ? qs : [emptyQuestion()]);
        if (data.image) setImagePreview(data.image);
        setLoading(false);
      })
      .catch(() => {
        setError("Impossible de charger l'enquête.");
        setLoading(false);
      });
    return;
  }

  // ===============================
  // MODE TEMPLATE (EXISTANT)
  // ===============================
  if (!editId && templateKey && PRESETS[templateKey]) {
    const preset = PRESETS[templateKey];

    setTitle(preset.title || "");
    setDescription(preset.description || "");
    if (preset.image) setImagePreview(preset.image);

    if (preset.questions && preset.questions.length > 0) {
      const now = Date.now();
      const mapped = preset.questions.map((q, index) => ({
        id: now + index,
        text: q.text || "",
        question_type: q.question_type || "text",
        choices: (q.choices || []).map((c, ci) => ({
          id: now + index * 100 + ci,
          text: c.text || "",
        })),
      }));
      setQuestions(mapped);
    } else {
      setQuestions([emptyQuestion()]);
    }
  } else {
    setQuestions([emptyQuestion()]);
  }

}, [editId, templateKey, access]);


  /* ---------- Questions / Choices helpers ---------- */
  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  }
  function removeQuestion(idx) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateQuestion(idx, patch) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    );
  }

  function addChoice(qidx) {
    setQuestions((prev) => {
      const clone = [...prev];
      const q = clone[qidx];
      const list = q.choices || [];
      clone[qidx] = { ...q, choices: [...list, { text: "" }] };
      return clone;
    });
  }
  function updateChoice(qidx, cidx, text) {
    setQuestions((prev) => {
      const clone = [...prev];
      const q = clone[qidx];
      const list = q.choices || [];
      clone[qidx] = {
        ...q,
        choices: list.map((c, i) => (i === cidx ? { ...c, text } : c)),
      };
      return clone;
    });
  }
  function removeChoice(qidx, cidx) {
    setQuestions((prev) => {
      const clone = [...prev];
      const q = clone[qidx];
      const list = q.choices || [];
      clone[qidx] = {
        ...q,
        choices: list.filter((_, i) => i !== cidx),
      };
      return clone;
    });
  }

  /* ---------- Image helpers ---------- */
  function handleImageChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setImageFile(null);
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  /* ---------- build payload preserving ids if present ---------- */
  function buildPayload() {
    return {
      title: (title || "").trim(),
      description: (description || "").trim(),
      questions: (questions || []).map((q, i) => {
        const qPayload = {
          text: String(q.text || "").trim(),
          question_type: q.question_type || "text",
          order: i,
        };
        if (q.id) qPayload.id = q.id;
        if (q.choices && q.choices.length) {
          qPayload.choices = q.choices.map((c) => {
            const cd = { text: String(c.text || "").trim() };
            if (c.id) cd.id = c.id;
            return cd;
          });
        } else {
          qPayload.choices = [];
        }
        return qPayload;
      }),
    };
  }

  /* ---------- Save ---------- */
  async function handleSave() {
    setError(null);
    if (!title.trim()) {
      setError("Le titre est requis.");
      return;
    }

    const payload = buildPayload();
    console.debug("Survey payload:", payload);

    try {
      setLoading(true);

      if (imageFile) {
        if (editId) {
          await updateSurveyWithImage(access, editId, payload, imageFile);
          alert("Enquête mise à jour avec image.");
        } else {
          await createSurveyWithImage(access, payload, imageFile);
          alert("Enquête créée avec image.");
        }
      } else {
        if (editId) {
          await updateSurvey(access, editId, payload);
          alert("Enquête mise à jour.");
        } else {
          await createSurvey(access, payload);
          alert("Enquête créée.");
        }
      }

      nav("/surveys");
    } catch (e) {
      console.error("Erreur sauvegarde:", e);
      let msg = "Erreur sauvegarde";
      if (e?.payload) {
        try {
          msg =
            typeof e.payload === "string"
              ? e.payload
              : JSON.stringify(e.payload);
        } catch {
          msg = "Erreur serveur";
        }
      } else if (e?.message) msg = e.message;
      setError(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-10">
      {/* 🔙 Bouton retour */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => nav(-1)}
          className="px-3 py-1 text-sm rounded border border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          ← Retour
        </button>
      </div>

      <h1 className="text-3xl font-extrabold mb-6">
        {editId ? "Modifier l’enquête" : "Créer une nouvelle enquête"}
      </h1>

      {error && <div className="mb-4 text-red-600 font-medium">{error}</div>}

      <div className="mb-6">
        <label className="block mb-1 font-semibold">Titre</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border rounded-xl shadow-sm"
          placeholder="Titre de l'enquête"
        />
      </div>

      <div className="mb-6">
        <label className="block mb-1 font-semibold">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 border rounded-xl shadow-sm"
          rows={3}
          placeholder="Description (optionnel)"
        />
      </div>

      {/* Image de couverture */}
      <div className="mb-8">
        <label className="block mb-1 font-semibold">
          Image de couverture (optionnelle)
        </label>
        {imagePreview && (
          <div className="mb-3">
            <img
              src={imagePreview}
              alt="Prévisualisation"
              className="max-h-40 rounded-xl object-cover border"
            />
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-[var(--brand,#4f46e5)] file:text-white
                     hover:file:bg-indigo-600"
        />
        <p className="text-xs text-slate-400 mt-1">
          Formats recommandés : JPG, PNG — taille raisonnable pour un chargement rapide.
        </p>
      </div>

      {/* Questions */}
      {hasResponses && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-sm rounded">
          🔒 Cette enquête a déjà des réponses.  
          Les questions sont verrouillées pour préserver les statistiques.
        </div>
      )}
      <div className="space-y-6">
        {questions.map((q, qi) => (
          <div
            key={q.id ?? qi}
            className="p-6 bg-white rounded-2xl shadow-sm border"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="text-slate-800 font-semibold">
                Question {qi + 1}
              </div>
              <div className="flex gap-2">
                {!hasResponses && (
                <button
                  onClick={() => removeQuestion(qi)}
                  className="text-red-500 text-sm"
                >
                  Supprimer
                </button>
              )}
              </div>
            </div>

            <input
              value={q.text}
              readOnly={hasResponses}
              onChange={(e) =>
                !hasResponses && updateQuestion(qi, { text: e.target.value })
              }
              className={`w-full p-2 mb-3 border rounded ${
                hasResponses ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
              placeholder="Texte de la question"
            />

            <div className="mb-3">
              <select
                  value={q.question_type}
                  disabled={hasResponses}
                  onChange={(e) =>
                    updateQuestion(qi, { question_type: e.target.value })
                  }
                  className={`p-2 border rounded ${
                    hasResponses ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                >
                <option value="text">Texte libre</option>
                <option value="single">Choix unique</option>
                <option value="multiple">Choix multiple</option>
                <option value="number">Numérique</option>
              </select>
            </div>

            {(q.question_type === "single" ||
              q.question_type === "multiple") && (
              <div className="space-y-2">
                {(q.choices || []).map((c, ci) => (
                  <div key={c.id ?? ci} className="flex gap-2 items-center">
                    <input
                      value={c.text}
                      readOnly={hasResponses}
                      onChange={(e) =>
                        !hasResponses && updateChoice(qi, ci, e.target.value)
                      }
                      className={`flex-1 p-2 border rounded ${
                        hasResponses ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                      placeholder={`Choix ${ci + 1}`}
                    />
                    {!hasResponses && (
                      <button
                        onClick={() => removeChoice(qi, ci)}
                        className="px-2 py-1 text-sm"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <div>
                  {!hasResponses && (
                  <button
                    onClick={() => addChoice(qi)}
                    className="text-indigo-600 text-sm"
                  >
                    + Ajouter un choix
                  </button>
                )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-4">
        {!hasResponses && (
          <button
            onClick={addQuestion}
            disabled={loading}
            className="px-4 py-2 border rounded"
          >
            + Ajouter une question
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-[var(--brand,#4f46e5)] text-white rounded"
        >
          {loading ? "Enregistrement..." : editId ? "Mettre à jour" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
