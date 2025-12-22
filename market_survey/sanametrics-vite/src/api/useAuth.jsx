// src/api/useAuth.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { apiPost, API_BASE } from "./useApi";

const AuthContext = createContext(null);
const ACCESS_KEY = "sana_access";
const REFRESH_KEY = "sana_refresh";
const USER_KEY = "sana_user";

/* ---------- utilitaires ---------- */
function truthy(v) {
  if (v === true) return true;
  if (v === false || v === null || v === undefined) return false;
  return String(v).trim().toLowerCase() === "true";
}

function computeIsAdminFromUser(u) {
  if (!u) return false;
  if (u.role && String(u.role).trim().toLowerCase() === "admin") return true;
  if (u.is_admin === true || u.isAdmin === true) return true;
  if (truthy(u.is_staff) || truthy(u.isStaff)) return true;
  if (truthy(u.is_superuser) || truthy(u.isSuperuser)) return true;
  if (u.admin === true || truthy(u.admin)) return true;
  // fallback: any key containing 'admin' true-ish
  for (const k of Object.keys(u || {})) {
    try {
      if (k.toLowerCase().includes("admin") && truthy(u[k])) return true;
    } catch (e) {}
  }
  return false;
}

/* ---------- Provider ---------- */
export function AuthProvider({ children }) {
  const [access, setAccess] = useState(localStorage.getItem(ACCESS_KEY));
  const [refresh, setRefresh] = useState(localStorage.getItem(REFRESH_KEY));
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem(USER_KEY) || "null")
  );
  const [loading, setLoading] = useState(false);

  const saveTokens = (a, r) => {
    if (a) {
      localStorage.setItem(ACCESS_KEY, a);
      setAccess(a);
    }
    if (r) {
      localStorage.setItem(REFRESH_KEY, r);
      setRefresh(r);
    }
  };
  const clearAll = () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setAccess(null);
    setRefresh(null);
    setUser(null);
  };

  /* centralise la récupération de /api/auth/me/ et attache isAdmin */
  const refreshMe = useCallback(
    async (token = access) => {
      if (!token) {
        setUser(null);
        localStorage.removeItem(USER_KEY);
        return null;
      }
      try {
        const res = await fetch(`${API_BASE}/api/auth/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          // token invalide -> clear stored user (mais ne supprime pas automatiquement tokens ici)
          setUser(null);
          localStorage.removeItem(USER_KEY);
          return null;
        }
        const me = await res.json();
        me.isAdmin = computeIsAdminFromUser(me);
        setUser(me);
        localStorage.setItem(USER_KEY, JSON.stringify(me));
        return me;
      } catch (e) {
        console.warn("refreshMe failed", e);
        return null;
      }
    },
    [access]
  );

  /* Refresh tokens via /api/auth/token/refresh/ */
  async function refreshTokens() {
    const r = localStorage.getItem(REFRESH_KEY) || refresh;
    if (!r) return { ok: false, error: "no refresh token" };
    try {
      const res = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: r }),
      });
      const json = await res.json();
      if (!res.ok || !json.access) {
        // clear if refresh failed
        clearAll();
        return { ok: false, error: json };
      }
      // save new tokens (refresh may or may not be rotated)
      saveTokens(json.access, json.refresh || r);
      // refresh user object
      await refreshMe(json.access);
      return { ok: true, data: json };
    } catch (e) {
      console.warn("refreshTokens error", e);
      return { ok: false, error: e };
    }
  }

  /* fetch wrapper qui tente refresh automatique si 401 */
  async function fetchWithAutoRefresh(url, opts = {}) {
    const token = localStorage.getItem(ACCESS_KEY) || access;
    opts.headers = { ...(opts.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };

    let res = await fetch(url, opts);
    if (res.status === 401) {
      const r = await refreshTokens();
      if (r.ok) {
        const newToken = localStorage.getItem(ACCESS_KEY);
        opts.headers.Authorization = `Bearer ${newToken}`;
        res = await fetch(url, opts);
      }
    }
    return res;
  }

  /* ---------- AUTH ACTIONS ---------- */

  // LOGIN : utilise le bon endpoint /api/auth/token/ (TokenObtainPairView)
  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await apiPost("/api/auth/token/", { username, password }, null);
      const a = data?.access;
      const r = data?.refresh;
      if (!a) throw new Error("No access token returned from /api/auth/token/");
      saveTokens(a, r);
      // get user
      await refreshMe(a);
      setLoading(false);
      return { ok: true };
    } catch (err) {
      setLoading(false);
      // normalize error message
      const msg = err?.message || (err?.detail ? JSON.stringify(err.detail) : String(err));
      return { ok: false, error: msg };
    }
  };

  // REGISTER (unchanged : backend register route must exist)
  const register = async (username, password, email = "") => {
    setLoading(true);
    try {
      const data = await apiPost("/api/auth/register/", { username, password, email }, null);
      setLoading(false);
      return { ok: true, data };
    } catch (err) {
      setLoading(false);
      return { ok: false, error: err };
    }
  };

  const logout = useCallback(() => {
    // si tu veux appeler un endpoint backend pour logout/blacklist, tu peux ici
    clearAll();
  }, []);

  // Au démarrage : si access présent mais user absent -> loadMe
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (access && !user && mounted) {
        await refreshMe(access);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [access, user, refreshMe]);

  const isAuthenticated = !!access;
  const isAdmin = user ? computeIsAdminFromUser(user) : false;

  return (
    <AuthContext.Provider
      value={{
        access,
        refresh,
        user,
        setUser,
        login,
        logout,
        register,
        isAuthenticated,
        isAdmin,
        loading,
        refreshMe,
        refreshTokens,
        fetchWithAutoRefresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
