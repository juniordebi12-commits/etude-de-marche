import React, { useEffect, useState } from "react";
import { useAuth } from "../api/useAuth";
import { fetchDashboardSummary } from "../api/useDashboard";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import DashboardCharts from "../components/DashboardCharts";
import TopSurveysList from "../components/TopSurveysList";
import { API_BASE } from "../api/useApi";
import { consumeCredits } from "../api/useBilling";

export default function Dashboard() {
  const { access } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedSurveyId, setSelectedSurveyId] = useState("");

  const [summary, setSummary] = useState({
    totalSurveys: 0,
    totalResponses: 0,
    totalRespondents: 0,
    activeSurveys: 0,
    completionRate: 0,
    surveys: [],
    interviewerStats: [],
    dailyActivity: [],
    surveysWithoutResponses: [],
    availableSurveys: [],
  });
  function getDashboardFilters() {
  const baseFilters = {
  surveyId: selectedSurveyId,
};

  if (period === "all") {
    return baseFilters;
  }

  if (period === "custom") {
    return {
      ...baseFilters,
      from: customFrom,
      to: customTo,
    };
  }

  const days = Number(period);
  const today = new Date();
  const startDate = new Date();

  startDate.setDate(today.getDate() - (days - 1));

  const formatDate = (date) => date.toISOString().slice(0, 10);

  return {
    ...baseFilters,
    from: formatDate(startDate),
    to: formatDate(today),
  };
}
async function downloadFilteredExport(format) {
  if (!selectedSurveyId) {
    alert("Sélectionne d’abord une enquête avant de télécharger un export.");
    return;
  }

  const formatLabel = format === "excel" ? "Excel" : "PDF";
  const confirmed = window.confirm(
    `Télécharger cet export ${formatLabel} coûtera 5 crédits. Continuer ?`
  );

  if (!confirmed) return;

  const filters = getDashboardFilters();
  const params = new URLSearchParams();

  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);

  const query = params.toString() ? `?${params.toString()}` : "";

  try {
    await consumeCredits(access, `export_${format}`, {
      survey_id: selectedSurveyId,
      source: "dashboard",
    });

    const response = await fetch(
      `${API_BASE}/${selectedSurveyId}/export/${format}/${query}`,
      {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Le rapport n’a pas pu être généré.");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `sanametrics_export.${format === "excel" ? "xlsx" : "pdf"}`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert(err.message || "Impossible de télécharger le rapport.");
  }
}
  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchDashboardSummary(
  access,
  getDashboardFilters()
);

        if (!mounted) return;

        setSummary({
          totalSurveys: result.totalSurveys ?? 0,
          totalResponses: result.totalResponses ?? 0,
          totalRespondents: result.totalRespondents ?? 0,
          activeSurveys: result.activeSurveys ?? 0,
          completionRate: result.completionRate ?? 0,
          surveys: result.surveys ?? [],
          interviewerStats: result.interviewerStats ?? [],
          dailyActivity: result.dailyActivity ?? [],
          surveysWithoutResponses: result.surveysWithoutResponses ?? [],
          availableSurveys: result.availableSurveys ?? [],
        });
      } catch (err) {
        console.error("Erreur dashboard :", err);

        if (mounted) {
          setError(err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [
  access,
  period,
  customFrom,
  customTo,
  selectedSurveyId,
]);

  const topSurveys = summary.surveys.slice(0, 5);

  const maxResponses = Math.max(
    1,
    ...topSurveys.map((survey) => survey.responses ?? 0)
  );

  const maxActivity = Math.max(
    1,
    ...summary.dailyActivity.map((item) => item.respondents ?? 0)
  );

  const formatNumber = (value) =>
    new Intl.NumberFormat("fr-FR").format(value ?? 0);

  const statCards = [
    {
      label: "Enquêtes",
      value: summary.totalSurveys,
      description: "Enquêtes créées",
      color: "text-blue-700",
      background: "bg-blue-50",
    },
    {
      label: "Enquêtes actives",
      value: summary.activeSurveys,
      description: "Au moins une réponse collectée",
      color: "text-emerald-700",
      background: "bg-emerald-50",
    },
    {
      label: "Répondants",
      value: summary.totalRespondents,
      description: "Participants enregistrés",
      color: "text-violet-700",
      background: "bg-violet-50",
    },
    {
      label: "Complétion",
      value: `${summary.completionRate}%`,
      description: "Réponses renseignées",
      color: "text-amber-700",
      background: "bg-amber-50",
    },
  ];

  return (
    <div className="container py-8 md:py-10">
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
        <div className="mb-8 text-center">
  <h1 className="text-3xl font-extrabold md:text-4xl">
    Tableau de bord
  </h1>

  <div className="mt-4 flex flex-wrap justify-center gap-2">
    <Link
  to="/editor"
  className="btn-primary whitespace-nowrap !px-4 !py-2 text-sm leading-5"
>
  Créer une enquête
</Link>

<Link
  to="/surveys"
  className="btn-outline whitespace-nowrap !px-4 !py-2 text-sm leading-5"
>
  Gérer mes enquêtes
</Link>
  </div>

  <p className="mx-auto mt-5 max-w-md text-sm text-muted">
    Suivez la collecte et analysez vos résultats en un coup d’œil.
  </p>
</div>
        <div className="section-card p-4 mb-8">
  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <h2 className="font-semibold">
        Filtrer les résultats
      </h2>

      <p className="text-xs text-muted mt-1">
        Les indicateurs et graphiques seront recalculés selon cette période.
      </p>
    </div>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <select
  value={selectedSurveyId}
  onChange={(event) => setSelectedSurveyId(event.target.value)}
  className="px-3 py-2 border rounded bg-white text-sm"
>
  <option value="">Toutes les enquêtes</option>

  {summary.availableSurveys.map((survey) => (
    <option key={survey.id} value={survey.id}>
      {survey.title}
    </option>
  ))}
</select>
      <select
        value={period}
        onChange={(event) => setPeriod(event.target.value)}
        className="px-3 py-2 border rounded bg-white text-sm"
      >
        <option value="1">Aujourd’hui</option>
        <option value="7">7 derniers jours</option>
        <option value="30">30 derniers jours</option>
        <option value="90">90 derniers jours</option>
        <option value="all">Toutes les données</option>
        <option value="custom">Période personnalisée</option>
      </select>

      {period === "custom" && (
        <>
          <input
            type="date"
            value={customFrom}
            onChange={(event) => setCustomFrom(event.target.value)}
            className="px-3 py-2 border rounded bg-white text-sm"
            aria-label="Date de début"
          />

          <input
            type="date"
            value={customTo}
            onChange={(event) => setCustomTo(event.target.value)}
            className="px-3 py-2 border rounded bg-white text-sm"
            aria-label="Date de fin"
          />
        </>
      )}
    </div>
    <div className="flex flex-wrap items-center gap-3 border-t pt-4">
  <p className="mr-auto text-xs text-muted">
    Sélectionne une enquête pour exporter les données correspondant à la période.
  </p>

  <button
    type="button"
    onClick={() => downloadFilteredExport("excel")}
    disabled={!selectedSurveyId || loading}
    className="rounded px-3 py-2 text-sm font-semibold bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
    style={{ color: "#FFFFFF" }}
  >
    Télécharger Excel · 5 crédits
  </button>

  <button
    type="button"
    onClick={() => downloadFilteredExport("pdf")}
    disabled={!selectedSurveyId || loading}
    className="rounded px-3 py-2 text-sm font-semibold bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
    style={{ color: "#FFFFFF" }}
  >
    Télécharger PDF · 5 crédits
  </button>
</div>
  </div>
</div>
      </div>

      {loading ? (
        <div className="section-card p-6 text-sm text-muted">
          Chargement du tableau de bord…
        </div>
      ) : error ? (
        <div className="section-card p-6">
          <h2 className="font-semibold text-red-600 mb-2">
            Impossible de charger le dashboard
          </h2>

          <p className="text-sm text-muted mb-4">
            {error.message || "Vérifie la connexion au serveur puis réessaie."}
          </p>

          <button
            type="button"
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
          >
            {statCards.map((card) => (
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
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="section-card p-6 xl:col-span-2"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-lg">
                    Activité récente
                  </h2>

                  <p className="text-xs text-muted mt-1">
                    Nombre de répondants collectés au cours des 30 derniers jours.
                  </p>
                </div>

                <div className="text-sm font-semibold text-[var(--brand)]">
                  {formatNumber(summary.totalResponses)} réponses
                </div>
              </div>

              {summary.dailyActivity.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted">
                  Aucune activité récente. Partage une enquête pour commencer la
                  collecte.
                </div>
              ) : (
                <div className="flex items-end gap-2 h-52 overflow-x-auto pt-6">
                  {summary.dailyActivity.map((item) => {
                    const height = Math.max(
                      8,
                      ((item.respondents ?? 0) / maxActivity) * 100
                    );

                    return (
                      <div
                        key={item.date}
                        className="flex min-w-9 flex-1 flex-col items-center justify-end h-full"
                        title={`${item.date} : ${item.respondents} répondant(s)`}
                      >
                        <span className="text-xs font-semibold mb-2">
                          {item.respondents}
                        </span>

                        <div
                          className="w-full max-w-10 rounded-t-md bg-[var(--brand)] transition-all"
                          style={{ height: `${height}%` }}
                        />

                        <span className="text-[10px] text-muted mt-2 whitespace-nowrap">
                          {item.date?.slice(5) || ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="section-card p-6"
            >
              <h2 className="font-semibold text-lg mb-1">
                Alertes
              </h2>

              <p className="text-xs text-muted mb-4">
                Enquêtes qui demandent ton attention.
              </p>

              {summary.surveysWithoutResponses.length === 0 ? (
                <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
                  Toutes tes enquêtes ont déjà reçu au moins une réponse.
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.surveysWithoutResponses.map((survey) => (
                    <Link
                      key={survey.id}
                      to={`/surveys/${survey.id}`}
                      className="block rounded-lg border border-amber-200 bg-amber-50 p-3 transition hover:border-amber-400"
                    >
                      <div className="font-semibold text-sm">
                        {survey.title}
                      </div>

                      <div className="text-xs text-amber-800 mt-1">
                        Aucune réponse reçue pour le moment.
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="section-card p-6 xl:col-span-2"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-lg">
                    Enquêtes les plus actives
                  </h2>

                  <p className="text-xs text-muted mt-1">
                    Classement par nombre de réponses collectées.
                  </p>
                </div>

                <Link
                  to="/surveys"
                  className="text-sm text-[var(--brand)] font-semibold"
                >
                  Tout voir
                </Link>
              </div>

              {topSurveys.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted">
                  Crée ta première enquête pour voir son activité ici.
                </div>
              ) : (
                <TopSurveysList
                  surveys={topSurveys}
                  maxResp={maxResponses}
                />
              )}

              {topSurveys.length > 0 && (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b text-left text-muted">
                      <tr>
                        <th className="pb-2 font-medium">Enquête</th>
                        <th className="pb-2 font-medium text-center">
                          Répondants
                        </th>
                        <th className="pb-2 font-medium text-center">
                          Complétion
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {topSurveys.map((survey) => (
                        <tr
                          key={survey.id}
                          className="border-b last:border-0"
                        >
                          <td className="py-3">
                            <Link
                              to={`/dashboard/survey/${survey.id}`}
                              className="font-semibold hover:text-[var(--brand)]"
                            >
                              {survey.title}
                            </Link>
                          </td>

                          <td className="py-3 text-center">
                            {formatNumber(survey.respondents)}
                          </td>

                          <td className="py-3 text-center">
                            {survey.completion_rate ?? 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="section-card p-6"
            >
              <h2 className="font-semibold text-lg mb-1">
                Collecte par enquêteur
              </h2>

              <p className="text-xs text-muted mb-4">
                Nombre de répondants enregistrés par personne.
              </p>

              {summary.interviewerStats.length === 0 ? (
                <div className="text-sm text-muted">
                  Aucun enquêteur n’a encore collecté de réponse.
                </div>
              ) : (
                <div className="space-y-4">
                  {summary.interviewerStats.slice(0, 6).map((item) => {
                    const maxInterviewerCount = Math.max(
                      1,
                      ...summary.interviewerStats.map(
                        (stat) => stat.respondents ?? 0
                      )
                    );

                    const width = Math.max(
                      5,
                      ((item.respondents ?? 0) / maxInterviewerCount) * 100
                    );

                    return (
                      <div key={item.name}>
                        <div className="flex justify-between gap-3 text-sm mb-1">
                          <span className="truncate font-medium">
                            {item.name}
                          </span>

                          <span className="text-muted">
                            {item.respondents}
                          </span>
                        </div>

                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--brand)]"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="section-card p-6 overflow-x-auto"
          >
            <h2 className="font-semibold text-lg mb-1">
              Répartition des réponses
            </h2>

            <p className="text-xs text-muted mb-4">
              Clique sur une barre pour consulter le détail des réponses.
            </p>

            <DashboardCharts
  topSurveys={topSurveys}
  dailyActivity={summary.dailyActivity}
/>
          </motion.div>

          <div className="section-card p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold">
                Besoin d’une analyse plus détaillée ?
              </h2>

              <p className="text-sm text-muted mt-1">
                Ouvre une enquête pour voir les statistiques question par question.
              </p>
            </div>

            <Link to="/surveys" className="btn-outline text-center">
              Consulter mes enquêtes
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
