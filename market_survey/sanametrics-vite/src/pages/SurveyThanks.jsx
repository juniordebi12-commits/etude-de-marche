// src/pages/SurveyThanks.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../api/useAuth";
import { getSurvey } from "../api/useDashboard";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Confetti from "react-confetti";

export default function SurveyThanks() {
  const { id } = useParams();
  const { access } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [surveyTitle, setSurveyTitle] = useState("");
  const [loadingTitle, setLoadingTitle] = useState(false);

  // confetti toggle
  const [showConfetti, setShowConfetti] = useState(true);

  // redirect timer
  const [countdown, setCountdown] = useState(30); // seconds before redirect
  const [autoRedirectEnabled, setAutoRedirectEnabled] = useState(true);

  // element ref à capturer pour PNG/PDF
  const receiptRef = useRef(null);

  // answers/respondent passés via navigate state (SurveyTake envoie via nav(..., { state: { answers, respondent } }))
  const passedAnswers = (location.state && location.state.answers) || null;
  const passedRespondent = (location.state && location.state.respondent) || null;

  useEffect(() => {
    let mounted = true;
    if (!surveyTitle && id) {
      setLoadingTitle(true);
      getSurvey(access, id)
        .then((sv) => {
          if (!mounted) return;
          setSurveyTitle(sv?.title || "");
        })
        .catch(() => {})
        .finally(() => mounted && setLoadingTitle(false));
    }
    return () => { mounted = false; };
  }, [id, access, surveyTitle]);

  // countdown effect for redirect
  useEffect(() => {
    if (!autoRedirectEnabled) return;
    if (countdown <= 0) {
      nav("/dashboard");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, autoRedirectEnabled, nav]);

  // small helpers
  const downloadBlob = (filename, blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const payload = {
      survey_id: id,
      survey_title: surveyTitle || null,
      respondent: passedRespondent || null,
      answers: passedAnswers || [],
      submitted_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    downloadBlob(`receipt_survey_${id}.json`, blob);
  };

  const handleDownloadCsv = () => {
    if (!Array.isArray(passedAnswers) || passedAnswers.length === 0) {
      alert("Aucune réponse disponible à exporter.");
      return;
    }
    // build CSV rows
    const keys = ["index", "question", "answer_text", "selected_choices"];
    const rows = passedAnswers.map((a, i) => {
      return keys.map((k) => {
        if (k === "index") return i + 1;
        if (k === "selected_choices") {
          return Array.isArray(a.selected_choices) ? a.selected_choices.join("|") : (a.selected_choices || "");
        }
        return a[k] ?? (k === "question" ? (a.question_text || a.question || "") : "");
      }).map(v => `"${String(v).replace(/"/g,'""')}"`).join(",");
    });
    const csv = `${keys.join(",")}\n${rows.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(`receipt_survey_${id}.csv`, blob);
  };

  // capture receiptRef as PNG then convert to PDF (one page)
  const handleDownloadPdf = async () => {
    if (!receiptRef.current) {
      alert("Aucune zone disponible pour la capture.");
      return;
    }
    try {
      // capture with high quality
      const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // scale image to fit page while keeping aspect ratio
      const img = new Image();
      img.src = imgData;
      await new Promise((res) => (img.onload = res));

      const imgW = img.width;
      const imgH = img.height;
      const ratio = Math.min(pageWidth / imgW, pageHeight / imgH);
      const w = imgW * ratio;
      const h = imgH * ratio;
      const x = (pageWidth - w) / 2;
      const y = 20;

      pdf.addImage(imgData, "PNG", x, y, w, h);
      pdf.save(`receipt_survey_${id}.pdf`);
    } catch (e) {
      console.error("PDF generation failed", e);
      alert("Erreur génération PDF — regarde la console.");
    }
  };

  return (
    <div className="container py-10">
      {/* confetti (auto hide after a few seconds) */}
      {showConfetti && <Confetti recycle={false} numberOfPieces={160} onConfettiComplete={() => setShowConfetti(false)} />}

      <div className="section-card" ref={receiptRef} style={{ borderTop: `4px solid var(--brand)` }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">Merci !</h1>
            <p className="text-sm text-muted mt-2">
              {loadingTitle ? "Enregistrement..." : (surveyTitle ? `Vos réponses pour : ${surveyTitle}` : `Enquête #${id}`)}
            </p>

            {passedRespondent && (
              <div className="mt-3">
                <div className="text-xs text-muted">Enquêteur</div>
                <div className="font-medium">
                  {passedRespondent.interviewer_name || passedRespondent.name || "—"}
                </div>
                {passedRespondent.participant_name && <div className="text-sm text-muted">Participant: {passedRespondent.participant_name}</div>}
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="text-xs text-muted">Référence</div>
            <div className="font-mono text-sm">{`S-${id}-${Date.now().toString().slice(-5)}`}</div>
            <div className="text-xs text-muted mt-2">Soumis: {new Date().toLocaleString()}</div>
          </div>
        </div>

        {/* visual separator */}
        <div className="mt-6">
          <div className="px-3 py-2 bg-[var(--bg-page)] rounded">
            <div className="text-sm text-muted">Récapitulatif des réponses (extrait)</div>
            <div className="mt-2">
              {Array.isArray(passedAnswers) && passedAnswers.length > 0 ? (
                <div className="text-xs">
                  {passedAnswers.slice(0, 20).map((a, i) => (
                    <div key={i} className="mb-2">
                      <div className="font-medium">{a.question_text || a.question || `Question ${i+1}`}</div>
                      <div className="text-sm text-muted">{a.answer_text || (Array.isArray(a.selected_choices) ? a.selected_choices.join(", ") : a.selected_choices) || "—"}</div>
                    </div>
                  ))}
                  {passedAnswers.length > 20 && <div className="text-xs text-muted">+ {passedAnswers.length - 20} autres réponses…</div>}
                </div>
              ) : (
                <div className="text-sm text-muted">Aucune réponse passée à la page de remerciement.</div>
              )}
            </div>
          </div>
        </div>

        {/* footer actions inside the same card (will be included in PDF capture) */}
        <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleDownloadJson} className="px-3 py-2 border rounded btn-outline">Télécharger JSON</button>
            <button onClick={handleDownloadCsv} className="px-3 py-2 border rounded btn-outline">Télécharger CSV</button>
            <button onClick={handleDownloadPdf} className="px-3 py-2 border rounded btn-outline">Télécharger PDF (capture)</button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-muted">Redirection automatique vers le dashboard dans :</div>
            <div className="font-semibold">{countdown}s</div>
            <button
              onClick={() => setAutoRedirectEnabled(false)}
              className="px-3 py-1 border rounded btn-outline"
              title="Annuler la redirection automatique"
            >
              Annuler
            </button>
            <Link to={`/surveys/${id}/take`}className="px-3 py-1 btn-outline">Continuer</Link>
            <button onClick={() => nav(`/dashboard/survey/${id}`)} className="px-3 py-1 btn-primary">Voir les résultats</button>
          </div>
        </div>
      </div>

      {/* additional note below card (not included in capture) */}
      <div className="mt-4 text-xs text-muted">
        <strong>Note :</strong> la génération de PDF se fait à la demande. Si tu veux générer des PDF en masse (ex. centaines),
        fais-le côté serveur pour éviter des charges client lourdes.
      </div>

      <div className="mt-6 text-sm">
        Si tu veux une version plus brandée (logo, couleurs supplémentaires, envoi d’email automatique ou PDF custom),
        je te prépare le template et le workflow (ex : envoi via API backend) — dis-moi ce que tu préfères et j’implémente demain.
      </div>
    </div>
  );
}
