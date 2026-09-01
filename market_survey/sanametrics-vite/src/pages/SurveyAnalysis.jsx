import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { useAuth } from "../api/useAuth";
import { fetchSurveyAnalysis } from "../api/useDashboard";
import SurveyCharts from "../components/SurveyCharts";

function formatNumber(value) {
  return new Intl.NumberFormat("fr-FR").format(value ?? 0);
}

function safeFilename(value) {
  return String(value || "enquete")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function questionTypeLabel(type) {
  const labels = {
    text: "Réponse libre",
    single: "Choix unique",
    multiple: "Choix multiples",
    number: "Nombre",
  };

  return labels[type] || "Question";
}

function responseValue(response) {
  if (response.answer_text) return response.answer_text;

  const choices = response.selected_choices || [];

  if (!Array.isArray(choices) || choices.length === 0) {
    return "—";
  }

  return choices
    .map((choice) => {
      if (typeof choice === "string") return choice;
      if (typeof choice === "number") return String(choice);
      return choice?.text || choice?.label || choice?.value || "Choix";
    })
    .join(", ");
}

export default function SurveyAnalysis() {
  const { id } = useParams();
  const { access } = useAuth();
  const nav = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadAnalysis() {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const result = await fetchSurveyAnalysis(access, id);

        if (mounted) {
          setData(result);
        }
      } catch (err) {
        console.error("Erreur analyse enquête :", err);

        if (mounted) {
          setError(err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAnalysis();

    return () => {
      mounted = false;
    };
  }, [id, access]);

  const metrics = useMemo(() => {
    const questions = data?.questions ?? [];
    const responses = data?.raw?.responses ?? [];
    const respondentIds = new Set();

    responses.forEach((response) => {
      const respondentId =
        typeof response.respondent === "number"
          ? response.respondent
          : response.respondent?.id || response.respondent_id;

      if (respondentId) {
        respondentIds.add(respondentId);
      }
    });

    const respondents = respondentIds.size;
    const expectedAnswers = respondents * questions.length;

    const completionRate =
      expectedAnswers > 0
        ? Math.min(
            100,
            Math.round((responses.length / expectedAnswers) * 1000) / 10
          )
        : 0;

    const answeredQuestions = questions.filter(
      (question) => question.totalAnswers > 0
    ).length;

    return {
      respondents,
      completionRate,
      answeredQuestions,
      unansweredQuestions: Math.max(questions.length - answeredQuestions, 0),
    };
  }, [data]);

  function exportPdf() {
    if (!data) return;

    const surveyTitle = data.survey?.title || `Enquête ${id}`;
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 44;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    let y = 52;

    function ensureSpace(height) {
      if (y + height > pageHeight - 48) {
        pdf.addPage();
        y = 52;
      }
    }

    function addTitle(text, size = 17) {
      ensureSpace(34);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(size);
      pdf.setTextColor(15, 23, 42);
      pdf.text(text, margin, y);
      y += size + 14;
    }

    function addText(text, size = 10.5, color = [71, 85, 105]) {
      const lines = pdf.splitTextToSize(String(text || ""), contentWidth);
      const lineHeight = size + 5;
      ensureSpace(lines.length * lineHeight + 12);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(size);
      pdf.setTextColor(...color);
      pdf.text(lines, margin, y);
      y += lines.length * lineHeight + 12;
    }

    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 112, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(21);
    pdf.setTextColor(255, 255, 255);
    pdf.text("SanaMetrics", margin, 52);

    pdf.setFontSize(13);
    pdf.text("Rapport d’analyse d’enquête", margin, 78);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(203, 213, 225);
    pdf.text(
      `Exporté le ${new Date().toLocaleDateString("fr-FR")}`,
      margin,
      98
    );

    y = 152;

    addTitle(surveyTitle, 19);

    if (data.survey?.description) {
      addText(data.survey.description);
    }

    addTitle("Vue d’ensemble", 14);
    addText(
      `${formatNumber(data.totalResponses)} réponse(s) enregistrée(s) · ` +
        `${formatNumber(metrics.respondents)} répondant(s) · ` +
        `${metrics.completionRate}% de complétion · ` +
        `${formatNumber(data.questions.length)} question(s).`
    );

    addTitle("Résultats par question", 14);

    data.questions.forEach((question, index) => {
      addText(
        `${index + 1}. ${question.text || "Question sans libellé"}`,
        11,
        [15, 23, 42]
      );

      addText(
        `${questionTypeLabel(question.question_type)} · ` +
          `${question.totalAnswers || 0} réponse(s)`
      );

      if (question.choiceCounts?.length > 0) {
        question.choiceCounts.forEach((choice) => {
          addText(`• ${choice.text} : ${choice.count} réponse(s)`, 9.5);
        });
      }

      if (question.textAnswers?.length > 0) {
        addText(
          `${question.textAnswers.length} réponse(s) libre(s) collectée(s).`,
          9.5
        );
      }
    });

    pdf.save(`analyse_${safeFilename(surveyTitle)}.pdf`);
  }

  function exportExcel() {
    if (!data) return;

    const surveyTitle = data.survey?.title || `Enquête ${id}`;
    const workbook = XLSX.utils.book_new();

    const overviewRows = [
      ["Rapport SanaMetrics", "Analyse d’enquête"],
      ["Enquête", surveyTitle],
      ["Description", data.survey?.description || ""],
      ["Date d’export", new Date().toLocaleString("fr-FR")],
      ["Réponses enregistrées", data.totalResponses || 0],
      ["Répondants détectés", metrics.respondents],
      ["Taux de complétion", `${metrics.completionRate}%`],
      ["Questions", data.questions.length],
    ];

    const questionsRows = [
      [
        "Question",
        "Type",
        "Réponses",
        "Choix / répartition",
        "Réponses libres",
      ],
      ...data.questions.map((question) => [
        question.text || "",
        questionTypeLabel(question.question_type),
        question.totalAnswers || 0,
        (question.choiceCounts || [])
          .map((choice) => `${choice.text}: ${choice.count}`)
          .join(" | "),
        (question.textAnswers || []).join(" | "),
      ]),
    ];

    const responsesRows = [
      ["Question", "Répondant", "Réponse", "Date"],
      ...(data.raw?.responses || []).map((response) => [
        response.question?.text ||
          data.questions.find(
            (question) =>
              String(question.id) ===
              String(response.question?.id || response.question)
          )?.text ||
          "Question",
        response.respondent?.name ||
          response.respondent?.full_name ||
          response.respondent_id ||
          response.respondent ||
          "Anonyme",
        responseValue(response),
        response.created_at
          ? new Date(response.created_at).toLocaleString("fr-FR")
          : "",
      ]),
    ];

    function addSheet(rows, name, widths) {
      const sheet = XLSX.utils.aoa_to_sheet(rows);
      sheet["!cols"] = widths.map((width) => ({ wch: width }));
      XLSX.utils.book_append_sheet(workbook, sheet, name);
    }

    addSheet(overviewRows, "Synthèse", [28, 92]);
    addSheet(questionsRows, "Résultats", [48, 20, 14, 65, 80]);
    addSheet(responsesRows, "Réponses brutes", [48, 24, 70, 22]);

    XLSX.writeFile(workbook, `analyse_${safeFilename(surveyTitle)}.xlsx`);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="container py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 text-slate-600 shadow-sm">
            Chargement de l’analyse…
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="container py-10">
          <div className="rounded-2xl border border-red-200 bg-white p-7 shadow-sm">
            <h1 className="font-bold text-red-700">
              Impossible de charger l’analyse
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              {error.message || "Une erreur est survenue."}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const { survey, totalResponses = 0, questions = [] } = data;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="container py-8 md:py-10">
          <button
            type="button"
            onClick={()=>nav(-1)}
            className="text-sm font-medium text-slate-500 transition hover:text-blue-700"
          >
            ← Retour à l’enquête
          </button>

          <div className="mt-5 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Analyse de l’enquête
              </p>

              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 md:text-5xl">
                {survey?.title || `Enquête ${id}`}
              </h1>

              <p className="mt-3 text-base leading-7 text-slate-600">
                {survey?.description ||
                  "Suivez les réponses collectées et identifiez les résultats importants."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={exportExcel}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
              >
                Télécharger Excel
              </button>

              <button
                type="button"
                onClick={exportPdf}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
              >
                Télécharger PDF
              </button>

              <Link
                to={`/surveys/${id}/take`}
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white text-on-brand no-underline transition hover:bg-blue-700"
              >
                Collecter des réponses
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8 md:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
  {[
    {
      label: "Réponses",
      value: totalResponses,
      description: "Réponses enregistrées",
      color: "text-blue-700",
      background: "bg-blue-50",
    },
    {
      label: "Questions actives",
      value: metrics.answeredQuestions,
      description: `${metrics.unansweredQuestions} sans réponse`,
      color: "text-emerald-700",
      background: "bg-emerald-50",
    },
    {
      label: "Répondants",
      value: metrics.respondents,
      description: "Participants enregistrés",
      color: "text-violet-700",
      background: "bg-violet-50",
    },
    {
      label: "Complétion",
      value: `${metrics.completionRate}%`,
      description: "Réponses renseignées",
      color: "text-amber-700",
      background: "bg-amber-50",
    },
  ].map((card) => (
    <div
      key={card.label}
      className={`section-card p-5 ${card.background}`}
    >
      <div className="text-sm text-muted">{card.label}</div>

      <div className={`text-3xl font-extrabold mt-2 ${card.color}`}>
        {typeof card.value === "number"
          ? formatNumber(card.value)
          : card.value}
      </div>

      <div className="text-xs text-muted mt-2">
        {card.description}
      </div>
    </div>
  ))}
</div>

        {totalResponses === 0 ? (
          <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm md:p-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl">
              📊
            </div>

            <h2 className="mt-5 text-2xl font-extrabold text-slate-950">
              Les résultats apparaîtront ici
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">
              Ton enquête est prête. Partage-la ou commence une collecte pour
              voir les graphiques, les répartitions et les exports.
            </p>

            <Link
              to={`/surveys/${id}/take`}
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white no-underline transition hover:bg-blue-700"
            >
              Commencer la collecte
            </Link>
          </section>
        ) : (
          <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Résultats détaillés
              </p>

              <h2 className="text-2xl font-extrabold text-slate-950">
                Réponses par question
              </h2>

              <p className="text-sm leading-6 text-slate-600">
                Consulte les répartitions, les réponses libres et les données
                utiles pour prendre une décision.
              </p>
            </div>

            <div className="mt-6">
              <SurveyCharts questions={questions} />
            </div>
          </section>
        )}

        <section className="mt-7 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
              Analyse assistée
            </p>
            <h2 className="mt-2 text-xl font-extrabold">
              Besoin d’une synthèse des résultats ?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Utilise l’analyse IA pour obtenir des constats et recommandations
              à partir des réponses collectées.
            </p>
          </div>

          <Link
            to="/features/analysis"
            className="shrink-0 rounded-xl bg-cyan-400 px-5 py-3 text-center text-sm font-bold text-slate-950 no-underline transition hover:bg-cyan-300"
          >
            Ouvrir l’analyse IA
          </Link>
        </section>
      </section>
    </main>
  );
}