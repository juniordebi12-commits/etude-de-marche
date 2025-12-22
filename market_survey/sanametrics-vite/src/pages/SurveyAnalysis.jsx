// src/pages/SurveyAnalysis.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../api/useAuth";
import { fetchSurveyAnalysis } from "../api/useDashboard";
import SurveyCharts from "../components/SurveyCharts";

export default function SurveyAnalysis() {
  // route param /dashboard/survey/:id
  const { id } = useParams();
  const { access } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchSurveyAnalysis(access, id)
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        alert("Impossible de charger l'analyse");
        setLoading(false);
      });
  }, [id, access]);

  if (loading) return <div className="container py-8">Chargement...</div>;
  if (!data) return <div className="container py-8">Aucune donnée.</div>;

  const { survey, totalResponses, questions } = data;

  return (
    <div className="container py-8">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {survey?.title || `Enquête ${id}`}
          </h1>
          <div className="text-sm text-muted">{survey?.description}</div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => nav(-1)} className="btn-outline">
            Retour
          </button>
          <button onClick={() => nav("/dashboard")} className="btn-primary">
            Dashboard
          </button>
        </div>
      </div>

      {/* Stats globales */}
      <div className="section-card mb-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-muted">Total d'entrées (answers)</div>
            <div className="text-3xl font-extrabold">{totalResponses}</div>
          </div>
          <div>
            <div className="text-sm text-muted">Questions</div>
            <div className="text-lg font-semibold">{questions.length}</div>
          </div>
        </div>
      </div>

      {/* Visualisations uniquement */}
      <div className="section-card mb-6">
        <h3 className="font-semibold mb-3">Visualisations</h3>
        <SurveyCharts questions={questions} />
      </div>
    </div>
  );
}
