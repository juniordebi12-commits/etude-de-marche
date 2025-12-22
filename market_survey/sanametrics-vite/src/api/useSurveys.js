// src/api/useSurveys.js
import { apiGet, apiPost, apiPut, apiDelete } from "./useApi";

export async function listSurveys(token) {
  return await apiGet("/api/surveys/", token);
}
export async function getSurvey(token, id) {
  return await apiGet(`/api/surveys/${id}/`, token);
}
export async function createSurvey(token, payload) {
  return await apiPost("/api/surveys/", payload, token);
}
export async function updateSurvey(token, id, payload) {
  return await apiPut(`/api/surveys/${id}/`, payload, token);
}
export async function deleteSurvey(token, id) {
  return await apiDelete(`/api/surveys/${id}/`, token);
}
