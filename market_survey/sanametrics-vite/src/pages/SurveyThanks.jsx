import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Confetti from "react-confetti";
import { useAuth } from "../api/useAuth";
import { getSurvey } from "../api/useDashboard";

function answerLabel(answer) {
  if (answer?.answer_text) return answer.answer_text;

  if (Array.isArray(answer?.selected_choices)) {
    return answer.selected_choices
      .map((choice) => {
        if (typeof choice === "string") return choice;
        return choice?.text || choice?.label || choice?.value || "";
      })
      .filter(Boolean)
      .join(", ");
  }

  return answer?.selected_choices || "—";
}

export default function SurveyThanks() {
  const { id } = useParams();
  const { access } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [surveyTitle, setSurveyTitle] = useState("");
  const [loadingTitle, setLoadingTitle] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  const receiptRef = useRef(null);
  const receiptNumber = useRef(
    `S-${id}-${Date.now().toString().slice(-5)}`
  );

  const passedAnswers = location.state?.answers || [];
  const passedRespondent = location.state?.respondent || null;

  const isOnlineResponse =
    !access || passedRespondent?.interviewer_name === "Réponse en ligne";

  useEffect(() => {
    let mounted = true;

    async function loadSurveyTitle() {
      if (!id) return;

      setLoadingTitle(true);

      try {
        const survey = await getSurvey(access, id);

        if (mounted) {
          setSurveyTitle(survey?.title || "");
        }
      } catch {
        if (mounted) {
          setSurveyTitle("");
        }
      } finally {
        if (mounted) {
          setLoadingTitle(false);
        }
      }
    }

    loadSurveyTitle();

    return () => {
      mounted = false;
    };
  }, [id, access]);

  async function downloadReceiptPdf() {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const margin = 32;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const printableWidth = pageWidth - margin * 2;
      const printableHeight = pageHeight - margin * 2;

      const imageHeight = (canvas.height * printableWidth) / canvas.width;

      let remainingHeight = imageHeight;
      let imageY = margin;

      pdf.addImage(
        imageData,
        "PNG",
        margin,
        imageY,
        printableWidth,
        imageHeight
      );

      remainingHeight -= printableHeight;

      while (remainingHeight > 0) {
        pdf.addPage();

        imageY = margin - (imageHeight - remainingHeight);

        pdf.addImage(
          imageData,
          "PNG",
          margin,
          imageY,
          printableWidth,
          imageHeight
        );

        remainingHeight -= printableHeight;
      }

      pdf.save(`confirmation_sanametrics_${id}.pdf`);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF :", error);
      alert("Impossible de générer le récapitulatif PDF.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] py-8 md:py-12">
      {showConfetti && (
        <Confetti
          recycle={false}
          numberOfPieces={130}
          onConfettiComplete={() => setShowConfetti(false)}
        />
      )}

      <div className="container max-w-3xl">
        <section
          ref={receiptRef}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="h-1.5 bg-blue-600" />

          <div className="p-5 md:p-8">
            <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-xl">
                  ✓
                </div>

                <h1 className="text-2xl font-extrabold text-slate-950 md:text-3xl">
                  {isOnlineResponse
                    ? "Merci pour votre participation !"
                    : "Réponse enregistrée avec succès !"}
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {loadingTitle
                    ? "Enregistrement de votre réponse…"
                    : surveyTitle
                      ? `Votre réponse a été ajoutée à l’enquête « ${surveyTitle} ».`
                      : "Votre réponse a bien été enregistrée."}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3 text-left sm:text-right">
                <p className="text-xs font-medium text-slate-500">
                  Référence
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-slate-800">
                  {receiptNumber.current}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {new Date().toLocaleString("fr-FR")}
                </p>
              </div>
            </div>

            {passedRespondent?.participant_name && (
              <div className="mt-5 rounded-xl bg-blue-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Participant
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {passedRespondent.participant_name}
                </p>
              </div>
            )}

            <div className="mt-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-bold text-slate-900">
                  Récapitulatif de vos réponses
                </h2>

                {passedAnswers.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {passedAnswers.length} réponse
                    {passedAnswers.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {passedAnswers.length > 0 ? (
                <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
                  {passedAnswers.map((answer, index) => (
                    <div key={index} className="px-4 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {answer.question_text ||
                          answer.question ||
                          `Question ${index + 1}`}
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {answerLabel(answer)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Le récapitulatif détaillé n’est plus disponible après
                  actualisation de cette page.
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={downloadReceiptPdf}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Télécharger mon récapitulatif PDF
          </button>

          {access ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                to={`/surveys/${id}/take`}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-50"
              >
                Nouvelle saisie
              </Link>

              <button
                type="button"
                onClick={() => nav(`/dashboard/survey/${id}`)}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Voir les résultats
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => nav("/")}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Terminer
              </button>

              <Link
                to={`/surveys/${id}/take`}
                className="text-on-brand rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold no-underline transition hover:bg-blue-700"
              >
                Répondre à nouveau
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}