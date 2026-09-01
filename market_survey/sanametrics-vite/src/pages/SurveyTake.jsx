import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../api/useAuth";
import { getSurvey } from "../api/useDashboard";
import { upsertLocalInterview } from "../offline/localSurveyStorage";
import { API_BASE } from "../api/useApi";
import * as templatesStore from "../data/templatesStore";
import templatesData from "../data/TemplatesData";

const TEMPLATE_IMAGES_FULL = {
  satisfaction: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4",
  nps: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
  feedback: "https://images.unsplash.com/photo-1492724441997-5dc865305da7",
  "etude-de-marche":
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40",
  "rh-climat-social":
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
  "evaluation-formation":
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
  "inscription-evenement":
    "https://images.unsplash.com/photo-1503428593586-e225b39bddfe",
  "suivi-terrain":
    "https://images.unsplash.com/photo-1484820540004-14229fe36ca4",
  "satisfaction-employes":
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
  "avis-produit":
    "https://images.unsplash.com/photo-1581090700227-1e37b190418e",
  "demande-support":
    "https://images.unsplash.com/photo-1521791055366-0d553872125f",
  "formulaire-contact":
    "https://images.unsplash.com/photo-1519241047957-be31d7379a5d",
  "evaluation-commerciale":
    "https://images.unsplash.com/photo-1556740738-b6a63e27c4df",
};

