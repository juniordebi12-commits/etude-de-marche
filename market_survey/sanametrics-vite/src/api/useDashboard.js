// src/api/useDashboard.js
import { apiGet, apiPost, apiPut, apiDelete, API_BASE } from "./useApi";

/**
 * Survey / Responses helpers - frontend API wrapper
 *
 * - apiGet/apiPost/apiPut/apiDelete proviennent de src/api/useApi.js
 * - token (access) est optionnel : si null, useApi prendra le token du localStorage
 */

const SURVEY_CACHE_PREFIX = "sana_survey_";

/* -------------------------
   Surveys / Responses CRUD
   ------------------------- */

export async function listSurveys(token) {
  return await apiGet("/api/surveys/", token);
}

export async function listResponses(token) {
  return await apiGet("/api/responses/", token);
}

/**
 * GET responses filtered by survey id
 */
export async function getResponsesBySurvey(token, surveyId) {
  return await apiGet(`/api/responses/?survey=${surveyId}`, token);
}

/**
 * GET single survey details (with offline cache)
 */
export async function getSurvey(token, id) {
  const cacheKey = `${SURVEY_CACHE_PREFIX}${id}`;
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  if (isOnline) {
    try {
      const data = await apiGet(`/api/surveys/${id}/`, token);

      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (e) {
        console.warn("Unable to cache survey", e);
      }

      return data;
    } catch (err) {
      console.error("getSurvey live failed, fallback to cache", err);

      try {
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          return JSON.parse(cached);
        }
      } catch (e) {
        console.error("Error reading survey cache", e);
      }

      return null;
    }
  }

  try {
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error("Error reading survey cache", e);
  }

  return null;
}

/* -------------------------
   Create / Update / Delete helpers
   ------------------------- */

export async function createSurvey(token, body) {
  return await apiPost("/api/surveys/", body, token);
}

export async function updateSurvey(token, id, body) {
  return await apiPut(`/api/surveys/${id}/`, body, token);
}

export async function deleteSurvey(token, id) {
  return await apiDelete(`/api/surveys/${id}/`, token);
}

/* -------------------------
   Create / Update avec image
   ------------------------- */

async function handleFormError(res) {
  const text = await res.text();

  let payload = text;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text || "Le serveur n’a retourné aucun détail.";
  }

  const err = new Error(`HTTP ${res.status}`);
  err.status = res.status;
  err.payload = payload;

  throw err;
}

export async function createSurveyWithImage(token, payload, imageFile) {
  const form = new FormData();

  form.append("title", payload.title ?? "");
  form.append("description", payload.description ?? "");
  form.append("questions", JSON.stringify(payload.questions || []));

  if (imageFile) {
    form.append("image", imageFile);
  }

  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api/surveys/`, {
    method: "POST",
    headers,
    body: form,
  });

  if (!res.ok) {
    await handleFormError(res);
  }

  return await res.json();
}

export async function updateSurveyWithImage(token, id, payload, imageFile) {
  const form = new FormData();

  form.append("title", payload.title ?? "");
  form.append("description", payload.description ?? "");
  form.append("questions", JSON.stringify(payload.questions || []));

  if (imageFile) {
    form.append("image", imageFile);
  }

  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api/surveys/${id}/`, {
    method: "PUT",
    headers,
    body: form,
  });

  if (!res.ok) {
    await handleFormError(res);
  }

  return await res.json();
}

/* -------------------------
   Responses CRUD
   ------------------------- */

export async function getResponse(token, id) {
  return await apiGet(`/api/responses/${id}/`, token);
}

export async function createResponse(token, body) {
  return await apiPost("/api/responses/", body, token);
}

export async function createResponsesBulk(token, payload) {
  return await apiPost("/api/responses/bulk/", payload, token);
}

export async function updateResponse(token, id, body) {
  return await apiPut(`/api/responses/${id}/`, body, token);
}

export async function deleteResponse(token, id) {
  return await apiDelete(`/api/responses/${id}/`, token);
}

/* -------------------------
   Respondent CRUD
   ------------------------- */

export async function listRespondents(token, params = "") {
  const path =
    params && String(params).trim()
      ? `/api/respondents/${params}`
      : "/api/respondents/";

  return await apiGet(path, token);
}

