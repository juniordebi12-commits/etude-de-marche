import React, { useRef, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { getResponsesBySurvey } from "../api/useDashboard";
import { useAuth } from "../api/useAuth";
import html2canvas from "html2canvas";

function downloadCsvFile(filename, rows = []) {
  if (!rows.length) {
    alert("Aucune donnée à exporter.");
    return;
  }

  const columns = Object.keys(rows[0]);

  const csv = [
    columns.join(","),
    ...rows.map((row) =>
      columns
        .map((column) => {
          const value =
            row[column] === null || row[column] === undefined
              ? ""
              : typeof row[column] === "object"
                ? JSON.stringify(row[column])
                : String(row[column]);

          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(link.href);
}

function formatDate(date) {
  if (!date) return "";

  const parts = String(date).split("-");

  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }

  return date;
}

function formatNumber(value) {
  return new Intl.NumberFormat("fr-FR").format(value ?? 0);
}

export default function DashboardCharts({
  topSurveys = [],
  dailyActivity = [],
}) {
  const { access } = useAuth();

  const [detailed, setDetailed] = useState(null);
  const [loading, setLoading] = useState(false);

  const chartsRef = useRef(null);

  const brand =
    (
      typeof window !== "undefined"
        ? getComputedStyle(document.documentElement).getPropertyValue("--brand")
        : ""
    )?.trim() || "#2563EB";

  const colors = [
    brand,
    "#0EA5E9",
    "#8B5CF6",
    "#10B981",
    "#F59E0B",
    "#EC4899",
    "#64748B",
  ];

  const surveyData = [...topSurveys]
    .map((survey) => ({
      id: survey.id,
      name: survey.title || `Enquête ${survey.id}`,
      responses: survey.responses ?? 0,
      respondents: survey.respondents ?? 0,
      completionRate: survey.completion_rate ?? 0,
    }))
    .sort((a, b) => b.responses - a.responses);

  const activityData = [...dailyActivity]
    .map((item) => ({
      date: item.date,
      label: formatDate(item.date),
      respondents: item.respondents ?? 0,
    }))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  async function loadSurveyResponses(surveyId) {
    if (!surveyId) return;

    setLoading(true);
    setDetailed(null);

    try {
      const data = await getResponsesBySurvey(access, surveyId);

      setDetailed({
        surveyId,
        responses: Array.isArray(data) ? data : data.results || [],
      });
    } catch (error) {
      console.error("Erreur lors du chargement des réponses :", error);

      setDetailed({
        surveyId,
        error,
      });
    } finally {
      setLoading(false);
    }
  }

  async function downloadChartsAsPng() {
    if (!chartsRef.current) {
      alert("Aucun graphique à télécharger.");
      return;
    }

    try {
      const canvas = await html2canvas(chartsRef.current, {
        scale: 2,
        backgroundColor: "#FFFFFF",
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `sanametrics_dashboard_${Date.now()}.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Erreur pendant la génération de l'image :", error);
      alert("Impossible de télécharger les graphiques.");
    }
  }

  const responseRows = Array.isArray(detailed?.responses)
    ? detailed.responses.map((response) => ({
        id: response.id ?? "",
        respondent:
          response.respondent?.participant_name ??
          response.respondent_name ??
          "",
        question:
          response.question?.text ??
          response.question_text ??
          response.question ??
          "",
        reponse:
          response.answer_text ??
          (
            Array.isArray(response.selected_choices)
              ? response.selected_choices
                  .map((choice) => choice.text ?? choice)
                  .join(" ; ")
              : ""
          ),
        date: response.created_at ?? "",
      }))
    : [];

  return (
    <div className="space-y-8" ref={chartsRef}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-semibold text-lg">
            Visualisation de la collecte
          </h3>

          <p className="text-xs text-muted mt-1">
            Évolution des répondants et comparaison des enquêtes.
          </p>
        </div>

        <button
          type="button"
          onClick={downloadChartsAsPng}
          className="btn-outline text-sm"
        >
          Télécharger les graphiques
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--input-border)] p-4 bg-white">
          <div className="mb-4">
            <h4 className="font-semibold">
              Évolution de la collecte
            </h4>

            <p className="text-xs text-muted mt-1">
              Répondants enregistrés chaque jour.
            </p>
          </div>

          {activityData.length === 0 ? (
            <div className="h-72 flex items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted px-6">
              Aucune collecte au cours des 30 derniers jours. Les indicateurs
              globaux restent disponibles en haut du dashboard.
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={activityData}
                  margin={{
                    top: 12,
                    right: 20,
                    left: -15,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(100, 116, 139, 0.18)"
                  />

                  <XAxis
                    dataKey="label"
                    tick={{
                      fontSize: 11,
                      fill: "#64748B",
                    }}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fontSize: 11,
                      fill: "#64748B",
                    }}
                  />

                  <Tooltip
                    formatter={(value) => [
                      `${formatNumber(value)} répondant(s)`,
                      "Collecte",
                    ]}
                    labelFormatter={(label) => `Date : ${label}`}
                  />

                  <Line
                    type="monotone"
                    dataKey="respondents"
                    stroke={brand}
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: brand,
                    }}
                    activeDot={{
                      r: 6,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[var(--input-border)] p-4 bg-white">
          <div className="mb-4">
            <h4 className="font-semibold">
              Enquêtes les plus actives
            </h4>

            <p className="text-xs text-muted mt-1">
              Nombre de réponses enregistrées par enquête.
            </p>
          </div>

          {surveyData.length === 0 ? (
            <div className="h-72 flex items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted px-6">
              Crée une enquête et commence la collecte pour afficher ce
              graphique.
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={surveyData}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 30,
                    left: 25,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="rgba(100, 116, 139, 0.18)"
                  />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{
                      fontSize: 11,
                      fill: "#64748B",
                    }}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={115}
                    tick={{
                      fontSize: 11,
                      fill: "#334155",
                    }}
                    tickFormatter={(name) =>
                      name.length > 18 ? `${name.slice(0, 18)}…` : name
                    }
                  />

                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "responses") {
                        return [
                          `${formatNumber(value)} réponse(s)`,
                          "Réponses",
                        ];
                      }

                      return [value, name];
                    }}
                    labelFormatter={(label) => label}
                  />

                  <Bar
                    dataKey="responses"
                    radius={[0, 6, 6, 0]}
                    cursor="pointer"
                    onClick={(data) => {
                      const surveyId = data?.id ?? data?.payload?.id;
                      loadSurveyResponses(surveyId);
                    }}
                  >
                    {surveyData.map((survey, index) => (
                      <Cell
                        key={survey.id}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--input-border)] p-4 bg-white">
        <div className="mb-4">
          <h4 className="font-semibold">
            Détail d'une enquête
          </h4>

          <p className="text-xs text-muted mt-1">
            Clique sur une barre du graphique pour consulter les réponses et
            les exporter.
          </p>
        </div>

        {loading && (
          <div className="text-sm text-muted">
            Chargement des réponses…
          </div>
        )}

        {!loading && !detailed && (
          <div className="rounded-lg bg-slate-50 p-5 text-sm text-muted">
            Sélectionne une enquête depuis le graphique à droite.
          </div>
        )}

        {!loading && detailed?.error && (
          <div className="rounded-lg bg-red-50 p-5 text-sm text-red-700">
            Erreur :{" "}
            {detailed.error.message || "Impossible de charger les réponses."}
          </div>
        )}

        {!loading && detailed && !detailed.error && (
          <>
            <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                <span className="font-semibold">
                  {formatNumber(responseRows.length)}
                </span>{" "}
                réponse(s) chargée(s)
              </div>

              {responseRows.length > 0 && (
                <button
                  type="button"
                  className="btn-primary text-sm"
                  onClick={() =>
                    downloadCsvFile(
                      `sanametrics_reponses_enquete_${detailed.surveyId}.csv`,
                      responseRows
                    )
                  }
                >
                  Télécharger en CSV
                </button>
              )}
            </div>

            {responseRows.length === 0 ? (
              <div className="rounded-lg bg-slate-50 p-5 text-sm text-muted">
                Cette enquête ne possède pas encore de réponse exploitable.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left">
                    <tr>
                      <th className="p-3 font-semibold">Participant</th>
                      <th className="p-3 font-semibold">Question</th>
                      <th className="p-3 font-semibold">Réponse</th>
                    </tr>
                  </thead>

                  <tbody>
                    {responseRows.slice(0, 10).map((row, index) => (
                      <tr
                        key={`${row.id}-${index}`}
                        className="border-t"
                      >
                        <td className="p-3 align-top">
                          {row.respondent || "Anonyme"}
                        </td>

                        <td className="p-3 align-top">
                          {row.question}
                        </td>

                        <td className="p-3 align-top">
                          {row.reponse || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {responseRows.length > 10 && (
              <p className="text-xs text-muted mt-3">
                Aperçu limité aux 10 premières réponses. Le fichier CSV
                contient toutes les réponses.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}