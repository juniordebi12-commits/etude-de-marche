// src/components/MegaMenu.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function MegaMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const firstLinkRef = useRef(null);
  const navigate = useNavigate();

  // fermer sur clic extérieur
  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  // ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // focus auto
  useEffect(() => {
    if (open && firstLinkRef.current) {
      setTimeout(() => firstLinkRef.current.focus(), 80);
    }
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
  onClick={() => setOpen(v => !v)}
  aria-expanded={open}
  className="px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--sana-blue)] rounded"
>
  Produits ▾
</button>

      {open && (
        <div className="absolute left-0 mt-2 w-[900px] max-w-[calc(100vw-2rem)] bg-[var(--card)] border rounded-lg shadow-xl z-50 p-6">
          
          {/* ENTÊTE */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Produits SanaMetrics</h3>
              <p className="text-sm text-muted">Créez, gérez et analysez vos enquêtes facilement.</p>
            </div>

          </div>

          {/* SECTION 3 colonnes */}
          <div className="grid grid-cols-3 gap-6">
            
            {/* Bloc 1 */}
            <div>
              <h4 className="font-semibold mb-2">Enquêtes & Collecte</h4>
              <ul className="space-y-2 text-sm">
                <li><Link ref={firstLinkRef} to="/surveys" className="block hover:underline" onClick={() => setOpen(false)}>Voir les Enquêtes</Link></li>
                <li><Link to="/formulaires" className="block hover:underline" onClick={() => setOpen(false)}>Formulaires</Link></li>
                <li><Link to="/templates" className="block hover:underline" onClick={() => setOpen(false)}>Modèles prêts</Link></li>
              </ul>
            </div>

            {/* Bloc 2 */}
            <div>
              <h4 className="font-semibold mb-2">Analyse & IA</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/features/ai" className="block hover:underline" onClick={() => setOpen(false)}>Génération IA</Link></li>
                <li><Link to="/features/analysis" className="block hover:underline" onClick={() => setOpen(false)}>Analyse avancée</Link></li>
                <li><Link to="/reports" className="block hover:underline" onClick={() => setOpen(false)}>Rapports automatiques</Link></li>
              </ul>
            </div>

            {/* Bloc 3 */}
            <div>
              <h4 className="font-semibold mb-2">Outils Pro</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/integrations" className="block hover:underline" onClick={() => setOpen(false)}>Intégrations</Link></li>
                <li><Link to="/team" className="block hover:underline" onClick={() => setOpen(false)}>Collaboration</Link></li>
              </ul>
            </div>

          </div>

          

        </div>
      )}
    </div>
  );
}