export async function getRespondent(token, id) {
  return await apiGet(`/api/respondents/${id}/`, token);
}

export async function createRespondent(token, body) {
  return await apiPost("/api/respondents/", body, token);
}

export async function updateRespondent(token, id, body) {
  return await apiPut(`/api/respondents/${id}/`, body, token);
}

export async function deleteRespondent(token, id) {
  return await apiDelete(`/api/respondents/${id}/`, token);
}

/**
 * Fallback : supprime les réponses d'un répondant.
 */
export async function deleteResponsesByRespondent(token, respondentId) {
  const list = await apiGet(
    `/api/responses/?respondent=${respondentId}`,
    token
  );

  const items = Array.isArray(list) ? list : list.results || [];

  for (const response of items) {
    try {
      await deleteResponse(token, response.id);
    } catch (e) {
      console.warn(
        "deleteResponsesByRespondent: failed to delete response",
        response.id,
        e
      );
    }
  }

  return true;
}

/* -------------------------
   Dashboard helpers
   ------------------------- */

export async function fetchSurveyAnalysis(token, surveyId) {
  const [survey, responses] = await Promise.all([
    getSurvey(token, surveyId).catch(() => null),
    apiGet(`/api/responses/?survey=${surveyId}`, token).catch(() => []),
  ]);

  const parsedResponses = Array.isArray(responses)
    ? responses
    : responses.results || [];

  const qmap = {};

  (survey?.questions || []).forEach((question) => {
    qmap[question.id] = {
      id: question.id,
      text: question.text,
      question_type: question.question_type,
      totalAnswers: 0,
      choiceCounts: {},
      textAnswers: [],
    };

    (question.choices || []).forEach((choice) => {
      const key = choice.id ?? choice.text;

      qmap[question.id].choiceCounts[key] = {
        id: choice.id ?? null,
        text: choice.text,
        count: 0,
      };
    });
  });

  parsedResponses.forEach((response) => {
    let questionId = null;

    if (response.question === undefined || response.question === null) {
      return;
    }

    if (typeof response.question === "number") {
      questionId = response.question;
    } else if (typeof response.question === "object") {
      questionId = response.question.id ?? response.question.pk ?? null;
    }

    if (!questionId) {
      return;
    }

    if (!qmap[questionId]) {
      qmap[questionId] = {
        id: questionId,
        text: response.question?.text ?? `Question ${questionId}`,
        question_type: response.question?.question_type ?? "text",
        totalAnswers: 0,
        choiceCounts: {},
        textAnswers: [],
      };
    }

    const slot = qmap[questionId];
    slot.totalAnswers += 1;

    if (
      slot.question_type === "single" ||
      slot.question_type === "multiple"
    ) {
      const selectedChoices = response.selected_choices || [];

      if (Array.isArray(selectedChoices)) {
        selectedChoices.forEach((choice) => {
          let choiceId = null;
          let choiceText = null;

          if (typeof choice === "number") {
            choiceId = choice;
          } else if (choice && typeof choice === "object") {
            choiceId = choice.id ?? null;
            choiceText = choice.text ?? null;
          }

          const key = choiceId ?? choiceText ?? JSON.stringify(choice);

          if (!slot.choiceCounts[key]) {
            slot.choiceCounts[key] = {
              id: choiceId,
              text: choiceText ?? String(key),
              count: 0,
            };
          }

          slot.choiceCounts[key].count += 1;
        });
      }
    } else if (response.answer_text) {
      slot.textAnswers.push(String(response.answer_text));
    }
  });

  const questions = Object.values(qmap).map((question) => {
    const choiceCounts = Object.values(question.choiceCounts || {}).map(
      (choice) => ({
        id: choice.id,
        text: choice.text,
        count: choice.count || 0,
      })
    );

    choiceCounts.sort((a, b) => b.count - a.count);

    return {
      id: question.id,
      text: question.text,
      question_type: question.question_type,
      totalAnswers: question.totalAnswers || 0,
      choiceCounts,
      textAnswers: question.textAnswers || [],
    };
  });

  return {
    survey,
    totalResponses: parsedResponses.length,
    questions,
    raw: { responses: parsedResponses },
  };
}

/**
 * Dashboard principal.
 * Utilise l'API améliorée ; garde un mode dégradé si elle est indisponible.
 */
