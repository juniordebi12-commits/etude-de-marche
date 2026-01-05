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

  // sync mode avec URL
  useEffect(() => {
    const m = location.pathname.includes("register") ? "register" : "login";
    setMode(m);
  }, [location.pathname]);

  const switchToLogin = () => setMode("login");
  const switchToRegister = () => setMode("register");

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusyLogin(true);

    const res = await login(loginForm.username, loginForm.password);
    setBusyLogin(false);

    if (res.ok) {
      navigate("/dashboard", { replace: true });
    } else {
      setError(
        "Identifiants invalides. Vérifie ton nom d'utilisateur et ton mot de passe."
      );
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

    await login(registerForm.username, registerForm.password);
    navigate("/dashboard", { replace: true });
  }

  return (
    <>
      {/* ================= MOBILE ================= */}
      <div className="md:hidden min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-6">
          {mode === "login" ? (
            <>
              <h2 className="text-2xl font-bold mb-4">Connexion</h2>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <input
                  placeholder="Nom d'utilisateur"
                  className="input"
                  value={loginForm.username}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, username: e.target.value })
                  }
                />

                <input
                  type="password"
                  placeholder="Mot de passe"
                  className="input"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                />

                {error && (
                  <div className="text-xs text-red-600">{error}</div>
                )}

                <button className="btn-primary w-full">
                  {busyLogin ? "Connexion..." : "Se connecter"}
                </button>
              </form>

              <button
                onClick={() => setMode("register")}
                className="mt-4 text-sm text-[var(--brand)] underline w-full text-center"
              >
                Pas de compte ? Créer un compte
              </button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-4">Créer un compte</h2>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <input
                  placeholder="Nom d'utilisateur"
                  className="input"
                  value={registerForm.username}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      username: e.target.value,
                    })
                  }
                />

                <input
                  type="email"
                  placeholder="Email"
                  className="input"
                  value={registerForm.email}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      email: e.target.value,
                    })
                  }
                />

                <input
                  type="password"
                  placeholder="Mot de passe"
                  className="input"
                  value={registerForm.password}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      password: e.target.value,
                    })
                  }
                />

                {error && (
                  <div className="text-xs text-red-600">{error}</div>
                )}

                <button className="btn-primary w-full">
                  {loading ? "Création..." : "Créer mon compte"}
                </button>
              </form>

              <button
                onClick={() => setMode("login")}
                className="mt-4 text-sm text-[var(--brand)] underline w-full text-center"
              >
                Déjà un compte ? Se connecter
              </button>
            </>
          )}
        </div>
      </div>

      {/* ================= DESKTOP (INCHANGÉ) ================= */}
      <div className="hidden md:flex container py-10 items-center justify-center">
        <div className="max-w-4xl w-full bg-white auth-card overflow-hidden">
          <div
            className="flex auth-slide"
            style={{
              width: "200%",
              transform:
                mode === "login"
                  ? "translateX(0%)"
                  : "translateX(-50%)",
            }}
          >
            {/* ===== LOGIN ===== */}
            <div className="w-1/2 grid md:grid-cols-2">
              <div className="hidden md:flex flex-col items-center justify-center text-center auth-gradient text-white px-8">
                <h3 className="text-3xl font-bold mb-3">Bonjour</h3>
                <p className="text-sm text-white/85 font-medium mb-6 max-w-xs">
                  Connecte-toi pour gérer tes enquêtes et suivre le terrain.
                </p>
                <button
                  onClick={switchToRegister}
                  className="px-8 py-2 rounded-full border border-white text-sm font-semibold hover:bg-white hover:text-slate-900 transition"
                >
                  CRÉER UN COMPTE
                </button>
              </div>

              <div className="px-8 py-10 flex flex-col justify-center">
                <h2 className="text-3xl font-bold mb-6">Connexion</h2>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <input
                    placeholder="Nom d'utilisateur"
                    className="input"
                    value={loginForm.username}
                    onChange={(e) =>
                      setLoginForm({
                        ...loginForm,
                        username: e.target.value,
                      })
                    }
                  />

                  <input
                    type="password"
                    placeholder="Mot de passe"
                    className="input"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({
                        ...loginForm,
                        password: e.target.value,
                      })
                    }
                  />

                  {error && mode === "login" && (
                    <div className="text-xs text-red-600">{error}</div>
                  )}

                  <button className="btn-primary w-full">
                    {busyLogin ? "Connexion..." : "Se connecter"}
                  </button>
                </form>
              </div>
            </div>

            {/* ===== REGISTER ===== */}
            <div className="w-1/2 grid md:grid-cols-2">
              <div className="hidden md:flex flex-col items-center justify-center text-center auth-gradient text-white px-8 order-2 md:order-1">
                <h3 className="text-3xl font-bold mb-3">Welcome Back</h3>
                <button
                  onClick={switchToLogin}
                  className="px-8 py-2 rounded-full border border-white text-sm font-semibold hover:bg-white hover:text-slate-900 transition"
                >
                  SE CONNECTER
                </button>
              </div>

              <div className="px-8 py-10 flex flex-col justify-center order-1 md:order-2">
                <h2 className="text-3xl font-bold mb-6">Créer un compte</h2>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <input
                    placeholder="Nom d'utilisateur"
                    className="input"
                    value={registerForm.username}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        username: e.target.value,
                      })
                    }
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    className="input"
                    value={registerForm.email}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        email: e.target.value,
                      })
                    }
                  />

                  <input
                    type="password"
                    placeholder="Mot de passe"
                    className="input"
                    value={registerForm.password}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        password: e.target.value,
                      })
                    }
                  />

                  {error && mode === "register" && (
                    <div className="text-xs text-red-600">{error}</div>
                  )}

                  <button className="btn-primary w-full">
                    {loading ? "Création..." : "Créer mon compte"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
