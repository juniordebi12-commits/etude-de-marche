import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../api/useAuth";
import Logo from "../assets/LogoSana.png";

const linkClass = "text-sm text-slate-300 transition hover:text-white";

export default function Footer() {
  const { isAuthenticated, access } = useAuth();
  const loggedIn = isAuthenticated || Boolean(access);
  const currentYear = new Date().getFullYear();

  const ctaTo = loggedIn ? "/editor" : "/register";
  const ctaLabel = loggedIn ? "Créer une enquête" : "Créer mon compte";

  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="container py-12 md:py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link to="/" className="flex w-fit items-center gap-2.5">
              <img
                src={Logo}
                alt="SanaMetrics"
                className="h-9 w-9 object-contain"
              />
              <span className="text-lg font-bold text-white">SanaMetrics</span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300">
              Créez vos enquêtes, collectez les réponses sur le terrain,
              analysez les résultats et exportez vos rapports simplement.
            </p>

            <Link
              to={ctaTo}
              className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-on-brand transition hover:bg-blue-500"
            >
              {ctaLabel}
            </Link>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold text-white">Découvrir</h3>

            <ul className="space-y-3">
              <li>
                <Link to="/features" className={linkClass}>
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link to="/pricing" className={linkClass}>
                  Tarifs
                </Link>
              </li>
              {loggedIn && (
                <li>
                  <Link to="/dashboard" className={linkClass}>
                    Mon dashboard
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold text-white">SanaMetrics</h3>

            <ul className="space-y-3">
              <li>
                <Link to="/about" className={linkClass}>
                  À propos
                </Link>
              </li>
              <li>
                <a href="mailto:contact@sana.app" className={linkClass}>
                  Nous contacter
                </a>
              </li>
              {!loggedIn && (
                <>
                  <li>
                    <Link to="/login" className={linkClass}>
                      Se connecter
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className={linkClass}>
                      Créer un compte
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-slate-800 pt-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>© {currentYear} SanaMetrics. Tous droits réservés.</p>

          <div className="flex gap-4">
            <span>Créer</span>
            <span>Collecter</span>
            <span>Analyser</span>
          </div>
        </div>
      </div>
    </footer>
  );
}