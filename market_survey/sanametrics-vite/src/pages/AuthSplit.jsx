// src/pages/AuthSplit.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../api/useAuth";
import { useLocation, useNavigate } from "react-router-dom";

export default function AuthSplit() {
  const { login, register, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // mode: "login" ou "register"
  const initialMode = location.pathname.includes("register")
    ? "register"
    : "login";
  const [mode, setMode] = useState(initialMode);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState(null);
  const [busyLogin, setBusyLogin] = useState(false);

  // si l'URL change (/login ↔ /register), on sync le mode
  useEffect(() => {
    const m = location.pathname.includes("register") ? "register" : "login";
    setMode(m);
  }, [location.pathname]);

  const switchToLogin = () => {
    setMode("login");
    // on NE change PAS de route pour garder l'animation fluide
  };

  const switchToRegister = () => {
    setMode("register");
  };

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusyLogin(true);
    const res = await login(loginForm.username, loginForm.password);
    setBusyLogin(false);
    if (res.ok) {
      navigate("/dashboard", { replace: true });
    } else {
      setError("Identifiants invalides. Vérifie ton nom d'utilisateur et ton mot de passe.");
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!registerForm.username.trim() || !registerForm.password.trim()) {
      setError("Nom d'utilisateur et mot de passe requis.");
      return;
    }

    const res = await register(
      registerForm.username,
      registerForm.password,
      registerForm.email
    );
    if (!res.ok) {
      setError(res.error?.message || "Inscription échouée.");
      return;
    }

    // auto-login après inscription
    await login(registerForm.username, registerForm.password);
    navigate("/dashboard", { replace: true });
  }

  return (
    <div className="container py-10 flex items-center justify-center">
      <div className="max-w-4xl w-full bg-white auth-card overflow-hidden">
        {/* Wrapper qui SLIDE */}
        <div
            className="flex auth-slide"
            style={{
                width: "200%",
                transform: mode === "login" ? "translateX(0%)" : "translateX(-50%)",
            }}
            >

          {/* --- ÉCRAN LOGIN --- */}
          <div className="w-1/2 grid md:grid-cols-2">
            {/* panneau gradient */}
            <div className="hidden md:flex flex-col items-center justify-center text-center auth-gradient text-white px-8">
              <h3 className="text-3xl font-bold mb-3">Bonjour</h3>
              <p className="text-sm text-white/85 font-medium mb-6 max-w-xs">
                Connecte-toi pour gérer tes enquêtes, suivre le terrain et lire
                tes analyses en temps réel.
              </p>
              <button
                onClick={switchToRegister}
                className="inline-flex items-center justify-center px-8 py-2 rounded-full border border-white text-sm font-semibold hover:bg-white hover:text-slate-900 transition-transform transform hover:-translate-y-0.5"
              >
                CRÉER UN COMPTE
              </button>
            </div>

            {/* formulaire login */}
            <div className="px-8 py-10 flex flex-col justify-center">
              <h2 className="text-3xl font-bold mb-2 text-slate-900">
                Connexion
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Utilise ton compte SanaMetrics pour continuer.
              </p>

              <div className="flex gap-3 mb-6">
                <button className="w-9 h-9 rounded-full border text-xs text-slate-400 hover:bg-slate-50">
                  f
                </button>
                <button className="w-9 h-9 rounded-full border text-xs text-slate-400 hover:bg-slate-50">
                  G+
                </button>
                <button className="w-9 h-9 rounded-full border text-xs text-slate-400 hover:bg-slate-50">
                  in
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-4">
                ou connecte-toi avec ton nom d'utilisateur
              </p>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <input
                  placeholder="Nom d'utilisateur"
                  value={loginForm.username}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, username: e.target.value })
                  }
                  className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand,#4f46e5)] focus:border-transparent"
                />
                <input
                  placeholder="Mot de passe"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                  className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand,#4f46e5)] focus:border-transparent"
                />

                {error && mode === "login" && (
                  <div className="text-xs text-red-600">{error}</div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Mot de passe oublié ? (bientôt)</span>
                </div>

                <button
                  type="submit"
                  disabled={busyLogin}
                  className="mt-1 w-full py-2.5 rounded-full text-sm font-semibold text-white bg-[var(--brand,#4f46e5)] hover:bg-indigo-600 disabled:opacity-60 transition-transform transform hover:-translate-y-0.5"
                >
                  {busyLogin ? "Connexion..." : "SE CONNECTER"}
                </button>
              </form>
            </div>
          </div>

          {/* --- ÉCRAN REGISTER --- */}
          <div className="w-1/2 grid md:grid-cols-2">
            {/* panneau gradient */}
            <div className="hidden md:flex flex-col items-center justify-center text-center auth-gradient text-white px-8 order-2 md:order-1">
              <h3 className="text-3xl font-bold mb-3">Welcome Back!</h3>
              <p className="text-sm text-white/85 font-medium mb-6 max-w-xs">
                Tu as déjà un compte ? Reconnecte-toi en un clic et retrouve
                tes enquêtes.
              </p>
              <button
                onClick={switchToLogin}
                className="inline-flex items-center justify-center px-8 py-2 rounded-full border border-white text-sm font-semibold hover:bg-white hover:text-slate-900 transition-transform transform hover:-translate-y-0.5"
              >
                SE CONNECTER
              </button>
            </div>

            {/* formulaire register */}
            <div className="px-8 py-10 flex flex-col justify-center order-1 md:order-2">
              <h2 className="text-3xl font-bold mb-2 text-slate-900">
                Créer un compte
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Rejoins SanaMetrics et organise tes études de marché comme une
                vraie équipe data.
              </p>

              <div className="flex gap-3 mb-6">
                <button className="w-9 h-9 rounded-full border text-xs text-slate-400 hover:bg-slate-50">
                  f
                </button>
                <button className="w-9 h-9 rounded-full border text-xs text-slate-400 hover:bg-slate-50">
                  G+
                </button>
                <button className="w-9 h-9 rounded-full border text-xs text-slate-400 hover:bg-slate-50">
                  in
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-4">
                ou utilise ton email pour t'inscrire
              </p>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <input
                  name="username"
                  value={registerForm.username}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      username: e.target.value,
                    })
                  }
                  placeholder="Nom d'utilisateur"
                  className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand,#4f46e5)] focus:border-transparent"
                />
                <input
                  name="email"
                  type="email"
                  value={registerForm.email}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, email: e.target.value })
                  }
                  placeholder="Email"
                  className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand,#4f46e5)] focus:border-transparent"
                />
                <input
                  name="password"
                  type="password"
                  value={registerForm.password}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      password: e.target.value,
                    })
                  }
                  placeholder="Mot de passe"
                  className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand,#4f46e5)] focus:border-transparent"
                />

                {error && mode === "register" && (
                  <div className="text-xs text-red-600">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 w-full py-2.5 rounded-full text-sm font-semibold text-white bg-[var(--brand,#4f46e5)] hover:bg-indigo-600 disabled:opacity-60 transition-transform transform hover:-translate-y-0.5"
                >
                  {loading ? "Création..." : "CRÉER MON COMPTE"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
