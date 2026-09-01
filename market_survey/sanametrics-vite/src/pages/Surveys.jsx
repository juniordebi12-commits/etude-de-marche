import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../api/useAuth";
import { listSurveys, deleteSurvey } from "../api/useDashboard";
import { API_BASE } from "../api/useApi";
import * as templatesStore from "../data/templatesStore";
import templatesData from "../data/TemplatesData";

const TEMPLATE_IMAGES_FULL = {
  satisfaction: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4",
  nps: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
  feedback: "https://images.unsplash.com/photo-1492724441997-5dc865305da7",
  "etude-de-marche":
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40",
  "rh-climat-social":
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
  "evaluation-formation":
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
  "inscription-evenement":
    "https://images.unsplash.com/photo-1503428593586-e225b39bddfe",
  "suivi-terrain":
    "https://images.unsplash.com/photo-1484820540004-14229fe36ca4",
  "satisfaction-employes":
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
  "avis-produit":
    "https://images.unsplash.com/photo-1581090700227-1e37b190418e",
  "demande-support":
    "https://images.unsplash.com/photo-1521791055366-0d553872125f",
  "formulaire-contact":
    "https://images.unsplash.com/photo-1519241047957-be31d7379a5d",
  "evaluation-commerciale":
    "https://images.unsplash.com/photo-1556740738-b6a63e27c4df",
};

