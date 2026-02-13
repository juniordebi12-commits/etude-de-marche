// src/pages/SurveyTake.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../api/useAuth";
import { getSurvey } from "../api/useDashboard";
import { upsertLocalInterview } from "../offline/localSurveyStorage";
import { runSync } from "../offline/syncService";
import { API_BASE } from "../api/useApi";
import * as templatesStore from "../data/templatesStore";
import templatesData from "../data/TemplatesData";

// 🖼 fallback images (kept for backwards compat)
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
  // try store (user created templates)
  const tplFromStore = templatesStore.getTemplate(String(key));
  if (tplFromStore && tplFromStore.image) return tplFromStore.image;
  // try coded data
  const tplFromData = (templatesData?.TEMPLATES || []).find(
    (t) => String(t.id).toLowerCase() === String(key).toLowerCase()
  );
  if (tplFromData && tplFromData.image) return tplFromData.image;
  // fallback map
  const slug = String(key).toLowerCase();
  if (TEMPLATE_IMAGES_FULL[slug]) return TEMPLATE_IMAGES_FULL[slug];
  return null;
}

function getSurveyCover(survey) {
  // 1) prioritized: uploaded image
  const uploaded = normalizeImageUrl(survey?.image);
  if (uploaded) return uploaded;

  // 2) try survey fields that might contain template key
  const possibleKeys = [survey?.template, survey?.template_key, survey?.slug, survey?.type]
    .filter(Boolean)
    .map((k) => String(k).toLowerCase());

  for (const k of possibleKeys) {
    const resolved = resolveTemplateImage(k);
    if (resolved) return resolved;
  }

  // 3) heuristics based on title/description (preserve your original heuristics)
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

function generateClientUUID() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return "client-" + Math.random().toString(36).substring(2) + "-" + Date.now().toString(36);
}

/* skip logic ready */
function isQuestionVisible(question, answers) {
  const cond = question.visible_if;
  if (!cond) return true;
  const sourceAnswer = answers?.[cond.question_id];
  const op = cond.operator || "equals";
  const target = cond.value;
  if (Array.isArray(sourceAnswer)) {
    const has = sourceAnswer.map(String).includes(String(target));
    if (op === "includes") return has;
    if (op === "not_includes") return !has;
    return true;
  } else {
    const val = sourceAnswer != null ? String(sourceAnswer) : "";
    const tgt = target != null ? String(target) : "";
    if (op === "equals") return val === tgt;
    if (op === "not_equals") return val !== tgt;
    return true;
  }
}

function computeProgress(survey, answers) {
  if (!survey || !Array.isArray(survey.questions)) return { answered: 0, total: 0, percent: 0 };
  const isEmpty = (v) => v === "" || v == null || (Array.isArray(v) && v.length === 0);
  let total = 0, answered = 0;
  for (const q of survey.questions) {
    if (!isQuestionVisible(q, answers)) continue;
    total += 1;
    const v = answers[q.id];
    if (!isEmpty(v)) answered += 1;
  }
  const percent = total > 0 ? Math.round((answered * 100) / total) : 0;
  return { answered, total, percent };
}

