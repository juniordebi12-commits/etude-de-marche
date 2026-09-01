import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../api/useAuth";
import {
  getSurvey,
  getResponsesBySurvey,
  listRespondents,
  deleteRespondent,
  deleteResponsesByRespondent,
} from "../api/useDashboard";
import { API_BASE } from "../api/useApi";
import * as templatesStore from "../data/templatesStore";
import templatesData from "../data/TemplatesData";

const TEMPLATE_IMAGES_FULL = {
  satisfaction: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4",
  nps: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
  feedback: "https://images.unsplash.com/photo-1492724441997-5dc865305da7",
  "etude-de-marche":
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40",
  "evaluation-formation":
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
  "suivi-terrain":
    "https://images.unsplash.com/photo-1484820540004-14229fe36ca4",
};

function normalizeImageUrl(image) {
  if (!image || typeof image !== "string") return null;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${API_BASE}${image}`;
}

function getSurveyCover(survey) {
  const uploadedImage = normalizeImageUrl(survey?.image);
  if (uploadedImage) return uploadedImage;

  const possibleKeys = [
    survey?.template,
    survey?.template_key,
    survey?.slug,
    survey?.type,
  ].filter(Boolean);

  for (const key of possibleKeys) {
    const storedTemplate = templatesStore.getTemplate(String(key));

    if (storedTemplate?.image) return storedTemplate.image;

    const defaultTemplate = (templatesData?.TEMPLATES || []).find(
      (template) =>
        String(template.id).toLowerCase() === String(key).toLowerCase()
    );

    if (defaultTemplate?.image) return defaultTemplate.image;
  }

  const content = `${survey?.title || ""} ${
    survey?.description || ""
  }`.toLowerCase();

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
    month: "long",
    year: "numeric",
  });
}

function downloadCsvFile(filename, rows, headers) {
  if (!rows?.length) {
    alert("Aucune donnée à exporter.");
    return;
  }

  const columns = headers?.length ? headers : Object.keys(rows[0]);

  const csv = [
    columns.join(","),
    ...rows.map((row) =>
      columns
        .map((column) => {
          const value =
            row[column] == null
              ? ""
              : typeof row[column] === "object"
                ? JSON.stringify(row[column])
                : String(row[column]);

          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(link.href);
}

export default function SurveyDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { access } = useAuth();

  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [respondents, setRespondents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reloadData = useCallback(async () => {
    const [surveyData, responsesData, respondentsData] = await Promise.all([
      getSurvey(access, id),
      getResponsesBySurvey(access, id).catch(() => []),
      listRespondents(access, `?survey=${id}`).catch(() => []),
    ]);

    setSurvey(surveyData || null);
    setResponses(
      Array.isArray(responsesData) ? responsesData : responsesData.results || []
    );
    setRespondents(
      Array.isArray(respondentsData)
        ? respondentsData
        : respondentsData.results || []
    );
  }, [access, id]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        await reloadData();
      } catch (loadError) {
        console.error(loadError);

        if (active) {
          setError(
            loadError?.message || "Impossible de charger cette enquête."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [reloadData]);

  async function copyShareLink() {
    const url = `${window.location.origin}/surveys/${id}/take`;

    try {
      await navigator.clipboard.writeText(url);
      alert("Lien copié.");
    } catch {
      alert(`Copie ce lien : ${url}`);
    }
  }

  function shareSurvey() {
    const url = `${window.location.origin}/surveys/${id}/take`;

    if (navigator.share) {
      navigator
        .share({
          title: survey?.title || "Enquête SanaMetrics",
          text: "Réponds à cette enquête.",
          url,
        })
        .catch(() => {});
      return;
    }

    copyShareLink();
  }

  async function handleDeleteRespondent(respondentId, name) {
    const confirmed = window.confirm(
      `Supprimer ${name || "ce répondant"} et ses réponses ?`
    );

    if (!confirmed) return;

    try {
      await deleteRespondent(access, respondentId);
      await reloadData();
    } catch (deleteError) {
      try {
        await deleteResponsesByRespondent(access, respondentId);
        await deleteRespondent(access, respondentId).catch(() => {});
        await reloadData();
      } catch {
        alert("Impossible de supprimer ce répondant.");
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] py-16">
        <div className="container text-slate-600">
          Chargement de l’enquête…
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-[#f8fafc] py-16">
        <div className="container">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error || "Enquête introuvable."}
          </div>
        </div>
      </div>
    );
  }

  const cover = getSurveyCover(survey);
  const questionCount = (survey.questions || []).length;
  const publicSurveyUrl = `${window.location.origin}/surveys/${id}/take`;

  return (
    <main className="min-h-screen bg-[#f8fafc] py-8 md:py-12">
      <div className="container">
        <button
          type="button"
          onClick={() => nav("/surveys")}
          className="mb-5 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          ← Retour aux enquêtes
        </button>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {cover && (
            <img
              src={cover}
              alt=""
              className="h-44 w-full object-cover md:h-60"
            />
          )}

          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    questionCount > 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {questionCount > 0 ? "Prête à collecter" : "À compléter"}
                </span>

                <h1 className="mt-4 text-3xl font-extrabold text-slate-950 md:text-4xl">
                  {survey.title || `Enquête ${id}`}
                </h1>

                {survey.description && (
                  <p className="mt-3 leading-7 text-slate-600">
                    {survey.description}
                  </p>
                )}

                <p className="mt-4 text-sm text-slate-500">
                  Créée le {formatDate(survey.created_at)}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/surveys/${id}/take`}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-on-brand transition hover:bg-blue-700"
                >
                  Collecter des réponses
                </Link>

                <Link
                  to={`/editor?edit=${id}`}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Modifier
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Questions</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">
                  {questionCount}
                </div>
              </div>

              <div className="rounded-xl bg-blue-50 p-4">
                <div className="text-sm text-blue-700">Réponses enregistrées</div>
                <div className="mt-1 text-2xl font-extrabold text-blue-700">
                  {responses.length}
                </div>
              </div>

              <div className="rounded-xl bg-emerald-50 p-4">
                <div className="text-sm text-emerald-700">Répondants</div>
                <div className="mt-1 text-2xl font-extrabold text-emerald-700">
                  {respondents.length}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                  Partage
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  Diffuser cette enquête
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Copiez le lien ou partagez-le directement par WhatsApp,
                  e-mail ou message.
                </p>
              </div>

              <button
                type="button"
                onClick={shareSurvey}
                className="w-fit rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Partager
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <input
                readOnly
                value={publicSurveyUrl}
                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600"
              />

              <button
                type="button"
                onClick={copyShareLink}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Copier le lien
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Résultats
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Analyser et exporter
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Consulte les graphiques, lance une analyse IA et télécharge les
              exports PDF ou Excel directement depuis l’analyse.
            </p>

            <Link
              to={`/dashboard/survey/${id}`}
              className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Voir l’analyse →
            </Link>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Répondants</h2>
              <p className="mt-1 text-sm text-slate-600">
                Les personnes ayant envoyé au moins une réponse à cette enquête.
              </p>
            </div>

            {responses.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const rows = responses.map((response) => ({
                    id: response.id,
                    respondent:
                      typeof response.respondent === "object"
                        ? response.respondent?.id || ""
                        : response.respondent || "",
                    question:
                      typeof response.question === "object"
                        ? response.question?.text || response.question?.id || ""
                        : response.question || "",
                    answer_text: response.answer_text || "",
                    selected_choices: Array.isArray(response.selected_choices)
                      ? response.selected_choices
                          .map((choice) =>
                            typeof choice === "object"
                              ? choice.text || choice.id
                              : choice
                          )
                          .join(" | ")
                      : "",
                    created_at: response.created_at || "",
                  }));

                  downloadCsvFile(
                    `reponses_enquete_${id}.csv`,
                    rows,
                    [
                      "id",
                      "respondent",
                      "question",
                      "answer_text",
                      "selected_choices",
                      "created_at",
                    ]
                  );
                }}
                className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Exporter les réponses CSV
              </button>
            )}
          </div>

          {respondents.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-3xl">◌</div>
              <h3 className="mt-3 font-bold text-slate-900">
                Aucun répondant pour le moment
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Partage le lien du formulaire pour démarrer la collecte.
              </p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {respondents.map((respondent) => {
                const interviewer =
                  respondent.interviewer_name || "Réponse en ligne";
                const participant = respondent.participant_name || "";

                return (
                  <div
                    key={String(respondent.id)}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {interviewer}
                        </h3>

                        {interviewer === "Réponse en ligne" && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold uppercase text-blue-700">
                            Public
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-slate-600">
                        {participant
                          ? `Participant : ${participant}`
                          : "Participant non renseigné"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(respondent.created_at)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteRespondent(respondent.id, interviewer)
                      }
                      className="w-fit text-sm font-semibold text-red-600 transition hover:text-red-800"
                    >
                      Supprimer
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}