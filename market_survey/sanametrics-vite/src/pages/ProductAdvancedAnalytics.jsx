import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { API_BASE } from "../api/useApi";
import { useAuth } from "../api/useAuth";
import { listSurveys } from "../api/useDashboard";
import { consumeCredits } from "../api/useBilling";

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function safeFilename(value) {
  return String(value || "analyse")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

const importanceStyles = {
  high: "border-rose-500/40 bg-rose-500/10 text-rose-100",
  medium: "border-amber-400/40 bg-amber-400/10 text-amber-100",
  low: "border-cyan-400/40 bg-cyan-400/10 text-cyan-100",
};

const importanceLabels = {
  high: "Prioritaire",
  medium: "À surveiller",
  low: "Information",
};

export default function ProductAdvancedAnalytics() {
  const { access, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [surveys, setSurveys] = useState([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([]);
const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSurveys() {
      if (!access) {
        if (active) {
          setLoading(false);
          setError("Connectez-vous pour choisir une enquête.");
        }
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await listSurveys(access);
        const items = normalizeList(data);

        if (!active) return;

        setSurveys(items);

        if (items.length > 0) {
          setSelectedSurveyId(String(items[0].id));
        }
      } catch {
        if (active) {
          setError(
            "Impossible de charger vos enquêtes. Vérifiez votre connexion."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSurveys();

    return () => {
      active = false;
    };
  }, [access]);
  useEffect(() => {
  let active = true;

  async function loadAnalysisHistory() {
    if (!access || !selectedSurveyId) {
      if (active) setAnalysisHistory([]);
      return;
    }

    setHistoryLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/openai/analyses/?survey_id=${selectedSurveyId}`,
        {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error("Impossible de charger l’historique.");
      }

      if (active) {
        setAnalysisHistory(data.analyses || []);
      }
    } catch {
      if (active) {
        setAnalysisHistory([]);
      }
    } finally {
      if (active) {
        setHistoryLoading(false);
      }
    }
  }

  loadAnalysisHistory();

  return () => {
    active = false;
  };
}, [access, selectedSurveyId]);

  const selectedSurvey = useMemo(
    () =>
      surveys.find((survey) => String(survey.id) === String(selectedSurveyId)),
    [surveys, selectedSurveyId]
  );

  const findings = Array.isArray(analysis?.analysis?.key_findings)
    ? analysis.analysis.key_findings
    : [];

  const recommendations = Array.isArray(analysis?.analysis?.recommendations)
    ? analysis.analysis.recommendations
    : [];

  const limitations = Array.isArray(analysis?.analysis?.data_limitations)
    ? analysis.analysis.data_limitations
    : [];

  function selectSurvey(surveyId) {
    setSelectedSurveyId(String(surveyId));
    setAnalysis(null);
    setAnalysisError("");
  }

  function openSurveyAnalysis() {
    if (!selectedSurvey) return;
    navigate(`/dashboard/survey/${selectedSurvey.id}`);
  }

  function openSavedAnalysis(savedAnalysis) {
  setAnalysis({
    ...savedAnalysis,
    analysis_id: savedAnalysis.id,
  });

  setAnalysisError("");
}

  async function launchAiAnalysis() {
    if (!selectedSurvey || !access) return;

    setIsAnalyzing(true);
    setAnalysisError("");
    setAnalysis(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/openai/analyze/${selectedSurvey.id}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            "Impossible de générer l’analyse IA pour cette enquête."
        );
      }

      setAnalysis(data);

setAnalysisHistory((previous) => [
  {
    ...data,
    id: data.analysis_id,
  },
  ...previous.filter((item) => item.id !== data.analysis_id),
]);
    } catch (err) {
      setAnalysisError(
        err.message || "Une erreur est survenue pendant l’analyse."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function prepareAnalysisExport(format) {
    const label = format === "excel" ? "Excel" : "PDF";

    if (!window.confirm(`Télécharger ce rapport ${label} coûtera 5 crédits. Continuer ?`)) {
      return false;
    }

    try {
      await consumeCredits(access, `export_${format}`, {
        survey_id: analysis?.survey?.id || selectedSurvey?.id,
        source: "ai_analysis",
      });
      return true;
    } catch (exportError) {
      alert(exportError.message || "Impossible de préparer cet export.");
      return false;
    }
  }

  async function downloadAnalysisPdf() {
    if (!analysis) return;

    if (!(await prepareAnalysisExport("pdf"))) return;

    const surveyTitle =
      analysis.survey?.title || selectedSurvey?.title || "Analyse SanaMetrics";
    const pdf = new jsPDF({ unit: "pt", format: "a4" });

    const margin = 44;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    let y = 54;

    const ensureSpace = (height) => {
      if (y + height > pageHeight - 48) {
        pdf.addPage();
        y = 54;
      }
    };

    const addTitle = (text) => {
      ensureSpace(32);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(17);
      pdf.setTextColor(15, 23, 42);
      pdf.text(text, margin, y);
      y += 28;
    };

    const addParagraph = (text, size = 10.5, color = [51, 65, 85]) => {
      const lines = pdf.splitTextToSize(String(text || ""), contentWidth);
      const lineHeight = size + 5;
      ensureSpace(lines.length * lineHeight + 10);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(size);
      pdf.setTextColor(...color);
      pdf.text(lines, margin, y);
      y += lines.length * lineHeight + 10;
    };

    const addBullet = (text) => {
      const lines = pdf.splitTextToSize(String(text || ""), contentWidth - 18);
      const lineHeight = 15;
      ensureSpace(lines.length * lineHeight + 8);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10.5);
      pdf.setTextColor(51, 65, 85);
      pdf.text("•", margin, y);
      pdf.text(lines, margin + 14, y);
      y += lines.length * lineHeight + 8;
    };

    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 118, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(255, 255, 255);
    pdf.text("SanaMetrics", margin, 54);
    pdf.setFontSize(14);
    pdf.text("Rapport d’analyse assistée par IA", margin, 80);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(203, 213, 225);
    pdf.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, margin, 100);

    y = 152;

    addTitle(surveyTitle);

    addParagraph(
      `Données analysées : ${analysis.summary?.respondent_count || 0} répondant(s), `
        + `${analysis.summary?.answer_count || 0} réponse(s), `
        + `${analysis.summary?.question_count || 0} question(s).`
    );

    addTitle("Synthèse exécutive");
    addParagraph(analysis.analysis?.executive_summary || "Aucune synthèse disponible.");

    if (findings.length > 0) {
      addTitle("Principaux constats");

      findings.forEach((finding, index) => {
        addParagraph(
          `${index + 1}. ${finding?.title || "Constat"} — `
            + `${importanceLabels[finding?.importance] || "Information"}`,
          11,
          [15, 23, 42]
        );
        addParagraph(finding?.detail || "");
      });
    }

    if (recommendations.length > 0) {
      addTitle("Recommandations");
      recommendations.forEach(addBullet);
    }

    if (limitations.length > 0) {
      addTitle("Limites de lecture");
      limitations.forEach(addBullet);
    }

    addParagraph(
      "Ce rapport a été généré à partir de statistiques anonymisées. "
        + "Il doit être interprété avec prudence selon la taille de l’échantillon.",
      9,
      [100, 116, 139]
    );

    pdf.save(`analyse_ia_${safeFilename(surveyTitle)}.pdf`);
  }

  async function downloadAnalysisExcel() {
    if (!analysis) return;

    if (!(await prepareAnalysisExport("excel"))) return;

    const surveyTitle =
      analysis.survey?.title || selectedSurvey?.title || "Analyse SanaMetrics";

    const workbook = XLSX.utils.book_new();

    const summaryRows = [
      ["Rapport SanaMetrics", "Analyse assistée par IA"],
      ["Enquête", surveyTitle],
      ["Date de génération", new Date().toLocaleString("fr-FR")],
      ["Répondants analysés", analysis.summary?.respondent_count || 0],
      ["Réponses analysées", analysis.summary?.answer_count || 0],
      ["Questions analysées", analysis.summary?.question_count || 0],
      ["Crédits utilisés", analysis.credits_used || 0],
      [],
      ["Synthèse exécutive", analysis.analysis?.executive_summary || ""],
    ];

    const findingsRows = [
      ["Niveau", "Constat", "Détail"],
      ...findings.map((finding) => [
        importanceLabels[finding?.importance] || "Information",
        finding?.title || "",
        finding?.detail || "",
      ]),
    ];

    const recommendationsRows = [
      ["N°", "Recommandation"],
      ...recommendations.map((recommendation, index) => [
        index + 1,
        recommendation,
      ]),
    ];

    const limitationsRows = [
      ["N°", "Limite de lecture"],
      ...limitations.map((limitation, index) => [index + 1, limitation]),
    ];

    const statisticsRows = [
      [
        "Question",
        "Type",
        "Nombre de réponses",
        "Répartition des choix",
        "Moyenne",
        "Minimum",
        "Maximum",
        "Réponses ouvertes",
      ],
      ...(analysis.summary?.questions || []).map((question) => [
        question.question || "",
        question.type || "",
        question.answer_count || 0,
        Object.entries(question.choice_distribution || {})
          .map(([choice, count]) => `${choice}: ${count}`)
          .join(" | "),
        question.numeric_summary?.average ?? "",
        question.numeric_summary?.minimum ?? "",
        question.numeric_summary?.maximum ?? "",
        question.open_response_count ?? "",
      ]),
    ];

    const addSheet = (rows, name, widths) => {
      const sheet = XLSX.utils.aoa_to_sheet(rows);
      sheet["!cols"] = widths.map((width) => ({ wch: width }));
      XLSX.utils.book_append_sheet(workbook, sheet, name);
    };

    addSheet(summaryRows, "Synthèse", [28, 95]);
    addSheet(findingsRows, "Constats", [18, 36, 85]);
    addSheet(recommendationsRows, "Recommandations", [8, 100]);
    addSheet(limitationsRows, "Limites", [8, 100]);
    addSheet(statisticsRows, "Statistiques", [48, 16, 18, 45, 12, 12, 12, 18]);

    XLSX.writeFile(workbook, `analyse_ia_${safeFilename(surveyTitle)}.xlsx`);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-slate-800">
        <div className="container py-12 md:py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              Analyse des enquêtes
            </p>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
              Transformez vos réponses en décisions claires.
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Choisissez une enquête, consultez ses résultats et obtenez une
              synthèse assistée par l’intelligence artificielle.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-10 md:py-14">
        {!isAuthenticated && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
            <h2 className="font-bold text-amber-100">Connexion requise</h2>
            <p className="mt-2 text-sm text-amber-50/80">
              Connectez-vous pour accéder à vos enquêtes et à leurs analyses.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-flex rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
            >
              Se connecter
            </Link>
          </div>
        )}

        {isAuthenticated && (
          <>
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                      Étape 1
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-white">
                      Choisissez une enquête
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Sélectionnez l’enquête dont vous souhaitez comprendre les
                      résultats.
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                    {surveys.length} enquête{surveys.length > 1 ? "s" : ""}
                  </span>
                </div>

                {loading && (
                  <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-5 text-sm text-slate-400">
                    Chargement de vos enquêtes…
                  </div>
                )}

                {error && !loading && (
                  <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-sm text-red-100">
                    {error}
                  </div>
                )}

                {!loading && !error && surveys.length === 0 && (
                  <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                    <h3 className="font-semibold text-white">
                      Aucune enquête disponible
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Créez votre première enquête avant de lancer une analyse.
                    </p>
                    <Link
                      to="/editor"
                      className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
                    >
                      Créer une enquête
                    </Link>
                  </div>
                )}

                {!loading && surveys.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {surveys.map((survey) => {
                      const isSelected =
                        String(survey.id) === String(selectedSurveyId);

                      return (
                        <button
                          key={survey.id}
                          type="button"
                          onClick={() => selectSurvey(survey.id)}
                          className={`w-full rounded-2xl border p-4 text-left transition ${
                            isSelected
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-slate-800 bg-slate-950/40 hover:border-slate-600"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-white">
                                {survey.title || `Enquête #${survey.id}`}
                              </p>

                              {survey.description && (
                                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-400">
                                  {survey.description}
                                </p>
                              )}
                            </div>

                            {isSelected && (
                              <span className="shrink-0 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-bold text-white">
                                Sélectionnée
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <aside className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Étape 2
                </p>

                <h2 className="mt-2 text-2xl font-extrabold text-white">
                  {selectedSurvey
                    ? selectedSurvey.title || `Enquête #${selectedSurvey.id}`
                    : "Sélectionnez une enquête"}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {selectedSurvey?.description ||
                    "Les graphiques et résultats de cette enquête seront utilisés pour produire l’analyse."}
                </p>

                <div className="mt-7 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                  <div>
                    <p className="font-semibold text-cyan-300">
                      Analyse détaillée
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Consultez les graphiques, répartitions et réponses par
                      question.
                    </p>
                  </div>

                  <div className="border-t border-slate-800 pt-4">
                    <p className="font-semibold text-cyan-300">
                      Analyse assistée par IA
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Une synthèse, des constats et recommandations sont générés
                      à partir de statistiques anonymisées.
                    </p>
                  </div>
                </div>

                {analysisError && (
                  <div className="mt-5 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
                    {analysisError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={launchAiAnalysis}
                  disabled={!selectedSurvey || isAnalyzing}
                  className="mt-7 w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAnalyzing
                    ? "Analyse en cours…"
                    : "Lancer l’analyse IA · 8 crédits"}
                </button>

                <button
                  type="button"
                  onClick={openSurveyAnalysis}
                  disabled={!selectedSurvey}
                  className="mt-3 w-full rounded-xl border border-blue-500/60 px-5 py-3 text-sm font-bold text-blue-300 transition hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Voir les graphiques détaillés
                </button>
                <div className="mt-4">
  <Link
    to="/ai-chat"
    className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-slate-700 hover:text-cyan-100"
  >
    <span>✦</span>
    Nouvelle enquête avec l’IA
  </Link>
</div>
              </aside>
            </div>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl md:p-7">
  <div className="flex flex-col gap-2 border-b border-slate-800 pb-5">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
      Historique
    </p>

    <h2 className="text-xl font-extrabold text-white">
      Analyses précédentes
    </h2>

    <p className="text-sm leading-6 text-slate-400">
      Retrouvez les analyses déjà générées pour cette enquête, sans utiliser
      de nouveaux crédits.
    </p>
  </div>

  {historyLoading && (
    <p className="mt-5 text-sm text-slate-400">
      Chargement de l’historique…
    </p>
  )}

  {!historyLoading && analysisHistory.length === 0 && (
    <p className="mt-5 text-sm text-slate-400">
      Aucune analyse sauvegardée pour cette enquête.
    </p>
  )}

  {!historyLoading && analysisHistory.length > 0 && (
    <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {analysisHistory.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => openSavedAnalysis(item)}
          className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-left transition hover:border-cyan-400/60 hover:bg-slate-800"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Analyse du{" "}
            {new Date(item.created_at).toLocaleDateString("fr-FR")}
          </p>

          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">
            {item.analysis?.executive_summary ||
              "Synthèse enregistrée. Cliquez pour la consulter."}
          </p>

          <p className="mt-3 text-xs font-semibold text-blue-300">
            Ouvrir l’analyse →
          </p>
        </button>
      ))}
    </div>
  )}
</section>

            {analysis && (
              <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl md:p-8">
                <div className="flex flex-col gap-4 border-b border-slate-800 pb-6 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                      Résultat de l’analyse IA
                    </p>
                    <h2 className="mt-2 text-2xl font-extrabold text-white">
                      {analysis.survey?.title || selectedSurvey?.title}
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={downloadAnalysisExcel}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500"
                    >
                      Télécharger Excel · 5 crédits
                    </button>

                    <button
                      type="button"
                      onClick={downloadAnalysisPdf}
                      className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-500"
                    >
                      Télécharger PDF · 5 crédits
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">
                  <span>
                    {analysis.summary?.respondent_count || 0} répondant(s)
                  </span>
                  <span>•</span>
                  <span>{analysis.summary?.answer_count || 0} réponse(s)</span>
                  <span>•</span>
                  <span>
                    {analysis.credits_used || 0} crédit
                    {analysis.credits_used > 1 ? "s" : ""} utilisé
                    {analysis.credits_used > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                  <h3 className="font-semibold text-cyan-300">
                    Synthèse exécutive
                  </h3>
                  <p className="mt-3 leading-7 text-slate-200">
                    {analysis.analysis?.executive_summary}
                  </p>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-bold text-white">
                    Principaux constats
                  </h3>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {findings.map((finding, index) => {
                      const level = String(
                        finding?.importance || "low"
                      ).toLowerCase();

                      return (
                        <article
                          key={`${finding?.title || "constat"}-${index}`}
                          className={`rounded-2xl border p-5 ${
                            importanceStyles[level] || importanceStyles.low
                          }`}
                        >
                          <p className="text-xs font-bold uppercase tracking-wide">
                            {importanceLabels[level] || "Information"}
                          </p>
                          <h4 className="mt-2 font-bold">
                            {finding?.title || "Constat"}
                          </h4>
                          <p className="mt-2 text-sm leading-6 opacity-90">
                            {finding?.detail}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                </div>

                {recommendations.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-white">
                      Recommandations
                    </h3>

                    <ol className="mt-4 space-y-3">
                      {recommendations.map((recommendation, index) => (
                        <li
                          key={`${recommendation}-${index}`}
                          className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm leading-6 text-slate-200"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                            {index + 1}
                          </span>
                          {recommendation}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {limitations.length > 0 && (
                  <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-950/50 p-5">
                    <h3 className="font-semibold text-slate-200">
                      Limites de lecture
                    </h3>

                    <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-6 text-slate-400">
                      {limitations.map((limitation, index) => (
                        <li key={`${limitation}-${index}`}>{limitation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}
