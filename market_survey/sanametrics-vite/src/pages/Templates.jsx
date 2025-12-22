// src/pages/Templates.jsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as templatesStore from "../data/templatesStore"; // <-- lire depuis store (localStorage + defaults)

/**
 * Page "Modèles" — utilise templatesStore.getTemplates() pour inclure
 * les modèles créés via l'interface (localStorage) + les defaults.
 */

export default function Templates() {
  const allTemplates = templatesStore.getTemplates(); // prend en compte TemplatesData par défaut
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // compute categories + counts
  const categories = useMemo(() => {
    const map = new Map();
    allTemplates.forEach((t) => {
      const cat = t.category || "Général";
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    const list = [{ key: "all", label: "Tous", count: allTemplates.length }];
    for (const [label, count] of map.entries()) {
      list.push({ key: label, label, count });
    }
    return list;
  }, [allTemplates]);

  // filter templates by query + category
  const filtered = useMemo(() => {
    return allTemplates.filter((t) => {
      const matchesCategory =
        activeCategory === "all" ? true : (t.category || "Général") === activeCategory;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        (t.title || "").toLowerCase().includes(q) ||
        ((t.description || "")).toLowerCase().includes(q) ||
        ((t.id || "")).toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory, allTemplates]);

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                Modèles prêts
              </h1>
              <p className="text-slate-600 mt-2 max-w-2xl">
                Utilisez un modèle préconstruit pour créer votre enquête encore plus rapidement.
              </p>
            </div>

            <div className="w-full md:w-96">
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un modèle..."
                  className="w-full px-4 py-2 rounded-lg border shadow-sm text-sm bg-white"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    aria-label="clear"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-100 px-2 py-1 rounded text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="overflow-x-auto">
              <div className="inline-flex items-center gap-3 p-2 rounded-lg border bg-white shadow-sm">
                {categories.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setActiveCategory(c.key)}
                    className={
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition " +
                      (activeCategory === c.key
                        ? "bg-blue-600 text-white shadow"
                        : "bg-slate-50 text-slate-700 border hover:bg-slate-100")
                    }
                  >
                    <span>{c.label}</span>
                    <span className={
                      (activeCategory === c.key ? "bg-white text-blue-600" : "bg-white text-blue-600") +
                      " px-2 py-0.5 rounded-full text-xs border"
                    }>
                      {c.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-600">
              {filtered.length} modèle{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
              {activeCategory !== "all" ? ` • Catégorie : ${activeCategory}` : ""}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition flex flex-col"
              >
                <div className="h-44 w-full overflow-hidden">
                  <img
                    src={tpl.image}
                    alt={tpl.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {tpl.title}
                    </h2>
                    <div className="text-xs text-slate-400">{tpl.id}</div>
                  </div>

                  <p className="text-sm text-slate-600 mt-3 line-clamp-3">
                    {tpl.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/templates/${tpl.id}`}
                        className="px-3 py-2 rounded-md text-sm border inline-flex items-center gap-2"
                      >
                        Voir aperçu
                      </Link>

                      <Link
                        to={`/editor?template=${tpl.id}`}
                        className="inline-flex px-4 py-2.5 rounded-full text-sm font-semibold transition bg-[#2563eb] hover:bg-[#1e4fd1] text-white !text-white border border-transparent"
                      >
                        Utiliser
                      </Link>
                    </div>

                    <div className="text-xs text-slate-400 px-2 py-1 rounded-full border">
                      {tpl.category || "Général"}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-full section-card p-6 text-center text-slate-600">
                Aucun modèle trouvé.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
