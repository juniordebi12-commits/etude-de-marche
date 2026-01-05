// src/pages/SurveyDetails.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../api/useAuth";
import { getSurvey, getResponsesBySurvey, deleteRespondent, deleteResponsesByRespondent } from "../api/useDashboard";
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
  const tplFromData = (templatesData?.TEMPLATES || []).find((t) => String(t.id).toLowerCase() === String(key).toLowerCase());
  if (tplFromData && tplFromData.image) return tplFromData.image;
  if (TEMPLATE_IMAGES_FULL[String(key).toLowerCase()]) return TEMPLATE_IMAGES_FULL[String(key).toLowerCase()];
  return null;
}

function getSurveyCover(survey) {
  const uploaded = normalizeImageUrl(survey?.image);
  if (uploaded) return uploaded;
  const possibleKeys = [survey?.template, survey?.template_key, survey?.slug, survey?.type].filter(Boolean).map((k) => String(k).toLowerCase());
  for (const k of possibleKeys) {
    const resolved = resolveTemplateImage(k);
    if (resolved) return resolved;
  }
  const title = (survey?.title || "").toLowerCase();
  const description = (survey?.description || "").toLowerCase();
  const text = `${title} ${description}`;
  const titleSlug = title.replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
  if (TEMPLATE_IMAGES_FULL[titleSlug]) return TEMPLATE_IMAGES_FULL[titleSlug];
  if (text.includes("satisfaction") && text.includes("client")) return TEMPLATE_IMAGES_FULL["satisfaction"];
  if (text.includes("net promoter") || text.includes("nps")) return TEMPLATE_IMAGES_FULL["nps"];
  if (text.includes("feedback") || (text.includes("service") && text.includes("client"))) return TEMPLATE_IMAGES_FULL["feedback"];
  if (text.includes("étude") || text.includes("marché") || text.includes("etude de marche")) return TEMPLATE_IMAGES_FULL["etude-de-marche"];
  if (text.includes("climat") && text.includes("social")) return TEMPLATE_IMAGES_FULL["rh-climat-social"];
  if (text.includes("formation")) return TEMPLATE_IMAGES_FULL["evaluation-formation"];
  if (text.includes("inscription") || text.includes("événement") || text.includes("evenement")) return TEMPLATE_IMAGES_FULL["inscription-evenement"];
  if (text.includes("terrain") || text.includes("suivi terrain")) return TEMPLATE_IMAGES_FULL["suivi-terrain"];
  if (text.includes("employé") || text.includes("employes") || text.includes("employé")) return TEMPLATE_IMAGES_FULL["satisfaction-employes"];
  if (text.includes("produit") && (text.includes("avis") || text.includes("note"))) return TEMPLATE_IMAGES_FULL["avis-produit"];
  if (text.includes("support") || text.includes("demande de support") || text.includes("facturation")) return TEMPLATE_IMAGES_FULL["demande-support"];
  if (text.includes("contact") || text.includes("message")) return TEMPLATE_IMAGES_FULL["formulaire-contact"];
  if (text.includes("commercial") || text.includes("point de vente") || text.includes("ventes")) return TEMPLATE_IMAGES_FULL["evaluation-commerciale"];
  return null;
}