export async function fetchDashboardSummary(token, filters = {}) {
  try {
    const params = new URLSearchParams();

if (filters.from) params.set("from", filters.from);
if (filters.to) params.set("to", filters.to);

if (filters.surveyId) {
  params.set("survey_id", filters.surveyId);
}

if (filters.interviewer) {
  params.set("interviewer", filters.interviewer);
}

const query = params.toString() ? `?${params.toString()}` : "";
const summary = await apiGet(
  `/api/dashboard-summary/${query}`,
  token
);

    if (
      summary &&
      (
        summary.total_surveys !== undefined ||
        summary.total_responses !== undefined ||
        summary.top_surveys
      )
    ) {
      return {
        totalSurveys: summary.total_surveys ?? 0,
        totalResponses: summary.total_responses ?? 0,
        totalRespondents: summary.total_respondents ?? 0,
        activeSurveys: summary.active_surveys ?? 0,
        completionRate: summary.completion_rate ?? 0,
        interviewerStats: summary.interviewer_stats ?? [],
        dailyActivity: summary.daily_activity ?? [],
        surveysWithoutResponses: summary.surveys_without_responses ?? [],
        availableSurveys: summary.available_surveys ?? [],
        availableInterviewers: summary.available_interviewers ?? [],

        surveys: (summary.top_surveys || []).map((survey) => ({
          id: survey.id,
          title: survey.title,
          description: survey.description ?? "",
          responses: survey.responses ?? 0,
          respondents: survey.respondents ?? 0,
          questions: survey.questions ?? 0,
          completion_rate: survey.completion_rate ?? 0,
          created_at: survey.created_at ?? "",
          updated_at: survey.updated_at ?? "",
        })),

        raw: summary,
      };
    }
  } catch (e) {
    console.warn(
      "Dashboard API indisponible, calcul local utilisé.",
      e
    );
  }

  const [surveys, responses] = await Promise.all([
    listSurveys(token).catch(() => []),
    listResponses(token).catch(() => []),
  ]);

  const surveyList = Array.isArray(surveys)
    ? surveys
    : surveys.results || [];

  const responseList = Array.isArray(responses)
    ? responses
    : responses.results || [];

  const counts = {};

  responseList.forEach((response) => {
    let surveyId = null;

    if (typeof response.survey_id === "number") {
      surveyId = response.survey_id;
    }

    if (!surveyId) {
      const question = response.question || null;

      if (question && typeof question === "object") {
        if (typeof question.survey === "number") {
          surveyId = question.survey;
        } else if (question.survey?.id) {
          surveyId = question.survey.id;
        } else {
          surveyId = question.survey_id || question.surveyId || null;
        }
      }
    }

    if (surveyId) {
      counts[surveyId] = (counts[surveyId] || 0) + 1;
    }
  });

  const surveysWithCounts = surveyList
    .map((survey) => ({
      id: survey.id,
      title: survey.title,
      description: survey.description ?? "",
      responses: counts[survey.id] || 0,
      respondents: 0,
      questions: Array.isArray(survey.questions)
        ? survey.questions.length
        : 0,
      completion_rate: 0,
    }))
    .sort((a, b) => b.responses - a.responses);

  return {
    totalSurveys: surveyList.length,
    totalResponses: responseList.length,
    availableSurveys: surveyList.map((survey) => ({
  id: survey.id,
  title: survey.title,
})),
    totalRespondents: 0,
    activeSurveys: surveysWithCounts.filter(
      (survey) => survey.responses > 0
    ).length,
    completionRate: 0,
    interviewerStats: [],
    dailyActivity: [],
    surveysWithoutResponses: surveysWithCounts
      .filter((survey) => survey.responses === 0)
      .slice(0, 5),
    surveys: surveysWithCounts,
    raw: {
      surveys: surveyList,
      responses: responseList,
    },
  };
}

export default {
  listSurveys,
  listResponses,
  getResponsesBySurvey,
  getSurvey,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  createSurveyWithImage,
  updateSurveyWithImage,
  getResponse,
  createResponse,
  createResponsesBulk,
  updateResponse,
  deleteResponse,
  listRespondents,
  getRespondent,
  createRespondent,
  updateRespondent,
  deleteRespondent,
  deleteResponsesByRespondent,
  fetchSurveyAnalysis,
  fetchDashboardSummary,
};