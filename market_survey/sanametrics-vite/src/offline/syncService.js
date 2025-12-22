// src/offline/syncService.js

import {
  listPendingInterviews,
  markSynced,
  markError,
} from "./localSurveyStorage";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function syncOne(interview) {
  const url = `${API_BASE}/api/mobile/sync/`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_uuid: interview.client_uuid,
      survey_id: interview.survey_id,
      interviewer_name: interview.interviewer_name,
      participant_name: interview.participant_name || "",
      updated_at_local: interview.updated_at_local,
      device_id: interview.device_id || "web-browser",
      app_version: interview.app_version || "web-1.0",
      answers: interview.answers,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erreur serveur");
  }
}

export async function runSync() {
  if (!navigator.onLine) return;

  const pending = listPendingInterviews();
  for (const interview of pending) {
    try {
      await syncOne(interview);
      markSynced(interview.client_uuid);
    } catch (e) {
      console.error("Erreur synchro", e);
      markError(interview.client_uuid, String(e.message || e));
    }
  }
}

export function setupOnlineSyncListener() {
  window.addEventListener("online", () => {
    runSync();
  });
}