function uniqBy(arr = [], keyFn) {
  const map = new Map();
  arr.forEach(item => {
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
  const csv = [cols.join(","), ...rows.map(r => cols.map(c => {
    const v = r[c] == null ? "" : String(r[c]).replace(/"/g, '""');
    return `"${v}"`;
  }).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
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
    const extracted = respArr.map(r => {
      let rd = null;
      if (r.respondent && typeof r.respondent === "object") rd = r.respondent;
      else if (r.respondent && (typeof r.respondent === "number" || typeof r.respondent === "string")) rd = { id: r.respondent };
      else if (r.respondent_id) rd = { id: r.respondent_id };
      else if (r.respondent_obj) rd = r.respondent_obj;
      else rd = { id: `resp-${r.id}` };

      if (!rd.interviewer_name && (r.interviewer_name || r.interviewer)) rd.interviewer_name = r.interviewer_name || r.interviewer || "";
      if (!rd.participant_name && (r.participant_name || r.participant)) rd.participant_name = r.participant_name || r.participant || "";
      if (!rd.created_at && r.created_at) rd.created_at = r.created_at;
      rd._sample_response_id = r.id;
      return rd;
    });

    const uniq = uniqBy(extracted, x => String(x.id ?? JSON.stringify(x)));
    const norm = uniq.map(u => ({
      id: u.id,
      interviewer_name: u.interviewer_name || u.name || u.username || "",
      participant_name: u.participant_name || u.participant || "",
      created_at: u.created_at || "",
      extra: u
    }));
    return norm;
  }, []);

  async function reloadResponsesAndRespondents() {
    try {
      const resp = await getResponsesBySurvey(access, id);
      const respArr = Array.isArray(resp) ? resp : (resp.results || []);
      setResponses(respArr);
      setRespondents(extractRespondentsFromResponses(respArr));
    } catch (e) {
      console.error("reloadResponses error", e);
    }
  }

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    setErr(null);

    Promise.all([
      (getSurvey ? getSurvey(access, id) : fetch(`/api/surveys/${id}/`).then(r => (r.ok ? r.json() : null))),
      getResponsesBySurvey(access, id).catch(() => [])
    ])
      .then(([sv, resp]) => {
        if (!mounted) return;
        setSurvey(sv || null);
        const respArr = Array.isArray(resp) ? resp : (resp.results || []);
        setResponses(respArr);
        setRespondents(extractRespondentsFromResponses(respArr));
      })
      .catch(e => {
        console.error("SurveyDetails load error", e);
        if (mounted) setErr(e);
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [id, access, extractRespondentsFromResponses]);

  if (loading) return <div className="container py-8">Chargement...</div>;
  if (err) return <div className="container py-8 section-card text-red-600">Erreur: {String(err.message || err)}</div>;
  if (!survey) return <div className="container py-8 section-card">Enquête non trouvée.</div>;

  const cover = getSurveyCover(survey);

  function normalizeResponsesForCsv(items = []) {
    if (!Array.isArray(items) || items.length === 0) return [];
    const keys = new Set();
    items.slice(0, 50).forEach(it => {
      Object.keys(it || {}).forEach(k => keys.add(k));
    });
    const cols = Array.from(keys);
    return items.map(it => {
      const row = {};
      cols.forEach(k => {
        const v = it[k];
        if (v == null) row[k] = "";
        else if (typeof v === "object") row[k] = JSON.stringify(v);
        else row[k] = String(v);
      });
      return row;
    });
  }

  async function handleDeleteRespondent(respondentId) {
    if (!respondentId) {
      alert("respondentId manquant.");
      return;
    }
    if (!confirm("Supprimer cet enquêteur et toutes ses réponses ? Cette action est irréversible.")) return;

    const prevRespondents = respondents;
    const prevResponses = responses;

    try {
      setRespondents(prev => prev.filter(r => String(r.id) !== String(respondentId)));
      setResponses(prev => prev.filter(rr => {
        if (!rr.respondent) return true;
        if (typeof rr.respondent === "object") return String(rr.respondent.id) !== String(respondentId);
        return String(rr.respondent) !== String(respondentId);
      }));

      await deleteRespondent(access, respondentId);
      await reloadResponsesAndRespondents();
      alert("Enquêteur et ses réponses supprimés.");
    } catch (e) {
      console.error("deleteRespondent failed:", e, e?.payload || e?.message || e);
      try {
        await deleteResponsesByRespondent(access, respondentId);
        try { await deleteRespondent(access, respondentId); } catch {}
        await reloadResponsesAndRespondents();
        alert("Suppression effectuée (fallback).");
      } catch (fallbackErr) {
        console.error("Fallback delete error:", fallbackErr, fallbackErr?.payload || fallbackErr?.message || fallbackErr);
        setRespondents(prevRespondents);
        setResponses(prevResponses);
        let msg = "Erreur suppression (voir console).";
        if (e && e.payload && typeof e.payload === "object") {
          try { msg = JSON.stringify(e.payload); } catch {}
        } else if (e && e.message) msg = e.message;
        alert(msg);
      }
    }
  }

  return (
    <div className="container py-8">
      <div className="mb-4">
        <button type="button" onClick={() => nav(-1)} className="px-3 py-1 text-sm rounded border border-slate-200 text-slate-700 hover:bg-slate-50">← Retour</button>
      </div>

      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex gap-4 items-start">
          {cover && <img src={cover} alt="" className="w-24 h-24 rounded-xl object-cover hidden sm:block" />}
          <div>
            <h1 className="text-2xl font-bold">{survey.title || `Enquête ${id}`}</h1>
            <div className="text-sm text-muted">{survey.description}</div>
            <div className="text-xs text-muted mt-2">Créée: {survey.created_at ? new Date(survey.created_at).toLocaleString() : "-"}</div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="section-card lg:col-span-2 p-4">
          <div className="text-sm text-muted">Statistiques</div>
          <div className="flex items-center gap-6 mt-3">
            <div>
              <div className="text-xs text-muted">Questions</div>
              <div className="text-xl font-bold">{(survey.questions || []).length}</div>
            </div>
            <div>
              <div className="text-xs text-muted">Total réponses (answers)</div>
              <div className="text-xl font-bold">{responses.length}</div>
            </div>
            <div>
              <div className="text-xs text-muted">Enquêteurs distincts</div>
              <div className="text-xl font-bold">{respondents.length}</div>
            </div>
          </div>
        </div>

        <div className="section-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Actions</div>
            <div className="text-xs text-muted">Export / utilitaires</div>
          </div>

          <div className="space-y-2">
            <button onClick={() => {
              const rows = normalizeResponsesForCsv(responses);
              if (rows.length === 0) { alert("Aucune réponse à exporter."); return; }
              downloadCsvFile(`responses_survey_${id}.csv`, rows);
            }} className="px-3 py-2 border rounded btn-outline w-full text-left">Télécharger les réponses (CSV)</button>

            <button onClick={() => {
              if (respondents.length === 0) { alert("Aucun enquêteur à exporter."); return; }
              const rows = respondents.map(r => ({ id: r.id, interviewer_name: r.interviewer_name, participant_name: r.participant_name, created_at: r.created_at }));
              downloadCsvFile(`respondents_survey_${id}.csv`, rows, ["id","interviewer_name","participant_name","created_at"]);
            }} className="px-3 py-2 border rounded btn-outline w-full text-left">Exporter la liste des enquêteurs (CSV)</button>

            <button onClick={() => {
              if (!Array.isArray(responses) || responses.length === 0) { alert("Aucune réponse à prévisualiser."); return; }
              const head = `<style>body{font-family:Inter,system-ui,Arial;}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:6px;font-size:12px}</style>`;
              const keys = Object.keys(responses[0]).slice(0,20);
              const header = `<tr>${keys.map(k => `<th>${k}</th>`).join("")}</tr>`;
              const rowsHtml = responses.slice(0,50).map(r => `<tr>${keys.map(k => {
                const v = r[k] == null ? "" : typeof r[k] === "object" ? JSON.stringify(r[k]) : String(r[k]);
                return `<td>${v}</td>`;
              }).join("")}</tr>`).join("");
              const html = `<html><body>${head}<h3>Preview — premières réponses (${responses.length})</h3><table>${header}${rowsHtml}</table></body></html>`;
              const w = window.open("", "_blank");
              if (w) { w.document.write(html); w.document.close(); } else { alert("Impossible d'ouvrir la fenêtre de prévisualisation (popup bloquée)."); }
            }} className="px-3 py-2 border rounded btn-outline w-full text-left">Prévisualiser (premières réponses)</button>
          </div>
        </div>
      </div>

      <div className="section-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Enquêteurs</h3>
            <div className="text-xs text-muted">Liste des personnes qui ont rempli cette enquête (extrait depuis les réponses)</div>
          </div>
          <div className="text-xs text-muted">{respondents.length} trouvés</div>
        </div>

        {respondents.length === 0 ? (
          <div className="text-sm text-muted">Aucun enquêteur trouvé pour le moment.</div>
        ) : (
          <div className="grid gap-2">
            {respondents.map(r => (
              <div key={String(r.id)} className="flex items-center justify-between p-3 bg-[var(--card)] rounded border">
                <div>
                  <div className="font-medium">{r.interviewer_name || `Enquêteur #${r.id}`}</div>
                  <div className="text-xs text-muted">{r.participant_name ? `Participant: ${r.participant_name}` : ""}</div>
                  <div className="text-xs text-muted mt-1">Date: {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button className="px-3 py-1 border rounded text-sm" onClick={() => {
                    const items = responses.filter(rr => {
                      if (!rr.respondent) return false;
                      if (typeof rr.respondent === "number" || typeof rr.respondent === "string") return String(rr.respondent) === String(r.id);
                      else if (typeof rr.respondent === "object") return (String(rr.respondent.id) === String(r.id) || String(rr.respondent_id) === String(r.id));
                      return false;
                    });
                    if (!items || items.length === 0) { alert("Aucune réponse trouvée pour cet enquêteur"); return; }
                    const rows = items.map(r2 => ({
                      id: r2.id,
                      respondent: typeof r2.respondent === "object" ? r2.respondent.id ?? JSON.stringify(r2.respondent) : r2.respondent,
                      question: r2.question && (typeof r2.question === "object" ? r2.question.id ?? r2.question.text ?? JSON.stringify(r2.question) : r2.question),
                      answer_text: r2.answer_text || "",
                      selected_choices: Array.isArray(r2.selected_choices) ? r2.selected_choices.map(c => typeof c === "object" ? c.id ?? c.text : c).join("|") : r2.selected_choices || "",
                      created_at: r2.created_at || ""
                    }));
                    downloadCsvFile(`responses_respondent_${r.id}_survey_${id}.csv`, rows, ["id","respondent","question","answer_text","selected_choices","created_at"]);
                  }}>Télécharger réponses</button>

                  <button className="px-3 py-1 bg-[var(--brand)] text-white rounded text-sm" onClick={() => nav(`/dashboard/survey/${id}`)}>Voir résultats</button>

                  <button className="px-3 py-1 border rounded text-sm bg-red-600 text-white" onClick={() => handleDeleteRespondent(r.id)}>Supprimer enquêteur</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
