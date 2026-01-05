import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MegaMenu from "./MegaMenu";
import Logo from "../assets/LogoSana.png";
import { useAuth } from "../api/useAuth";

export default function Header() {
  const { isAuthenticated, logout, isAdmin, access } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(localStorage.getItem("theme") === "dark");

  // ✅ condition fiable de connexion
  const loggedIn = isAuthenticated || !!access;

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <>
      <header className="border-b bg-[var(--card)]">
        <div className="container flex items-center justify-between py-4">

          {/* LEFT */}
          <div className="flex items-center gap-4">
            {/* ☰ mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded border text-lg"
              aria-label="Ouvrir le menu"
            >
              ☰
            </button>

            <Link to="/" className="flex items-center gap-3">
              <img src={Logo} alt="SanaMetrics" className="w-8 h-8" />
              <span className="font-semibold text-lg">SanaMetrics</span>
            </Link>

            <nav className="hidden md:flex items-center gap-4">
              <MegaMenu />
              <Link to="/features" className="px-2 py-1 text-sm">Fonctionnalités</Link>
              <Link to="/pricing" className="px-2 py-1 text-sm">Tarifs</Link>
              <Link to="/about" className="px-2 py-1 text-sm">À propos</Link>
            </nav>
          </div>

          {/* RIGHT (desktop only) */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setDark(!dark)}
              className="px-3 py-1 rounded text-sm border hover:bg-gray-100 dark:hover:bg-[#ffffff0f]"
            >
              {dark ? "🌙" : "☀️"}
            </button>

            {loggedIn && isAdmin && (
              <Link to="/templates-admin" className="px-3 py-1 border rounded text-sm">
                Templates Admin
              </Link>
            )}

            {!loggedIn ? (
              <Link to="/login" className="px-3 py-1 border rounded text-sm">
                Se connecter
              </Link>
            ) : (
              <>
                <Link to="/dashboard" className="px-3 py-1 border rounded text-sm">
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="px-3 py-1 border rounded text-sm"
                >
                  Déconnexion
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setMobileOpen(false)}
        >
          <div
  className="absolute top-0 right-0 h-full w-3/4 max-w-sm bg-white dark:bg-[#0f172a] p-6 overflow-y-auto"
  onClick={(e) => e.stopPropagation()}
>
            <nav className="flex flex-col gap-5 text-sm">

              {/* PRODUITS */}
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Produits
                </div>
                <div className="flex flex-col gap-2 pl-2 text-slate-600 dark:text-slate-300">
                  <Link to="/surveys" onClick={() => setMobileOpen(false)}>Enquêtes</Link>
                  <Link to="/formulaires" onClick={() => setMobileOpen(false)}>Formulaires</Link>
                  <Link to="/templates" onClick={() => setMobileOpen(false)}>Modèles</Link>
                  <Link to="/features/ai" onClick={() => setMobileOpen(false)}>Analyse IA</Link>
                  <Link to="/reports" onClick={() => setMobileOpen(false)}>Rapports</Link>
                </div>
              </div>

              <hr className="border-slate-200 dark:border-slate-700" />

              {/* AUTRES PAGES */}
              <Link to="/pricing" onClick={() => setMobileOpen(false)}>Tarifs</Link>
              <Link to="/about" onClick={() => setMobileOpen(false)}>À propos</Link>

              {loggedIn && (
                <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
              )}

              {loggedIn && isAdmin && (
                <Link to="/templates-admin" onClick={() => setMobileOpen(false)}>
                  Templates Admin
                </Link>
              )}

              {!access ? (
  <Link to="/login" onClick={() => setMobileOpen(false)}>
    Se connecter
  </Link>
) : (
  
  <button
    onClick={() => {
      logout();
      setMobileOpen(false);
    }}
    className="text-left text-red-600 font-medium"
  >

    Déconnexion
  </button>
)}

            </nav>
          </div>
        </div>
      )}
    </>
  );
}