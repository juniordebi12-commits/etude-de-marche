// src/components/Header.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MegaMenu from "./MegaMenu";
import Logo from "../assets/LogoSana.png";
import { useAuth } from "../api/useAuth";

export default function Header() {
  const { isAuthenticated, logout, isAdmin } = useAuth();

  const [dark, setDark] = useState(localStorage.getItem("theme") === "dark");

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
    <header className="border-b bg-[var(--card)]">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-5">
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

        <div className="flex items-center gap-3">
          <button
            onClick={() => setDark(!dark)}
            className="px-3 py-1 rounded text-sm border hover:bg-gray-100 dark:hover:bg-[#ffffff0f] transition"
            aria-label="Changer de thème"
          >
            {dark ? "🌙" : "☀️"}
          </button>

          {isAuthenticated && isAdmin && (
            <Link to="/templates-admin" className="px-3 py-1 border rounded text-sm">
              Templates Admin
            </Link>
          )}

          {!isAuthenticated ? (
            <Link to="/login" className="px-3 py-1 border rounded text-sm">
              Se connecter
            </Link>
          ) : (
            <>
              <Link to="/dashboard" className="px-3 py-1 border rounded text-sm">
                Dashboard
              </Link>
              <button onClick={logout} className="px-3 py-1 border rounded text-sm">
                Déconnexion
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
