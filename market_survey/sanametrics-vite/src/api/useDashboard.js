// src/api/useDashboard.js
import { apiGet, apiPost, apiPut, apiDelete, API_BASE } from "./useApi";

/**
 * Survey / Responses helpers - frontend API wrapper
 *
 * - apiGet/apiPost/apiPut/apiDelete proviennent de src/api/useApi.js
 * - token (access) est optionnel : si null, useApi prendra le token du localStorage
 */

const SURVEY_CACHE_PREFIX = "sana_survey_"; // ✅ pour le cache offline

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

  // 1) Si on est en ligne, on tente l’API, puis on met en cache
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
      // fallback sur le cache si l’API échoue
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

  // 2) Si on est offline, on lit directement le cache
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
   Create / Update / Delete helpers (JSON simple)
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
   Create / Update avec image (multipart/form-data)
   ------------------------- */

async function handleFormError(res) {
  let payload;
  try {
    payload = await res.json();
  } catch {
    payload = await res.text();
  }
  const err = new Error(`HTTP ${res.status}`);
  err.status = res.status;
  err.payload = payload;
  throw err;
}

// 🆕 création avec image
export async function createSurveyWithImage(token, payload, imageFile) {
  const form = new FormData();
  form.append("title", payload.title ?? "");
  form.append("description", payload.description ?? "");
  form.append("questions", JSON.stringify(payload.questions || []));

  if (imageFile) {
    form.append("image", imageFile);
  }

  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/surveys/`, {
    method: "POST",
    headers,
    body: form, // ⚠️ surtout PAS de Content-Type manuel
  });

  if (!res.ok) {
    await handleFormError(res);
  }
  return await res.json();
}

// 🆕 update avec image
export async function updateSurveyWithImage(token, id, payload, imageFile) {
  const form = new FormData();
  form.append("title", payload.title ?? "");
  form.append("description", payload.description ?? "");
  form.append("questions", JSON.stringify(payload.questions || []));

  // image facultative : si tu ne choisis pas de nouvelle image, on ne renvoie pas le champ
  if (imageFile) {
    form.append("image", imageFile);
  }

  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

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

/* Responses CRUD */
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

/* Respondent CRUD (useful to delete respondent and its responses) */
export async function listRespondents(token, params = "") {
  // params may be like "?survey=6" or empty
  const path =
    params && String(params).trim()
      ? `/api/respondents/${params}`
      : `/api/respondents/`;
  return await apiGet(path, token);
}

export async function getRespondent(token, id) {
  return await apiGet(`/api/respondents/${id}/`, token);
}

/**
 * Create respondent:
 * body: { survey: <id>, interviewer_name: "...", participant_name: "..." }
 * Note: Respondent.survey is required by the model — provide survey id here.
 */
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
 * Fallback helper: delete responses for a respondent if direct respondent delete fails.
 */
export async function deleteResponsesByRespondent(token, respondentId) {
  const list = await apiGet(
    `/api/responses/?respondent=${respondentId}`,
    token
  );
  const items = Array.isArray(list) ? list : list.results || [];
  for (const r of items) {
    try {
      await deleteResponse(token, r.id);
    } catch (e) {
      console.warn(
        "deleteResponsesByRespondent: failed to delete response",
        r.id,
        e
      );
    }
  }
  return true;
}

/* -------------------------
   Dashboard helpers (analysis)
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
  (survey?.questions || []).forEach((q) => {
    qmap[q.id] = {
      id: q.id,
      text: q.text,
      question_type: q.question_type,
      totalAnswers: 0,
      choiceCounts: {},
      textAnswers: [],
    };
    (q.choices || []).forEach((c) => {
      const key = c.id ?? c.text;
      qmap[q.id].choiceCounts[key] = {
        id: c.id ?? null,
        text: c.text,
        count: 0,
      };
    });
  });

  parsedResponses.forEach((r) => {
    let qid = null;
    if (r.question === undefined || r.question === null) return;
    if (typeof r.question === "number") qid = r.question;
    else if (typeof r.question === "object")
      qid = r.question.id ?? r.question.pk ?? null;
    if (!qid) return;

    if (!qmap[qid]) {
      qmap[qid] = {
        id: qid,
        text: r.question?.text ?? `Question ${qid}`,
        question_type: r.question?.question_type ?? "text",
        totalAnswers: 0,
        choiceCounts: {},
        textAnswers: [],
      };
    }

    const slot = qmap[qid];
    slot.totalAnswers = (slot.totalAnswers || 0) + 1;

    if (slot.question_type === "single" || slot.question_type === "multiple") {
      const sel = r.selected_choices || [];
      if (Array.isArray(sel)) {
        sel.forEach((c) => {
          let cid = null,
            ctext = null;
          if (typeof c === "number") cid = c;
          else if (c && typeof c === "object") {
            cid = c.id ?? null;
            ctext = c.text ?? null;
          }
          const key = cid ?? ctext ?? JSON.stringify(c);
          if (!slot.choiceCounts[key]) {
            slot.choiceCounts[key] = {
              id: cid,
              text: ctext ?? String(key),
              count: 0,
            };
          }
          slot.choiceCounts[key].count =
            (slot.choiceCounts[key].count || 0) + 1;
        });
      } else {
        const c = sel;
        if (c) {
          let cid = typeof c === "number" ? c : c?.id ?? null;
          let key = cid ?? (c?.text ?? String(c));
          if (!slot.choiceCounts[key])
            slot.choiceCounts[key] = {
              id: cid,
              text: c?.text ?? key,
              count: 0,
            };
          slot.choiceCounts[key].count =
            (slot.choiceCounts[key].count || 0) + 1;
        }
      }
    } else {
      if (r.answer_text) slot.textAnswers.push(String(r.answer_text));
    }
  });

  const questions = Object.values(qmap).map((q) => {
    const choiceCounts = Object.values(q.choiceCounts || {}).map((c) => ({
      id: c.id,
      text: c.text,
      count: c.count || 0,
    }));
    choiceCounts.sort((a, b) => b.count - a.count);
    return {
      id: q.id,
      text: q.text,
      question_type: q.question_type,
      totalAnswers: q.totalAnswers || 0,
      choiceCounts,
      textAnswers: q.textAnswers || [],
    };
  });

  const totalResponses = parsedResponses.length;

  return {
    survey,
    totalResponses,
    questions,
    raw: { responses: parsedResponses },
  };
}

/**
 * fetchDashboardSummary: fallback local computation if needed
 */
export async function fetchDashboardSummary(token) {
  try {
    const summary = await apiGet("/api/dashboard-summary/", token);
    if (
      summary &&
      (summary.total_surveys || summary.total_responses || summary.top_surveys)
    ) {
      return {
        totalSurveys: summary?.total_surveys ?? 0,
        totalResponses: summary?.total_responses ?? 0,
        surveys: (summary?.top_surveys || []).map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          responses: s.responses ?? 0,
        })),
        raw: summary,
      };
    }
  } catch (e) {
    // fallback local computation below
  }

  const [surveys, responses] = await Promise.all([
    listSurveys(token).catch(() => []),
    listResponses(token).catch(() => []),
  ]);

  const totalSurveys = Array.isArray(surveys) ? surveys.length : 0;
  const totalResponses = Array.isArray(responses) ? responses.length : 0;

  const counts = {};
  if (Array.isArray(responses)) {
    responses.forEach((r) => {
      let sid = null;
      if (typeof r.survey_id === "number") {
        sid = r.survey_id;
      }
      if (!sid) {
        const q = r.question || null;
        if (!q) return;
        if (typeof q === "object") {
          if (q.survey) {
            if (typeof q.survey === "number") sid = q.survey;
            else if (q.survey && q.survey.id) sid = q.survey.id;
          }
          if (!sid && (q.survey_id || q.surveyId))
            sid = q.survey_id || q.surveyId;
        }
      }
      if (!sid) return;
      counts[sid] = (counts[sid] || 0) + 1;
    });
  }

  const surveysWithCounts = (Array.isArray(surveys) ? surveys : []).map(
    (s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      responses: counts[s.id] || 0,
    })
  );

  surveysWithCounts.sort((a, b) => b.responses - a.responses);

  return {
    totalSurveys,
    totalResponses,
    surveys: surveysWithCounts,
    raw: { surveys, responses },
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
