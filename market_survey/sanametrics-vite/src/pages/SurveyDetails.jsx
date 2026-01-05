// src/pages/SurveyDetails.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../api/useAuth";
import {
  getSurvey,
  getResponsesBySurvey,
  deleteRespondent,
  deleteResponsesByRespondent
} from "../api/useDashboard";
import { API_BASE } from "../api/useApi";
import * as templatesStore from "../data/templatesStore";
import templatesData from "../data/TemplatesData";

/* same TEMPLATE_IMAGES_FULL fallback as before */
const TEMPLATE_IMAGES_FULL = {
  satisfaction: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4",
  nps: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
  feedback: "https://images.unsplash.com/photo-1492724441997-5dc865305da7",
  "etude-de-marche": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40",
  "rh-climat-social": "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
  "evaluation-formation": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
  "inscription-evenement": "https://images.unsplash.com/photo-1503428593586-e225b39bddfe",
  "suivi-terrain": "https://images.unsplash.com/photo-1484820540004-14229fe36ca4",
  "satisfaction-employes": "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
  "avis-produit": "https://images.unsplash.com/photo-1581090700227-1e37b190418e",
  "demande-support": "https://images.unsplash.com/photo-1521791055366-0d553872125f",
  "formulaire-contact": "https://images.unsplash.com/photo-1519241047957-be31d7379a5d",
  "evaluation-commerciale": "https://images.unsplash.com/photo-1556740738-b6a63e27c4df",
};

function normalizeImageUrl(image) {
  if (!image) return null;
  if (typeof image !== "string") return null;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return `${API_BASE}${image}`;
}

function resolveTemplateImage(key) {
  if (!key) return null;
  const tplFromStore = templatesStore.getTemplate(String(key));
  if (tplFromStore && tplFromStore.image) return tplFromStore.image;
  const tplFromData = (templatesData?.TEMPLATES || []).find(
    (t) => String(t.id).toLowerCase() === String(key).toLowerCase()
  );
  if (tplFromData && tplFromData.image) return tplFromData.image;
  if (TEMPLATE_IMAGES_FULL[String(key).toLowerCase()])
    return TEMPLATE_IMAGES_FULL[String(key).toLowerCase()];
  return null;
}

function getSurveyCover(survey) {
  const uploaded = normalizeImageUrl(survey?.image);
  if (uploaded) return uploaded;
  const possibleKeys = [
    survey?.template,
    survey?.template_key,
    survey?.slug,
    survey?.type
  ]
    .filter(Boolean)
    .map((k) => String(k).toLowerCase());
  for (const k of possibleKeys) {
    const resolved = resolveTemplateImage(k);
    if (resolved) return resolved;
  }
  return null;
}

function uniqBy(arr = [], keyFn) {
  const map = new Map();
  arr.forEach((item) => {
    const k = keyFn(item);
    if (!map.has(k)) map.set(k, item);
  });
  return Array.from(map.values());
}

function downloadCsvFile(filename, rows = [], header = []) {
  if (!rows || rows.length === 0) {
    alert("Aucune donnée à exporter.");
    return;
  }
  const cols = header.length ? header : Object.keys(rows[0]);
  const csv = [
    cols.join(","),
    ...rows.map((r) =>
      cols
        .map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export default function SurveyDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { access } = useAuth();

  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [respondents, setRespondents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const extractRespondentsFromResponses = useCallback((respArr = []) => {
    const extracted = respArr.map((r) => {
      let rd =
        typeof r.respondent === "object"
          ? r.respondent
          : { id: r.respondent || r.respondent_id || `resp-${r.id}` };

      return {
        id: rd.id,
        interviewer_name: rd.interviewer_name || r.interviewer_name || "",
        participant_name: rd.participant_name || r.participant_name || "",
        created_at: r.created_at || "",
      };
    });

    return uniqBy(extracted, (x) => String(x.id));
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getSurvey(access, id),
      getResponsesBySurvey(access, id).catch(() => []),
    ])
      .then(([sv, resp]) => {
        if (!mounted) return;
        setSurvey(sv);
        const arr = Array.isArray(resp) ? resp : resp.results || [];
        setResponses(arr);
        setRespondents(extractRespondentsFromResponses(arr));
      })
      .catch(setErr)
      .finally(() => mounted && setLoading(false));

    return () => (mounted = false);
  }, [id, access, extractRespondentsFromResponses]);

  if (loading) return <div className="container py-8">Chargement...</div>;
  if (err)
    return (
      <div className="container py-8 section-card text-red-600">
        Erreur
      </div>
    );

  const cover = getSurveyCover(survey);

  return (
    <div className="container py-6 space-y-6">
      <button
        type="button"
        onClick={() => nav(-1)}
        className="text-sm underline"
      >
        ← Retour
      </button>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex gap-4 items-start">
          {cover && (
            <img
              src={cover}
              alt=""
              className="w-24 h-24 rounded-xl object-cover hidden sm:block"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{survey.title}</h1>
            <div className="text-sm text-muted">{survey.description}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Link to={`/surveys/${id}/take`} className="btn-primary w-full sm:w-auto">
            Collecter des réponses
          </Link>
          <button
            onClick={() => nav(`/dashboard/survey/${id}`)}
            className="btn-outline w-full sm:w-auto"
          >
            Résultats
          </button>
          <Link
            to={`/editor?edit=${id}`}
            className="btn-outline w-full sm:w-auto"
          >
            Modifier
          </Link>
        </div>
      </div>

      {/* STATS + ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="section-card p-4 lg:col-span-2">
          <div className="flex flex-wrap gap-6">
            <div>
              <div className="text-xs text-muted">Questions</div>
              <div className="text-xl font-bold">
                {survey.questions.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted">Réponses</div>
              <div className="text-xl font-bold">{responses.length}</div>
            </div>
            <div>
              <div className="text-xs text-muted">Enquêteurs</div>
              <div className="text-xl font-bold">{respondents.length}</div>
            </div>
          </div>
        </div>

        <div className="section-card p-4 space-y-2">
          <button className="btn-outline w-full text-left">
            Télécharger les réponses (CSV)
          </button>
          <button className="btn-outline w-full text-left">
            Exporter la liste des enquêteurs (CSV)
          </button>
          <button className="btn-outline w-full text-left">
            Prévisualiser (premières réponses)
          </button>
        </div>
      </div>

      {/* ENQUÊTEURS */}
      <div className="section-card p-4 space-y-3">
        {respondents.map((r) => (
          <div
            key={r.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border p-3 rounded"
          >
            <div>
              <div className="font-medium">
                {r.interviewer_name || `Enquêteur #${r.id}`}
              </div>
              <div className="text-xs text-muted">{r.participant_name}</div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button className="border px-3 py-1 rounded text-sm">
                Télécharger réponses
              </button>
              <button className="bg-[var(--brand)] text-white px-3 py-1 rounded text-sm">
                Voir résultats
              </button>
              <button className="bg-red-600 text-white px-3 py-1 rounded text-sm">
                Supprimer enquêteur
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
