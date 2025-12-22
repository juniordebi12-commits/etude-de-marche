// src/pages/Surveys.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../api/useAuth";
import { listSurveys, deleteSurvey } from "../api/useDashboard";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE } from "../api/useApi";
import * as templatesStore from "../data/templatesStore";
import templatesData from "../data/TemplatesData";

// fallback images
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
  const possibleKeys = [survey?.template, survey?.template_key, survey?.slug, survey?.type].filter(Boolean).map(k => String(k).toLowerCase());
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

export default function Surveys() {
  const { access } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const nav = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    listSurveys(access)
      .then((data) => {
        if (!mounted) return;
        const items = Array.isArray(data) ? data : data.results || [];
        setSurveys(items);
      })
      .catch((err) => {
        console.error("listSurveys error", err);
        setError(err.payload || err.message || "Impossible de charger les enquêtes.");
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [access, location.key]);

  async function handleDelete(id) {
    if (!window.confirm("Supprimer cette enquête ? Cette action est irréversible.")) return;
    try {
      await deleteSurvey(access, id);
      setSurveys((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error(e);
      alert("Erreur suppression — voir console.");
    }
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">Mes enquêtes</h1>
          <p className="text-sm text-[var(--muted)]">Toutes vos enquêtes — créez, éditez et analysez.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/editor" className="btn-primary">Créer une enquête</Link>
        </div>
      </div>

      {loading && <div className="section-card">Chargement des enquêtes...</div>}
      {error && <div className="section-card text-red-600">{String(error)}</div>}

      {!loading && !error && surveys.length === 0 && (
        <div className="section-card">
          <div className="text-lg font-semibold mb-2">Aucune enquête trouvée</div>
          <div className="text-sm text-[var(--muted)]">Créez votre première enquête pour commencer à collecter des réponses.</div>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {surveys.map((s) => {
            const cover = getSurveyCover(s);
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
                className="bg-white rounded-2xl shadow-sm border overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-1 transition" onClick={() => nav(`/surveys/${s.id}`)}>
                {cover ? (
                  <div className="h-40 w-full overflow-hidden"><img src={cover} alt={s.title} className="w-full h-full object-cover" /></div>
                ) : (
                  <div className="h-40 w-full bg-gradient-to-br from-emerald-500 to-emerald-700" />
                )}

                <div className="p-4 flex flex-col h-full">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Enquête</div>
                  <h2 className="text-lg font-semibold text-slate-900 leading-snug">{s.title}</h2>
                  <p className="mt-2 text-sm text-slate-500 line-clamp-3">{s.description || "Aucune description fournie."}</p>
                  <div className="mt-3 text-xs text-slate-400">Créé : {s.created_at ? new Date(s.created_at).toLocaleString() : "-"}</div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-slate-400"></div>

                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); nav(`/surveys/${s.id}`); }} className="px-3 py-1 border rounded text-xs">Voir</button>
                      <button onClick={(e) => { e.stopPropagation(); nav(`/editor?edit=${s.id}`); }} className="px-3 py-1 text-xs rounded-md border border-[var(--input-border)] bg-[var(--card)] text-[var(--text-default)] hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm">Éditer</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="px-3 py-1 text-xs bg-red-600 text-white rounded">Suppr</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
