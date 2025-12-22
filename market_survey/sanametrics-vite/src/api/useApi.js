// src/api/useApi.js
export const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

/**
 * low-level fetch wrapper (no JSON parsing here)
 */
async function rawFetch(path, { method = "GET", headers = {}, body = null } = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers,
    body,
  });
  return res;
}

/**
 * Refresh token helper (uses localStorage keys you used elsewhere)
 */
async function tryRefresh() {
  const refresh = localStorage.getItem("sana_refresh");
  if (!refresh) return null;

  const res = await rawFetch("/api/auth/refresh/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    // clear tokens if refresh fails
    localStorage.removeItem("sana_access");
    localStorage.removeItem("sana_refresh");
    localStorage.removeItem("sana_user");
    return null;
  }

  const data = await res.json();
  if (data?.access) {
    localStorage.setItem("sana_access", data.access);
    return data.access;
  }
  return null;
}

/**
 * Generic request with auto-refresh on 401
 *
 * options:
 *  - method: GET/POST/PUT/DELETE
 *  - token: optional access token (overrides localStorage)
 *  - body: plain object (will be JSON.stringified unless raw true)
 *  - raw: if true, don't add Content-Type and don't JSON.stringify body
 *  - retry: internal flag to prevent infinite refresh loops
 */
async function request(
  path,
  { method = "GET", token = null, body = null, raw = false, retry = true } = {}
) {
  const access = token || localStorage.getItem("sana_access");
  const headers = {};

  if (!raw) headers["Content-Type"] = "application/json";
  if (access) headers["Authorization"] = `Bearer ${access}`;

  const res = await rawFetch(path, {
    method,
    headers,
    body: body && !raw ? JSON.stringify(body) : body,
  });

  if (res.status === 401 && retry) {
    const newAccess = await tryRefresh();
    if (newAccess) {
      return request(path, { method, token: newAccess, body, raw, retry: false });
    }
  }

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const err = new Error(data?.detail || res.statusText || "API error");
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data;
}

/* ---- convenience exports ---- */
export const apiGet = (path, token) => request(path, { method: "GET", token });
export const apiPost = (path, body, token, raw = false) => request(path, { method: "POST", body, token, raw });
export const apiPut = (path, body, token) => request(path, { method: "PUT", body, token });
export const apiDelete = (path, token) => request(path, { method: "DELETE", token });

export default { apiGet, apiPost, apiPut, apiDelete, API_BASE };