function normalizeImageUrl(image) {
  if (!image || typeof image !== "string") return null;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${API_BASE}${image}`;
}

function resolveTemplateImage(key) {
  if (!key) return null;

  const templateFromStore = templatesStore.getTemplate(String(key));
  if (templateFromStore?.image) return templateFromStore.image;

  const templateFromData = (templatesData?.TEMPLATES || []).find(
    (template) =>
      String(template.id).toLowerCase() === String(key).toLowerCase()
  );

  if (templateFromData?.image) return templateFromData.image;

  return TEMPLATE_IMAGES_FULL[String(key).toLowerCase()] || null;
}

function getSurveyCover(survey) {
  const uploadedImage = normalizeImageUrl(survey?.image);
  if (uploadedImage) return uploadedImage;

  const possibleKeys = [
    survey?.template,
    survey?.template_key,
    survey?.slug,
    survey?.type,
  ]
    .filter(Boolean)
    .map((key) => String(key).toLowerCase());

  for (const key of possibleKeys) {
    const image = resolveTemplateImage(key);
    if (image) return image;
  }

  const title = (survey?.title || "").toLowerCase();
  const description = (survey?.description || "").toLowerCase();
  const content = `${title} ${description}`;
  const titleSlug = title.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  if (TEMPLATE_IMAGES_FULL[titleSlug]) {
    return TEMPLATE_IMAGES_FULL[titleSlug];
  }

  if (content.includes("satisfaction") && content.includes("client")) {
    return TEMPLATE_IMAGES_FULL.satisfaction;
  }
  if (content.includes("net promoter") || content.includes("nps")) {
    return TEMPLATE_IMAGES_FULL.nps;
  }
  if (content.includes("feedback")) {
    return TEMPLATE_IMAGES_FULL.feedback;
  }
  if (content.includes("étude") || content.includes("marché")) {
    return TEMPLATE_IMAGES_FULL["etude-de-marche"];
  }
  if (content.includes("formation")) {
    return TEMPLATE_IMAGES_FULL["evaluation-formation"];
  }
  if (content.includes("terrain")) {
    return TEMPLATE_IMAGES_FULL["suivi-terrain"];
  }
  if (content.includes("support")) {
    return TEMPLATE_IMAGES_FULL["demande-support"];
  }
  if (content.includes("contact")) {
    return TEMPLATE_IMAGES_FULL["formulaire-contact"];
  }

  return null;
}

function generateClientUUID() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();

  return `client-${Math.random().toString(36).substring(2)}-${Date.now().toString(36)}`;
}

function isQuestionVisible(question, answers) {
  const condition = question.visible_if;
  if (!condition) return true;

  const sourceAnswer = answers?.[condition.question_id];
  const operator = condition.operator || "equals";
  const target = condition.value;

  if (Array.isArray(sourceAnswer)) {
    const includesValue = sourceAnswer.map(String).includes(String(target));

    if (operator === "includes") return includesValue;
    if (operator === "not_includes") return !includesValue;

    return true;
  }

  const currentValue = sourceAnswer != null ? String(sourceAnswer) : "";
  const expectedValue = target != null ? String(target) : "";

  if (operator === "equals") return currentValue === expectedValue;
  if (operator === "not_equals") return currentValue !== expectedValue;

  return true;
}

function isEmptyAnswer(value) {
  return (
    value === "" ||
    value == null ||
    (Array.isArray(value) && value.length === 0)
  );
}

function computeProgress(survey, answers) {
  if (!survey || !Array.isArray(survey.questions)) {
    return { answered: 0, total: 0, percent: 0 };
  }

  let total = 0;
  let answered = 0;

  for (const question of survey.questions) {
    if (!isQuestionVisible(question, answers)) continue;

    total += 1;

    if (!isEmptyAnswer(answers[question.id])) {
      answered += 1;
    }
  }

  return {
    answered,
    total,
    percent: total > 0 ? Math.round((answered * 100) / total) : 0,
  };
}

function questionTypeHint(questionType) {
  const hints = {
    text: "Réponse libre",
    number: "Réponse numérique",
    single: "Choisissez une réponse",
    multiple: "Plusieurs réponses possibles",
  };

  return hints[questionType] || "Réponse";
}

export default function SurveyTake() {
  const { id } = useParams();
  const { access } = useAuth();
  const nav = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [respondentInfo, setRespondentInfo] = useState({
    interviewer_name: "",
    participant_name: "",
  });
  const [answers, setAnswers] = useState({});
  const [interviewStatus, setInterviewStatus] = useState("draft");
  const [clientUuid] = useState(generateClientUUID);

  const isPublicUser = !access;

  useEffect(() => {
    if (!id) return;

    setLoading(true);

    async function loadSurvey() {
      try {
        const loadedSurvey = await getSurvey(access, id);
        setSurvey(loadedSurvey || null);

        const initialAnswers = {};

        (loadedSurvey?.questions || []).forEach((question) => {
          initialAnswers[question.id] =
            question.question_type === "multiple" ? [] : "";
        });

        setAnswers(initialAnswers);
      } catch (loadError) {
        console.error("load survey", loadError);
        setError("Impossible de charger l’enquête.");
      } finally {
        setLoading(false);
      }
    }

    loadSurvey();
  }, [id, access]);

  function buildInterviewPayload(
    status = "draft",
    currentAnswers = answers,
    currentRespondentInfo = respondentInfo
  ) {
    if (!survey) return null;

    const formattedAnswers = [];

    for (const question of survey.questions || []) {
      if (!isQuestionVisible(question, currentAnswers)) continue;

      const value = currentAnswers[question.id];

      if (isEmptyAnswer(value)) continue;

      const answer = {
        question_id: question.id,
        answer_text: "",
        selected_choices: [],
      };

      if (question.question_type === "text" || question.question_type === "number") {
        answer.answer_text = String(value);
      }

      if (question.question_type === "single") {
        const choiceId = resolveChoiceId(value, question);
        answer.selected_choices = choiceId != null ? [choiceId] : [];
      }

      if (question.question_type === "multiple") {
        const values = Array.isArray(value) ? value : [value];

        answer.selected_choices = values
          .map((item) => resolveChoiceId(item, question))
          .filter((choiceId) => choiceId != null);
      }

      formattedAnswers.push(answer);
    }

    return {
      client_uuid: clientUuid,
      survey_id: Number(id),
      interviewer_name: currentRespondentInfo.interviewer_name || "",
      participant_name: currentRespondentInfo.participant_name || "",
      updated_at_local: new Date().toISOString(),
      device_id: "web-browser",
      app_version: "web-1.0",
      answers: formattedAnswers,
      status,
      sync_error: null,
    };
  }

  function autoSave(currentAnswers, currentRespondentInfo) {
    if (!survey) return;

    const payload = buildInterviewPayload(
      "draft",
      currentAnswers,
      currentRespondentInfo
    );

    if (!payload) return;

    upsertLocalInterview(payload);
    setInterviewStatus("draft");
  }

  function handleChangeRespondent(event) {
    const { name, value } = event.target;

    setRespondentInfo((previous) => {
      const updated = { ...previous, [name]: value };
      autoSave(answers, updated);
      return updated;
    });
  }

  function handleChangeAnswer(questionId, value) {
    setAnswers((previous) => {
      const updated = { ...previous, [questionId]: value };
      autoSave(updated, respondentInfo);
      return updated;
    });
  }

  function handleToggleMultiple(questionId, choice) {
    setAnswers((previous) => {
      const currentValues = Array.isArray(previous[questionId])
        ? [...previous[questionId]]
        : [];

      const choiceKey = String(choice);
      const existingIndex = currentValues.findIndex(
        (value) => String(value) === choiceKey
      );

      if (existingIndex === -1) {
        currentValues.push(choiceKey);
      } else {
        currentValues.splice(existingIndex, 1);
      }

      const updated = { ...previous, [questionId]: currentValues };
      autoSave(updated, respondentInfo);

      return updated;
    });
  }

  function resolveChoiceId(choiceKey, question) {
    if (choiceKey == null) return null;
    if (typeof choiceKey === "number") return choiceKey;

    const numericValue = Number(choiceKey);
    if (!Number.isNaN(numericValue)) return numericValue;

    const foundChoice = (question.choices || []).find(
      (choice) =>
        String(choice.id) === String(choiceKey) ||
        String(choice.text) === String(choiceKey)
    );

    return foundChoice ? foundChoice.id : null;
  }

  function validateBeforeSubmit() {
    const hasAtLeastOneAnswer = Object.values(answers).some(
      (value) => !isEmptyAnswer(value)
    );

    if (!hasAtLeastOneAnswer) {
      setError("Renseignez au moins une réponse avant d’envoyer le formulaire.");
      return false;
    }

    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!survey || !validateBeforeSubmit()) return;

    setSubmitting(true);
    setError(null);
    setInterviewStatus("pending");

    try {
      const payload = buildInterviewPayload("pending");

      if (!payload) {
        throw new Error("Payload invalide");
      }

      const response = await fetch(`${API_BASE}/api/mobile/sync/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(access ? { Authorization: `Bearer ${access}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setInterviewStatus("synced");

      nav(`/surveys/${id}/thanks`, {
        state: {
          answers: payload.answers,
          respondent: {
            interviewer_name:
              payload.interviewer_name ||
              (isPublicUser ? "Réponse en ligne" : ""),
            participant_name: payload.participant_name,
          },
          isPublic: isPublicUser,
        },
      });
    } catch (submitError) {
      console.error(submitError);
      setError("Erreur lors de l’envoi des réponses. Le brouillon reste enregistré sur cet appareil.");
      setInterviewStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] py-16">
        <div className="container text-center text-slate-600">
          Chargement du questionnaire…
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-[#f8fafc] py-16">
        <div className="container">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700">
            Enquête introuvable.
          </div>
        </div>
      </div>
    );
  }

  const { answered, total, percent } = computeProgress(survey, answers);
  const visibleQuestions = (survey.questions || []).filter((question) =>
    isQuestionVisible(question, answers)
  );
  const cover = getSurveyCover(survey);

  const statusLabel = {
    draft: "Brouillon enregistré sur cet appareil",
    pending: "Envoi des réponses en cours…",
    synced: "Réponses synchronisées",
    error: "Synchronisation à réessayer",
  }[interviewStatus];

  const statusClass = {
    draft: "border-slate-200 bg-slate-50 text-slate-600",
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    synced: "border-emerald-200 bg-emerald-50 text-emerald-700",
    error: "border-red-200 bg-red-50 text-red-700",
  }[interviewStatus];

  return (
    <main className="min-h-screen bg-[#f8fafc] py-6 md:py-10">
      <div className="container max-w-3xl">
        {!isPublicUser && (
          <button
            type="button"
            onClick={() => nav(-1)}
            className="mb-5 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
          >
            ← Retour
          </button>
        )}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {cover && (
            <img
              src={cover}
              alt=""
              className="h-40 w-full object-cover sm:h-52"
            />
          )}

          <div className="p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Questionnaire
            </p>

            <h1 className="mt-2 text-2xl font-extrabold text-slate-950 md:text-3xl">
              {survey.title}
            </h1>

            {survey.description && (
              <p className="mt-3 leading-7 text-slate-600">
                {survey.description}
              </p>
            )}

            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                <span className="font-semibold text-slate-700">
                  Progression
                </span>
                <span className="font-semibold text-blue-700">
                  {answered} sur {total} réponse{total > 1 ? "s" : ""}
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">
              {isPublicUser
                ? "Vos informations"
                : "Informations de collecte"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Ces champs sont optionnels.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {!isPublicUser && (
                <input
                  name="interviewer_name"
                  value={respondentInfo.interviewer_name}
                  onChange={handleChangeRespondent}
                  placeholder="Nom de l’enquêteur"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              )}

              <input
                name="participant_name"
                value={respondentInfo.participant_name}
                onChange={handleChangeRespondent}
                placeholder="Votre nom (facultatif)"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </section>

          {visibleQuestions.map((question, index) => (
            <section
              key={question.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
            >
              <div className="mb-5 flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                  {index + 1}
                </span>

                <div>
                  <h2 className="font-bold leading-6 text-slate-900">
                    {question.text}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {questionTypeHint(question.question_type)}
                  </p>
                </div>
              </div>

              {question.question_type === "text" && (
                <textarea
                  value={answers[question.id] || ""}
                  onChange={(event) =>
                    handleChangeAnswer(question.id, event.target.value)
                  }
                  rows={4}
                  placeholder="Saisissez votre réponse..."
                  className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              )}

              {question.question_type === "number" && (
                <input
                  type="number"
                  value={answers[question.id] ?? ""}
                  onChange={(event) =>
                    handleChangeAnswer(
                      question.id,
                      event.target.value === ""
                        ? ""
                        : Number(event.target.value)
                    )
                  }
                  placeholder="Entrez une valeur numérique"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              )}

              {question.question_type === "single" && (
                <div className="grid gap-3">
                  {(question.choices || []).map((choice) => {
                    const choiceKey = choice.id ?? choice.text;
                    const selected =
                      String(answers[question.id]) === String(choiceKey);

                    return (
                      <label
                        key={choiceKey}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                          selected
                            ? "border-blue-500 bg-blue-50 text-blue-900"
                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={selected}
                          onChange={() =>
                            handleChangeAnswer(question.id, choiceKey)
                          }
                          className="h-4 w-4 accent-blue-600"
                        />
                        <span className="text-sm font-medium">{choice.text}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {question.question_type === "multiple" && (
                <div className="grid gap-3">
                  {(question.choices || []).map((choice) => {
                    const choiceKey = choice.id ?? choice.text;
                    const selected =
                      Array.isArray(answers[question.id]) &&
                      answers[question.id].some(
                        (value) => String(value) === String(choiceKey)
                      );

                    return (
                      <label
                        key={choiceKey}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                          selected
                            ? "border-blue-500 bg-blue-50 text-blue-900"
                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            handleToggleMultiple(question.id, choiceKey)
                          }
                          className="h-4 w-4 rounded accent-blue-600"
                        />
                        <span className="text-sm font-medium">{choice.text}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>
          ))}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <section className="sticky bottom-0 border-t border-slate-200 bg-[#f8fafc]/95 py-5 backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span
                className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${statusClass}`}
              >
                {statusLabel}
              </span>

              <div className="flex gap-3">
                {!isPublicUser && (
                  <button
                    type="button"
                    onClick={() => nav(-1)}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Annuler
                  </button>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-on-brand transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Envoi en cours..." : "Envoyer les réponses"}
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Les réponses sont enregistrées sur cet appareil puis synchronisées
              dès qu’une connexion est disponible.
            </p>
          </section>
        </form>
      </div>
    </main>
  );
}