function normalizeImageUrl(image) {
  if (!image || typeof image !== "string") return null;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${API_BASE}${image}`;
}

function resolveTemplateImage(key) {
  if (!key) return null;

  const templateFromStore = templatesStore.getTemplate(String(key));
  if (templateFromStore?.image) return templateFromStore.image;

  const templateFromData = (templatesData?.TEMPLATES || []).find(
    (template) =>
      String(template.id).toLowerCase() === String(key).toLowerCase()
  );

  if (templateFromData?.image) return templateFromData.image;

  return TEMPLATE_IMAGES_FULL[String(key).toLowerCase()] || null;
}

function getSurveyCover(survey) {
  const uploadedImage = normalizeImageUrl(survey?.image);
  if (uploadedImage) return uploadedImage;

  const possibleKeys = [
    survey?.template,
    survey?.template_key,
    survey?.slug,
    survey?.type,
  ]
    .filter(Boolean)
    .map((key) => String(key).toLowerCase());

  for (const key of possibleKeys) {
    const image = resolveTemplateImage(key);
    if (image) return image;
  }

  const title = (survey?.title || "").toLowerCase();
  const description = (survey?.description || "").toLowerCase();
  const content = `${title} ${description}`;

  if (content.includes("satisfaction") && content.includes("client")) {
    return TEMPLATE_IMAGES_FULL.satisfaction;
  }

  if (content.includes("nps") || content.includes("net promoter")) {
    return TEMPLATE_IMAGES_FULL.nps;
  }

  if (content.includes("formation")) {
    return TEMPLATE_IMAGES_FULL["evaluation-formation"];
  }

  if (content.includes("terrain")) {
    return TEMPLATE_IMAGES_FULL["suivi-terrain"];
  }

  if (content.includes("marché") || content.includes("etude de marche")) {
    return TEMPLATE_IMAGES_FULL["etude-de-marche"];
  }

  return null;
}

function formatDate(value) {
  if (!value) return "Date inconnue";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date inconnue";

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Surveys() {
  const { access } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let active = true;

    async function loadSurveys() {
      setLoading(true);
      setError("");

      try {
        const data = await listSurveys(access);

        if (!active) return;

        setSurveys(Array.isArray(data) ? data : data.results || []);
      } catch (loadError) {
        console.error("listSurveys error", loadError);

        if (active) {
          setError(
            loadError?.payload ||
              loadError?.message ||
              "Impossible de charger les enquêtes."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSurveys();

    return () => {
      active = false;
    };
  }, [access, location.key]);

  const filteredSurveys = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return surveys.filter((survey) => {
      const matchesQuery =
        !normalizedQuery ||
        survey.title?.toLowerCase().includes(normalizedQuery) ||
        survey.description?.toLowerCase().includes(normalizedQuery);

      const hasQuestions = (survey.questions || []).length > 0;
      const hasResponses = Boolean(survey.has_responses);

      const matchesFilter =
        filter === "all" ||
        (filter === "ready" && hasQuestions) ||
        (filter === "collecting" && hasResponses) ||
        (filter === "draft" && !hasQuestions);

      return matchesQuery && matchesFilter;
    });
  }, [surveys, query, filter]);

  const readyCount = surveys.filter(
    (survey) => (survey.questions || []).length > 0
  ).length;

  const collectingCount = surveys.filter(
    (survey) => survey.has_responses
  ).length;

  async function handleDelete(id, title) {
    const confirmed = window.confirm(
      `Supprimer « ${title} » ? Cette action est irréversible.`
    );

    if (!confirmed) return;

    try {
      await deleteSurvey(access, id);
      setSurveys((previous) =>
        previous.filter((survey) => survey.id !== id)
      );
    } catch (deleteError) {
      console.error(deleteError);
      alert("Impossible de supprimer cette enquête.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] py-8 md:py-12">
      <div className="container">
        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm md:px-9 md:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Espace de travail
              </p>

              <h1 className="mt-2 text-3xl font-extrabold text-slate-950 md:text-4xl">
                Mes enquêtes
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Créez, partagez et suivez toutes vos enquêtes depuis un seul
                espace.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/templates"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Modèles prêts
              </Link>

              <Link
                to="/editor"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-on-brand transition hover:bg-blue-700"
              >
                + Créer une enquête
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Enquêtes créées</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-900">
                {surveys.length}
              </div>
            </div>

            <div className="rounded-xl bg-blue-50 p-4">
              <div className="text-sm text-blue-700">Prêtes à collecter</div>
              <div className="mt-1 text-2xl font-extrabold text-blue-700">
                {readyCount}
              </div>
            </div>

            <div className="rounded-xl bg-emerald-50 p-4">
              <div className="text-sm text-emerald-700">Avec des réponses</div>
              <div className="mt-1 text-2xl font-extrabold text-emerald-700">
                {collectingCount}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Vos questionnaires
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {filteredSurveys.length} enquête
                {filteredSurveys.length > 1 ? "s" : ""} affichée
                {filteredSurveys.length > 1 ? "s" : ""}.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher une enquête..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-64"
              />

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="all">Toutes les enquêtes</option>
                <option value="ready">Prêtes à collecter</option>
                <option value="collecting">Avec des réponses</option>
                <option value="draft">Sans question</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
              Chargement des enquêtes…
            </div>
          )}

          {!loading && error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
              {String(error)}
            </div>
          )}

          {!loading && !error && surveys.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="text-4xl">▣</div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">
                Votre espace est prêt
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Créez votre première enquête manuellement, à partir d’un modèle
                ou avec l’assistant IA.
              </p>
              <Link
                to="/editor"
                className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-on-brand transition hover:bg-blue-700"
              >
                Créer ma première enquête
              </Link>
            </div>
          )}

          {!loading && !error && surveys.length > 0 && filteredSurveys.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <h2 className="text-lg font-bold text-slate-900">
                Aucune enquête ne correspond à cette recherche
              </h2>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
                className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}

          {!loading && !error && filteredSurveys.length > 0 && (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredSurveys.map((survey) => {
                const cover = getSurveyCover(survey);
                const questionCount = (survey.questions || []).length;
                const isReady = questionCount > 0;

                return (
                  <article
                    key={survey.id}
                    className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                  >
                    <div className="flex w-full flex-col">
                      {cover ? (
                        <img
                          src={cover}
                          alt=""
                          className="h-40 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-40 items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-4xl text-white">
                          ▣
                        </div>
                      )}

                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              isReady
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {isReady ? "Prête à collecter" : "À compléter"}
                          </span>

                          <span className="text-xs text-slate-400">
                            {formatDate(survey.created_at)}
                          </span>
                        </div>

                        <h3 className="mt-4 text-lg font-bold text-slate-900">
                          {survey.title}
                        </h3>

                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                          {survey.description || "Aucune description fournie."}
                        </p>

                        <div className="mt-5 flex items-center gap-4 border-t border-slate-100 pt-4 text-sm">
                          <span className="font-semibold text-slate-700">
                            {questionCount} question
                            {questionCount > 1 ? "s" : ""}
                          </span>

                          {survey.has_responses && (
                            <span className="font-semibold text-emerald-700">
                              Réponses collectées
                            </span>
                          )}
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => nav(`/surveys/${survey.id}`)}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Voir
                          </button>

                          <Link
                            to={`/editor?edit=${survey.id}`}
                            className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-center text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            Modifier
                          </Link>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <Link
                            to={`/surveys/${survey.id}/take`}
                            className="text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                          >
                            Ouvrir le formulaire →
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(survey.id, survey.title)
                            }
                            className="text-sm font-semibold text-red-600 transition hover:text-red-800"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}