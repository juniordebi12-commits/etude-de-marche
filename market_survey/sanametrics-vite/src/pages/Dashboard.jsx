// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../api/useAuth";
import { fetchDashboardSummary } from "../api/useDashboard";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import DashboardCharts from "../components/DashboardCharts";
import TopSurveysList from "../components/TopSurveysList";

/**
 * Dashboard simple et élégant :
 * - affiche total enquêtes / réponses
 * - liste top surveys
 * - petite "bar chart" CSS pour visualiser les top 5
 *
 * Remarque : seul le layout a été ajusté pour élargir la zone "Tendances récentes".
 */

export default function Dashboard() {
  const { access } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalSurveys: 0,
    totalResponses: 0,
    surveys: []
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchDashboardSummary(access);
        if (!mounted) return;
        setSummary({
          totalSurveys: res.totalSurveys,
          totalResponses: res.totalResponses,
          surveys: res.surveys || []
        });
      } catch (e) {
        console.error("Dashboard error", e);
        if (mounted) setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [access]);

  const top = summary.surveys.slice(0,5);
  const maxResp = Math.max(1, ...top.map(s => s.responses));

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-1">Dashboard</h1>
          <p className="text-sm text-muted">Vue d'ensemble — enquêtes, réponses et tendances</p>
        </div>
        <div className="flex gap-3">
          <Link to="/editor" className="btn-primary">Créer une enquête</Link>
          <Link to="/surveys" className="btn-outline">Voir toutes</Link>
        </div>
      </div>

      {loading ? (
        <div className="section-card">Chargement...</div>
      ) : error ? (
        <div className="section-card text-red-600">Erreur : {error.message || "Impossible de charger"}</div>
      ) : (
        /* === Changement minimal : grille 4 colonnes et left area span 3 === */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Stat cards + charts (plus large maintenant) */}
          <div className="lg:col-span-3 space-y-6">
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-4">
              <div className="section-card p-6">
                <div className="text-sm text-muted">Enquêtes</div>
                <div className="text-3xl font-bold mt-2">{summary.totalSurveys}</div>
                <div className="text-xs text-muted mt-2">Total des enquêtes créées</div>
              </div>
              <div className="section-card p-6">
                <div className="text-sm text-muted">Réponses</div>
                <div className="text-3xl font-bold mt-2">{summary.totalResponses}</div>
                <div className="text-xs text-muted mt-2">Total des réponses reçues</div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Top enquêtes (par réponses)</h3>
                <div className="text-xs text-muted">Top 5</div>
              </div>

              {/* TopSurveysList reste inchangé */}
              <TopSurveysList surveys={top} maxResp={maxResp} />
            </motion.div>

            {/* Tendances récentes (plus large, charts ont plus d'espace) */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section-card p-6">
              <h3 className="font-semibold mb-3">Tendances récentes</h3>
              <DashboardCharts topSurveys={summary.surveys.slice(0,5)} />
            </motion.div>
          </div>

          {/* Right: recent surveys + actions (sidebar, inchangé) */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="section-card p-4">
              <h4 className="font-semibold mb-3">Dernières enquêtes</h4>
              <div className="space-y-3">
                {summary.surveys.slice(0,6).map(s => (
                  <div key={s.id} className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{s.title}</div>
                      <div className="text-xs text-muted">{s.description ? s.description.substring(0,70) : ""}</div>
                    </div>
                    <div className="text-xs text-muted">{s.responses}</div>
                  </div>
                ))}
                {summary.surveys.length === 0 && <div className="text-sm text-muted">Aucune enquête créée</div>}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="section-card p-4">
              <h4 className="font-semibold mb-3">Actions rapides</h4>
              <div className="flex flex-col gap-2">
                <Link to="/editor" className="btn-primary text-center">Créer une enquête</Link>
                <Link to="/surveys" className="btn-outline text-center">Gérer mes enquêtes</Link>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