export default function SurveyTake() {
  const { id } = useParams();
  const { access } = useAuth();
  const nav = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [respondentInfo, setRespondentInfo] = useState({ interviewer_name: "", participant_name: "" });
  const [answers, setAnswers] = useState({});
  const [interviewStatus, setInterviewStatus] = useState("draft");
  const [clientUuid] = useState(generateClientUUID);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      try {
        const sv = await getSurvey(access, id);
        setSurvey(sv || null);
        const init = {};
        (sv?.questions || []).forEach((q) => {
          init[q.id] = q.question_type === "multiple" ? [] : "";
        });
        setAnswers(init);
      } catch (e) {
        console.error("load survey", e);
        setError("Impossible de charger l'enquête.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, access]);

  function autoSave(currentAnswers, currentRespondentInfo) {
    if (!survey) return;
    const payload = buildInterviewPayload("draft", currentAnswers, currentRespondentInfo);
    if (!payload) return;
    upsertLocalInterview(payload);
    setInterviewStatus("draft");
  }

  function handleChangeRespondent(e) {
    const { name, value } = e.target;
    setRespondentInfo((s) => {
      const updated = { ...s, [name]: value };
      autoSave(answers, updated);
      return updated;
    });
  }

  function handleChangeAnswer(qid, value) {
    setAnswers((prev) => {
      const updated = { ...prev, [qid]: value };
      autoSave(updated, respondentInfo);
      return updated;
    });
  }

  function handleToggleMultiple(qid, choice) {
    setAnswers((prev) => {
      const arr = Array.isArray(prev[qid]) ? [...prev[qid]] : [];
      const key = String(choice);
      const idx = arr.findIndex((x) => String(x) === key);
      if (idx === -1) arr.push(key);
      else arr.splice(idx, 1);
      const updated = { ...prev, [qid]: arr };
      autoSave(updated, respondentInfo);
      return updated;
    });
  }

  const validateBeforeSubmit = () => {
    const hasAny = Object.values(answers).some((v) => v !== "" && v != null && !(Array.isArray(v) && v.length === 0));
    if (!hasAny) {
      alert("Veuillez renseigner au moins une réponse avant d'envoyer.");
      return false;
    }
    return true;
  };

  function resolveChoiceId(choiceKey, q) {
    if (choiceKey == null) return null;
    if (typeof choiceKey === "number") return choiceKey;
    const asNum = Number(choiceKey);
    if (!Number.isNaN(asNum)) return asNum;
    const found = (q.choices || []).find((c) => String(c.id) === String(choiceKey) || String(c.text) === String(choiceKey));
    return found ? found.id : null;
  }

  function buildInterviewPayload(status = "draft", currentAnswers = answers, currentRespondentInfo = respondentInfo) {
    if (!survey) return null;
    const answersArray = [];
    for (const q of survey.questions || []) {
      if (!isQuestionVisible(q, currentAnswers)) continue;
      const qid = q.id;
      const val = currentAnswers[qid];
      const isEmpty = (v) => v === "" || v == null || (Array.isArray(v) && v.length === 0);
      if (isEmpty(val)) continue;
      const answerItem = { question_id: qid, answer_text: "", selected_choices: [] };
      if (q.question_type === "text") {
        answerItem.answer_text = String(val);
      } else if (q.question_type === "single") {
        const idVal = resolveChoiceId(val, q);
        answerItem.selected_choices = idVal ? [idVal] : [];
      } else if (q.question_type === "multiple") {
        const arr = Array.isArray(val) ? val : [val];
        const ids = arr.map((v) => resolveChoiceId(v, q)).filter(Boolean);
        answerItem.selected_choices = ids;
      } else {
        answerItem.answer_text = String(val);
      }
      answersArray.push(answerItem);
    }
    const updated_at_local = new Date().toISOString();
    return {
      client_uuid: clientUuid,
      survey_id: Number(id),
      interviewer_name: currentRespondentInfo.interviewer_name || "",
      participant_name: currentRespondentInfo.participant_name || "",
      updated_at_local,
      device_id: "web-browser",
      app_version: "web-1.0",
      answers: answersArray,
      status,
      sync_error: null,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!survey) return;
    if (!validateBeforeSubmit()) return;

    setSubmitting(true);
    setError(null);

    // On détermine si c'est un lien public (pas de token d'accès)
    const isPublicUser = !access;

    try {
      const payload = buildInterviewPayload("pending");
      if (!payload) throw new Error("Payload invalide");

      const res = await fetch(`${API_BASE}/api/mobile/sync/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(access ? { Authorization: `Bearer ${access}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      setInterviewStatus("synced");

      // ✅ REDIRECTION INTELLIGENTE
      // On passe 'isPublic' dans le state pour que SurveyThanks sache quoi cacher
      nav(`/surveys/${id}/thanks`, { 
        state: { 
          answers: payload.answers, 
          respondent: {
            interviewer_name: payload.interviewer_name || (isPublicUser ? "Réponse en ligne" : ""),
            participant_name: payload.participant_name
          },
          isPublic: isPublicUser // <--- Le drapeau magique est ici
        } 
      });

    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'envoi des réponses");
      setInterviewStatus("error");
    } finally {
      setSubmitting(false);
    }
  }


  if (loading) return <div className="container py-8">Chargement...</div>;
  if (!survey) return <div className="container py-8 section-card">Enquête introuvable.</div>;

  const { answered, total, percent } = computeProgress(survey, answers);
  const visibleQuestions = (survey.questions || []).filter((q) => isQuestionVisible(q, answers));
  const cover = getSurveyCover(survey);

  return (
    <div className="container py-8">
      <div className="mb-4">
        <button type="button" onClick={() => nav(-1)} className="px-3 py-1 text-sm rounded border border-slate-200 text-slate-700 hover:bg-slate-50">← Retour</button>
      </div>

      <div className="mb-6 flex items-start gap-4">
        {cover && <img src={cover} alt="" className="w-20 h-20 rounded-xl object-cover hidden sm:block" />}
        <div>
          <h1 className="text-2xl font-bold">{survey.title}</h1>
          <div className="text-sm text-muted">{survey.description}</div>
        </div>
      </div>

      <div className="section-card p-4 mb-6">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span>Progression du questionnaire</span>
          <span>{answered}/{total} questions complétées ({percent}%)</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-2 rounded-full bg-[var(--brand,#4f46e5)] transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="section-card p-4">
          <div className="text-sm text-muted mb-2">Infos enquêteur</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input name="interviewer_name" value={respondentInfo.interviewer_name} onChange={handleChangeRespondent} placeholder="Nom enquêteur / Collecteur" className="px-3 py-2 border rounded w-full" />
            <input name="participant_name" value={respondentInfo.participant_name} onChange={handleChangeRespondent} placeholder="Nom du participant (si applicable)" className="px-3 py-2 border rounded w-full" />
          </div>
        </div>

        {visibleQuestions.map((q) => (
          <div key={q.id} className="section-card p-4">
            <div className="mb-3">
              <div className="font-semibold">{q.text}</div>
              <div className="text-xs text-muted">Type: {q.question_type}</div>
            </div>

            {q.question_type === "text" && (
              <textarea value={answers[q.id] || ""} onChange={(e) => handleChangeAnswer(q.id, e.target.value)} className="w-full p-2 border rounded" rows={3} />
            )}

            {q.question_type === "number" && (
              <input type="number" value={answers[q.id] ?? ""} onChange={(e) => handleChangeAnswer(q.id, e.target.value === "" ? "" : Number(e.target.value))} className="w-full p-2 border rounded" placeholder="Entrez une valeur numérique" />
            )}

            {q.question_type === "single" && (
              <div className="space-y-2">
                {(q.choices || []).map((c) => {
                  const choiceKey = c.id ?? c.text;
                  return (
                    <label key={choiceKey} className="flex items-center gap-2">
                      <input type="radio" name={`q-${q.id}`} value={choiceKey} checked={String(answers[q.id]) === String(choiceKey)} onChange={() => handleChangeAnswer(q.id, choiceKey)} />
                      <span>{c.text}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {q.question_type === "multiple" && (
              <div className="space-y-2">
                {(q.choices || []).map((c) => {
                  const choiceKey = c.id ?? c.text;
                  const checked = Array.isArray(answers[q.id]) && answers[q.id].some((x) => String(x) === String(choiceKey));
                  return (
                    <label key={choiceKey} className="flex items-center gap-2">
                      <input type="checkbox" checked={checked} onChange={() => handleToggleMultiple(q.id, choiceKey)} />
                      <span>{c.text}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting} className="btn-primary px-4 py-2">{submitting ? "Envoi..." : "Envoyer les réponses"}</button>
          <button type="button" className="btn-outline px-4 py-2" onClick={() => nav(-1)}>Annuler</button>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
          <span className={"inline-flex items-center px-3 py-1 rounded-full border " + (interviewStatus === "pending" ? "border-amber-400 text-amber-500 bg-amber-50" : interviewStatus === "synced" ? "border-emerald-500 text-emerald-600 bg-emerald-50" : interviewStatus === "error" ? "border-red-500 text-red-600 bg-red-50" : "border-slate-300 text-slate-500 bg-slate-50")}>
            {interviewStatus === "pending" ? "En attente de synchronisation" : interviewStatus === "synced" ? "Synchronisé" : interviewStatus === "error" ? "Erreur de synchronisation" : "Brouillon (enregistré en local)"}
          </span>
          <span className="text-muted">Les réponses sont sauvegardées sur cet appareil et synchronisées automatiquement dès que le réseau est disponible.</span>
        </div>

        {error && <div className="text-red-600 text-sm">{String(error)}</div>}
      </form>
    </div>
  );
}
