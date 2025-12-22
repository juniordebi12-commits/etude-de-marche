// src/offline/localSurveyStorage.js

const STORAGE_KEY = "sana_offline_responses_v1";

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Erreur lecture localStorage", e);
    return [];
  }
}

function saveAll(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Erreur écriture localStorage", e);
  }
}

/**
 * Enregistre / met à jour une interview locale.
 * payload : {
 *   client_uuid,
 *   survey_id,
 *   interviewer_name,
 *   participant_name,
 *   updated_at_local,
 *   device_id,
 *   app_version,
 *   answers: [{ question_id, answer_text, selected_choices }],
 *   status: 'draft' | 'pending' | 'synced' | 'error',
 *   sync_error
 * }
 */
export function upsertLocalInterview(payload) {
  const list = loadAll();
  const idx = list.findIndex((i) => i.client_uuid === payload.client_uuid);
  if (idx === -1) {
    list.push(payload);
  } else {
    list[idx] = { ...list[idx], ...payload };
  }
  saveAll(list);
  return payload;
}

export function getLocalInterview(client_uuid) {
  return loadAll().find((i) => i.client_uuid === client_uuid) || null;
}

export function listPendingInterviews() {
  return loadAll().filter(
    (i) => i.status === "pending" || i.status === "error"
  );
}

export function markSynced(client_uuid) {
  const list = loadAll();
  const idx = list.findIndex((i) => i.client_uuid === client_uuid);
  if (idx !== -1) {
    list[idx].status = "synced";
    list[idx].sync_error = null;
    saveAll(list);
  }
}

export function markError(client_uuid, errorText) {
  const list = loadAll();
  const idx = list.findIndex((i) => i.client_uuid === client_uuid);
  if (idx !== -1) {
    list[idx].status = "error";
    list[idx].sync_error = errorText;
    saveAll(list);
  }
}
