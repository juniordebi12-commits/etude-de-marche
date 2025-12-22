// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t bg-white dark:bg-slate-900 mt-16">
      <div className="container py-10">

        {/* Top sections */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">

          {/* Logo + description */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              SanaMetrics
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
              La plateforme moderne pour créer, collecter et analyser vos données
              en un seul endroit.
            </p>
          </div>

          {/* Produits */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Produits
            </h3>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400">
              <li><Link to="/features" className="hover:text-[var(--brand,#4f46e5)] transition">Fonctionnalités</Link></li>
              <li><Link to="/templates" className="hover:text-[var(--brand,#4f46e5)] transition">Modèles prêts</Link></li>
              <li><Link to="/pricing" className="hover:text-[var(--brand,#4f46e5)] transition">Tarifs</Link></li>
            </ul>
          </div>

          {/* Outils Pro */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Outils Pro
            </h3>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400">
              <li><Link to="/entreprises" className="hover:text-[var(--brand,#4f46e5)] transition">Entreprise</Link></li>
              <li><Link to="/integrations" className="hover:text-[var(--brand,#4f46e5)] transition">Intégrations</Link></li>
              <li><Link to="/team" className="hover:text-[var(--brand,#4f46e5)] transition">Collaboration</Link></li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Ressources
            </h3>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400">
              <li><Link to="/about" className="hover:text-[var(--brand,#4f46e5)] transition">À propos</Link></li>
              <li><a href="mailto:contact@sana.app" className="hover:text-[var(--brand,#4f46e5)] transition">Contact</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t mt-10 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>© 2025 SanaMetrics — Tous droits réservés.</div>

          <div className="mt-3 md:mt-0 flex items-center gap-2">
            <span>Fait avec ❤️</span>
            <span className="opacity-50">•</span>
            <span>Design minimal & moderne</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
