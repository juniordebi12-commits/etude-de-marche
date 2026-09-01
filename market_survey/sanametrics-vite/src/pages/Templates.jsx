import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as templatesStore from "../data/templatesStore";
import { PRESETS } from "../data/TemplatesData";

function getQuestionCount(template) {
  if (Array.isArray(template.questions)) {
    return template.questions.length;
  }

  return PRESETS[template.id]?.questions?.length || 0;
}

function TemplateCard({ template }) {
  const questionCount = getQuestionCount(template);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
      <div className="relative h-44 overflow-hidden bg-slate-100">
        {template.image ? (
          <img
            src={template.image}
            alt={template.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 text-4xl">
            ▣
          </div>
        )}

        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm">
          {template.category || "Général"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">
            {template.title}
          </h2>

          {questionCount > 0 && (
            <span className="shrink-0 text-xs font-medium text-slate-500">
              {questionCount} questions
            </span>
          )}
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {template.description || "Un modèle prêt à adapter à votre besoin."}
        </p>

        <div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row">
          <Link
            to={`/templates/${template.id}`}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Voir l’aperçu
          </Link>

          <Link
            to={`/editor?template=${template.id}`}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-on-brand transition hover:bg-blue-700"
          >
            Utiliser ce modèle
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function Templates() {
  const [allTemplates] = useState(() => templatesStore.getTemplates());
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = useMemo(() => {
    const counts = new Map();

    allTemplates.forEach((template) => {
      const category = template.category || "Général";
      counts.set(category, (counts.get(category) || 0) + 1);
    });

    return [
      {
        key: "all",
        label: "Tous les modèles",
        count: allTemplates.length,
      },
      ...Array.from(counts.entries()).map(([label, count]) => ({
        key: label,
        label,
        count,
      })),
    ];
  }, [allTemplates]);

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return allTemplates.filter((template) => {
      const category = template.category || "Général";

      const matchesCategory =
        activeCategory === "all" || category === activeCategory;

      const matchesQuery =
        !normalizedQuery ||
        template.title?.toLowerCase().includes(normalizedQuery) ||
        template.description?.toLowerCase().includes(normalizedQuery) ||
        category.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [allTemplates, activeCategory, query]);

  return (
    <main className="min-h-screen bg-[#f8fafc] py-10 md:py-14">
      <div className="container">
        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-10 shadow-sm md:px-10 md:py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Démarrez plus vite
              </p>

              <h1 className="mt-3 text-3xl font-extrabold text-slate-950 md:text-4xl">
                Modèles d’enquêtes prêts à adapter
              </h1>

              <p className="mt-4 leading-7 text-slate-600">
                Choisissez une structure professionnelle, adaptez les questions
                à votre contexte, puis publiez votre enquête.
              </p>
            </div>

            <Link
              to="/editor"
              className="inline-flex w-fit items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Partir d’une enquête vide
            </Link>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Rechercher un modèle
            </label>

            <div className="relative max-w-xl">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ex. satisfaction, RH, terrain..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Effacer la recherche"
                >
                  ×
                </button>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {categories.map((category) => {
                const isActive = activeCategory === category.key;

                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => setActiveCategory(category.key)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700"
                    }`}
                  >
                    {category.label}
                    <span
                      className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {category.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                {activeCategory === "all"
                  ? "Tous les modèles"
                  : activeCategory}
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                {filteredTemplates.length} modèle
                {filteredTemplates.length > 1 ? "s" : ""} disponible
                {filteredTemplates.length > 1 ? "s" : ""}.
              </p>
            </div>
          </div>

          {filteredTemplates.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="text-3xl">⌕</div>

              <h2 className="mt-3 text-lg font-bold text-slate-900">
                Aucun modèle trouvé
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Essaie un autre mot-clé ou réinitialise les filtres.
              </p>

              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("all");
                }}
                className="mt-5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Afficher tous les modèles
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}