import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Logo from "../assets/LogoSana.png";
import { useAuth } from "../api/useAuth";

const navLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-blue-50 text-[var(--brand)] dark:bg-blue-500/15 dark:text-blue-300"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
  }`;

export default function Header() {
  const { isAuthenticated, logout, access } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(
    localStorage.getItem("theme") === "dark"
  );

  const loggedIn = isAuthenticated || Boolean(access);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="container flex min-h-18 items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-lg md:hidden dark:border-slate-700"
              aria-label="Ouvrir le menu"
            >
              ☰
            </button>

            <Link
              to="/"
              className="flex items-center gap-2.5"
              onClick={closeMobileMenu}
            >
              <img
                src={Logo}
                alt="SanaMetrics"
                className="h-8 w-8 object-contain"
              />
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                SanaMetrics
              </span>
            </Link>

            <nav className="ml-4 hidden items-center gap-1 lg:flex">
              {loggedIn ? (
                <>
    <NavLink to="/dashboard" className={navLinkClass}>
      Dashboard
    </NavLink>

    <NavLink to="/editor" className={navLinkClass}>
      Créer une enquête
    </NavLink>

    <NavLink to="/features" className={navLinkClass}>
      Fonctionnalités
    </NavLink>

    <NavLink to="/billing" className={navLinkClass}>
      Crédits IA
    </NavLink>
  </>
              ) : (
                <>
                  <NavLink to="/pricing" className={navLinkClass}>
                    Tarifs
                  </NavLink>

                  <NavLink to="/about" className={navLinkClass}>
                    À propos
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => setDark((value) => !value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-white/10"
              aria-label="Changer le thème"
              title="Changer le thème"
            >
              {dark ? "☀️" : "🌙"}
            </button>

            {!loggedIn ? (
              <>
                <NavLink
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  Se connecter
                </NavLink>

                <NavLink
                  to="/register"
                  className="btn-primary px-4 py-2 text-sm"
                >
                  Commencer
                </NavLink>
              </>
            ) : (
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-red-50 hover:text-red-700 dark:border-slate-700 dark:text-slate-200"
              >
                Déconnexion
              </button>
            )}
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 md:hidden"
          onClick={closeMobileMenu}
        >
          <aside
            className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col overflow-y-auto bg-white p-6 shadow-2xl dark:bg-slate-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-8 flex items-center justify-between">
              <Link
  to="/"
  className="flex items-center gap-2.5"
  onClick={closeMobileMenu}
>
                <img src={Logo} alt="" className="h-8 w-8" />
                <span className="font-bold text-slate-900 dark:text-white">
                  SanaMetrics
                </span>
              </Link>

              <button
                type="button"
                onClick={closeMobileMenu}
                className="rounded-lg border px-3 py-1.5 text-lg dark:border-slate-700"
                aria-label="Fermer le menu"
              >
                ×
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Navigation
              </div>

              {loggedIn ? (
                <>
                  <NavLink
                    to="/dashboard"
                    onClick={closeMobileMenu}
                    className={navLinkClass}
                  >
                    Dashboard
                  </NavLink>

                  <NavLink
                    to="/editor"
                    onClick={closeMobileMenu}
                    className={navLinkClass}
                  >
                    Créer une enquête
                  </NavLink>

                  <NavLink
                    to="/billing"
                    onClick={closeMobileMenu}
                    className={navLinkClass}
                  >
                    Crédits IA
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink
                    to="/features"
                    onClick={closeMobileMenu}
                    className={navLinkClass}
                  >
                    Fonctionnalités
                  </NavLink>

                  <NavLink
                    to="/pricing"
                    onClick={closeMobileMenu}
                    className={navLinkClass}
                  >
                    Tarifs
                  </NavLink>

                  <NavLink
                    to="/about"
                    onClick={closeMobileMenu}
                    className={navLinkClass}
                  >
                    À propos
                  </NavLink>
                </>
              )}
            </nav>

            <div className="mt-auto border-t border-slate-200 pt-5 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDark((value) => !value)}
                className="mb-3 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-left text-sm font-medium dark:border-slate-700"
              >
                {dark ? "☀️ Passer au mode clair" : "🌙 Passer au mode sombre"}
              </button>

              {!loggedIn ? (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="btn-outline text-center"
                  >
                    Connexion
                  </Link>

                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="btn-primary text-center"
                  >
                    Commencer
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                  }}
                  className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-left text-sm font-semibold text-red-700"
                >
                  Déconnexion
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}