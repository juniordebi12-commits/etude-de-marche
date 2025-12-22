// src/api/auth.js
import { apiPost } from "./useApi";

const STORAGE_KEY = "sana_auth";

export async function obtainToken(username, password) {
  const data = await apiPost("/api/token/", { username, password }, null);
  // data: { access, refresh }
  return data;
}

export function saveAuth(obj) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

export function loadAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}
