import React, { useEffect, useState } from "react";
import { useAuth } from "../api/useAuth";
import {
  createSurvey,
  getSurvey,
  updateSurvey,
  createSurveyWithImage,
  updateSurveyWithImage,
} from "../api/useDashboard";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { PRESETS } from "../data/TemplatesData";
import {
  loadAIPreviewFromSession,
  clearAIPreview,
} from "../api/useAIModel";
import { getTemplate } from "../data/templatesStore";

function emptyQuestion() {
  return { text: "", question_type: "text", choices: [] };
}

const QUESTION_TYPES = [
  { value: "text", label: "Texte libre" },
  { value: "single", label: "Choix unique" },
  { value: "multiple", label: "Choix multiple" },
  { value: "number", label: "Réponse numérique" },
];

export default function Editor() {
  const { access } = useAuth();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();

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

  useEffect(() => {
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
  aiDraft.questions.map((question, index) => {
    const rawType = question.question_type || question.type || "text";

    const questionType =
      rawType === "single" ||
      rawType === "multiple" ||
      rawType === "number"
        ? rawType
        : "text";

    const sourceChoices =
      question.choices || question.options || question.answers || [];

    return {
      id: now + index,
      text:
        question.text ||
        question.label ||
        question.question ||
        question.title ||
        "",
      question_type: questionType,
      choices: sourceChoices.map((choice, choiceIndex) => ({
        id: now + index * 100 + choiceIndex,
        text:
          typeof choice === "string"
            ? choice
            : choice.text || choice.label || choice.value || "",
      })),
    };
  })
);
        } else {
          setQuestions([emptyQuestion()]);
        }

        clearAIPreview();
        return;
      }
    }

    if (editId) {
      setLoading(true);

      getSurvey(access, editId)
        .then((data) => {
          setTitle(data.title || "");
          setDescription(data.description || "");
          setHasResponses(Boolean(data.has_responses));

          const loadedQuestions = (data.questions || []).map((question) => ({
            id: question.id,
            text: question.text || "",
            question_type: question.question_type || "text",
            choices: (question.choices || []).map((choice) => ({
              id: choice.id,
              text: choice.text || "",
            })),
          }));

          setQuestions(
            loadedQuestions.length ? loadedQuestions : [emptyQuestion()]
          );

          if (data.image) {
            setImagePreview(data.image);
          }

          setLoading(false);
        })
        .catch(() => {
          setError("Impossible de charger l’enquête.");
          setLoading(false);
        });

      return;
    }

    if (templateKey) {
      const preset = PRESETS[templateKey] || getTemplate(templateKey);
      if (!preset) {
        setQuestions([emptyQuestion()]);
        return;
      }

      setTitle(preset.title || "");
      setDescription(preset.description || "");

      if (preset.image) {
        setImagePreview(preset.image);
      }

      if (Array.isArray(preset.questions) && preset.questions.length > 0) {
        const now = Date.now();

        setQuestions(
          preset.questions.map((question, index) => ({
            id: now + index,
            text: question.text || "",
            question_type: question.question_type || "text",
            choices: (question.choices || []).map((choice, choiceIndex) => ({
              id: now + index * 100 + choiceIndex,
              text: choice.text || "",
            })),
          }))
        );
      } else {
        setQuestions([emptyQuestion()]);
      }
    }
  }, [editId, templateKey, access]);

  function addQuestion() {
    setQuestions((previous) => [...previous, emptyQuestion()]);
  }

  function removeQuestion(index) {
    if (questions.length <= 1) return;

    setQuestions((previous) =>
      previous.filter((_, questionIndex) => questionIndex !== index)
    );
  }

  function updateQuestion(index, patch) {
    setQuestions((previous) =>
      previous.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question
      )
    );
  }

  function addChoice(questionIndex) {
    setQuestions((previous) => {
      const clone = [...previous];
      const question = clone[questionIndex];
      const choices = question.choices || [];

      clone[questionIndex] = {
        ...question,
        choices: [...choices, { text: "" }],
      };

      return clone;
    });
  }

  function updateChoice(questionIndex, choiceIndex, text) {
    setQuestions((previous) => {
      const clone = [...previous];
      const question = clone[questionIndex];
      const choices = question.choices || [];

      clone[questionIndex] = {
        ...question,
        choices: choices.map((choice, index) =>
          index === choiceIndex ? { ...choice, text } : choice
        ),
      };

      return clone;
    });
  }

  function removeChoice(questionIndex, choiceIndex) {
    setQuestions((previous) => {
      const clone = [...previous];
      const question = clone[questionIndex];
      const choices = question.choices || [];

      clone[questionIndex] = {
        ...question,
        choices: choices.filter((_, index) => index !== choiceIndex),
      };

      return clone;
    });
  }

  function handleImageChange(event) {
    const file = event.target.files && event.target.files[0];

    if (!file) {
      setImageFile(null);
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function buildPayload() {
    return {
      title: title.trim(),
      description: description.trim(),
      questions: questions.map((question, index) => {
        const questionPayload = {
          text: String(question.text || "").trim(),
          question_type: question.question_type || "text",
          order: index,
        };

        if (editId && question.id) {
  questionPayload.id = question.id;
}

        questionPayload.choices = (question.choices || []).map((choice) => {
          const choicePayload = {
            text: String(choice.text || "").trim(),
          };

          if (editId && choice.id) {
  choicePayload.id = choice.id;
}

          return choicePayload;
        });

        return questionPayload;
      }),
    };
  }

  async function handleSave() {
    setError(null);

    if (!title.trim()) {
      setError("Ajoute un titre à ton enquête avant de continuer.");
      return;
    }
    const validQuestions = questions.filter((question) =>
  String(question.text || "").trim()
);

if (validQuestions.length === 0) {
  setError(
    "Aucune question valide n’est présente. Retourne au générateur IA ou ajoute une question avant de créer l’enquête."
  );
  return;
}

    try {
      setLoading(true);

      const payload = buildPayload();

      if (imageFile) {
        if (editId) {
          await updateSurveyWithImage(access, editId, payload, imageFile);
        } else {
          await createSurveyWithImage(access, payload, imageFile);
        }
      } else if (editId) {
        await updateSurvey(access, editId, payload);
      } else {
        await createSurvey(access, payload);
      }

      nav("/surveys");
    } catch (saveError) {
      console.error("Erreur sauvegarde :", saveError);

      let message = "Impossible d’enregistrer l’enquête.";

      if (saveError?.payload) {
        try {
          message =
            typeof saveError.payload === "string"
              ? saveError.payload
              : JSON.stringify(saveError.payload);
        } catch {
          message = "Une erreur serveur est survenue.";
        }
      } else if (saveError?.message) {
        message = saveError.message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const isChoiceQuestion =
    (question) =>
      question.question_type === "single" ||
      question.question_type === "multiple";

  return (
    <main className="min-h-screen bg-[#f8fafc] py-8 md:py-12">
      <div className="container max-w-5xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => nav(-1)}
              className="mb-4 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
            >
              ← Retour
            </button>

            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              {editId ? "Modification" : "Nouvelle enquête"}
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-slate-950 md:text-4xl">
              {editId ? "Modifier l’enquête" : "Créer votre enquête"}
            </h1>

            <p className="mt-3 max-w-2xl text-slate-600">
              Ajoutez un titre, vos questions et une image de couverture si
              vous le souhaitez.
            </p>
          </div>

          {!editId && (
  <div className="flex flex-wrap gap-3">
    <Link
      to="/templates"
      className="inline-flex w-fit rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
    >
      Utiliser un modèle prêt
    </Link>

    <Link
      to="/ai-chat"
      className="inline-flex w-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-on-brand transition hover:bg-blue-700"
    >
      ✦ Générer avec l’IA
    </Link>
  </div>
)}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {hasResponses && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            <strong>Questions verrouillées.</strong> Cette enquête possède déjà
            des réponses : les questions ne peuvent plus être modifiées afin de
            préserver les statistiques.
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Informations générales
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Elles seront visibles par les participants.
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {questions.length} question{questions.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Titre de l’enquête <span className="text-red-500">*</span>
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Ex. Satisfaction clients 2026"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Description
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                rows={3}
                placeholder="Expliquez en quelques mots l’objectif de cette enquête."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Image de couverture <span className="text-slate-400">(optionnelle)</span>
              </label>

              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Prévisualisation de la couverture"
                  className="mb-3 h-40 w-full rounded-xl border border-slate-200 object-cover md:w-80"
                />
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
              />

              <p className="mt-2 text-xs text-slate-500">
                Formats recommandés : JPG ou PNG, dans une taille raisonnable.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Questions</h2>
              <p className="mt-1 text-sm text-slate-600">
                Construisez votre questionnaire une question à la fois.
              </p>
            </div>

            {!hasResponses && (
              <button
                type="button"
                onClick={addQuestion}
                disabled={loading}
                className="w-fit rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                + Ajouter une question
              </button>
            )}
          </div>

          <div className="space-y-5">
            {questions.map((question, questionIndex) => (
              <article
                key={question.id ?? questionIndex}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
              >
                <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                      {questionIndex + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Question {questionIndex + 1}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Choisissez le type de réponse attendu.
                      </p>
                    </div>
                  </div>

                  {!hasResponses && questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(questionIndex)}
                      className="w-fit text-sm font-semibold text-red-600 transition hover:text-red-800"
                    >
                      Supprimer
                    </button>
                  )}
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Question
                    </label>
                    <input
                      value={question.text}
                      readOnly={hasResponses}
                      onChange={(event) =>
                        !hasResponses &&
                        updateQuestion(questionIndex, {
                          text: event.target.value,
                        })
                      }
                      className={`w-full rounded-xl border px-4 py-3 outline-none transition ${
                        hasResponses
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
                          : "border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      }`}
                      placeholder="Ex. Comment évaluez-vous notre service ?"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Type de réponse
                    </label>
                    <select
                      value={question.question_type}
                      disabled={hasResponses}
                      onChange={(event) =>
                        !hasResponses &&
                        updateQuestion(questionIndex, {
                          question_type: event.target.value,
                        })
                      }
                      className={`rounded-xl border px-4 py-3 outline-none transition ${
                        hasResponses
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
                          : "border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      }`}
                    >
                      {QUESTION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isChoiceQuestion(question) && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">
                            Choix de réponse
                          </h4>
                          <p className="mt-1 text-xs text-slate-500">
                            Ajoutez les options proposées aux répondants.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {(question.choices || []).map((choice, choiceIndex) => (
                          <div
                            key={choice.id ?? choiceIndex}
                            className="flex items-center gap-2"
                          >
                            <span className="text-sm text-slate-400">•</span>

                            <input
                              value={choice.text}
                              readOnly={hasResponses}
                              onChange={(event) =>
                                !hasResponses &&
                                updateChoice(
                                  questionIndex,
                                  choiceIndex,
                                  event.target.value
                                )
                              }
                              className={`flex-1 rounded-lg border px-3 py-2.5 text-sm outline-none ${
                                hasResponses
                                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
                                  : "border-slate-300 bg-white text-slate-900 focus:border-blue-500"
                              }`}
                              placeholder={`Choix ${choiceIndex + 1}`}
                            />

                            {!hasResponses && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeChoice(questionIndex, choiceIndex)
                                }
                                className="rounded-lg px-2 py-1 text-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                aria-label={`Supprimer le choix ${choiceIndex + 1}`}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {!hasResponses && (
                        <button
                          type="button"
                          onClick={() => addChoice(questionIndex)}
                          className="mt-4 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                        >
                          + Ajouter un choix
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="sticky bottom-0 mt-8 border-t border-slate-200 bg-[#f8fafc]/95 py-5 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {hasResponses
                ? "Les questions sont verrouillées car des réponses existent déjà."
                : "Vous pourrez modifier l’enquête plus tard, tant qu’elle ne contient pas de réponse."}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => nav(-1)}
                disabled={loading}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-on-brand transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Enregistrement..."
                  : editId
                    ? "Enregistrer les modifications"
                    : "Créer l’enquête"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}