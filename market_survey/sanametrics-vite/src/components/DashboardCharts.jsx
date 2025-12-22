// src/components/DashboardCharts.jsx
import React, { useState, useRef } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import { getResponsesBySurvey } from "../api/useDashboard";
import { useAuth } from "../api/useAuth";
import html2canvas from "html2canvas";

/* Helper CSV (simple, safe) */
function downloadCsvFile(filename, rows = [], header = []) {
  if (!rows || rows.length === 0) {
    alert("Aucune donnée à exporter.");
    return;
  }
  const cols = header.length ? header : Object.keys(rows[0]);
  const csv = [
    cols.join(","),
    ...rows.map(r =>
      cols
        .map(c => {
          const v = r[c] == null ? "" : String(r[c]).replace(/"/g, '""');
          return `"${v}"`;
        })
        .join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default function DashboardCharts({ topSurveys = [] }) {
  const { access } = useAuth();
  const [detailed, setDetailed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState("bar"); // "bar" | "pie" | "donut"

  const chartRef = useRef(null);

  const brand = (typeof window !== "undefined"
    ? getComputedStyle(document.documentElement).getPropertyValue("--brand")
    : "")?.trim() || "#2563EB";
  const colors = [brand || "#2563EB", "#60A5FA", "#93C5FD", "#BFDBFE", "#DBEAFE"];

  const barData = topSurveys.map(s => ({ name: s.title || `#${s.id}`, responses: s.responses || 0, id: s.id }));
  const total = barData.reduce((acc, x) => acc + (x.responses || 0), 0) || 1;
  const pieData = barData.map(d => ({ name: d.name, value: d.responses, id: d.id }));

  async function onBarClick(surveyId) {
    if (!surveyId) return;
    setLoading(true);
    try {
      const resp = await getResponsesBySurvey(access, surveyId);
      setDetailed({ surveyId, responses: Array.isArray(resp) ? resp : (resp.results || resp) });
    } catch (e) {
      console.error("Erreur chargement réponses:", e);
      setDetailed({ surveyId, error: e });
    } finally {
      setLoading(false);
    }
  }

  async function onPieClick(entry) {
    const id = entry?.payload?.id;
    if (id) await onBarClick(id);
  }

  async function downloadNodeAsPng(node, filename = "chart.png") {
    if (!node) {
      alert("Rien à capturer.");
      return;
    }
    try {
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: null });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("Erreur capture chart:", e);
      alert("Échec de la capture (voir console).");
    }
  }

  /* Convert responses array to rows for CSV:
     We try to flatten objects simply: keep primitive fields and JSON.stringify complex fields.
  */
  function normalizeResponsesForCsv(items = []) {
    if (!Array.isArray(items) || items.length === 0) return [];
    // compute union of top-level keys across first N items
    const keys = new Set();
    items.slice(0, 50).forEach(it => {
      Object.keys(it || {}).forEach(k => keys.add(k));
    });
    const cols = Array.from(keys);
    return items.map(it => {
      const row = {};
      cols.forEach(k => {
        const v = it[k];
        if (v == null) row[k] = "";
        else if (typeof v === "object") row[k] = JSON.stringify(v);
        else row[k] = String(v);
      });
      return row;
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="section-card p-4" ref={chartRef}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Top enquêtes — réponses</h4>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChartType("bar")}
                className={`px-3 py-1 rounded ${chartType === "bar" ? "bg-[var(--brand)] text-white" : "bg-transparent text-[var(--text-default)] border border-[var(--input-border)]"}`}
              >
                Bar
              </button>
              <button
                onClick={() => setChartType("pie")}
                className={`px-3 py-1 rounded ${chartType === "pie" ? "bg-[var(--brand)] text-white" : "bg-transparent text-[var(--text-default)] border border-[var(--input-border)]"}`}
              >
                Pie
              </button>
              <button
                onClick={() => setChartType("donut")}
                className={`px-3 py-1 rounded ${chartType === "donut" ? "bg-[var(--brand)] text-white" : "bg-transparent text-[var(--text-default)] border border-[var(--input-border)]"}`}
              >
                Donut
              </button>
            </div>

            <button
              onClick={() => downloadNodeAsPng(chartRef.current, `top_surveys_${Date.now()}.png`)}
              className="px-3 py-1 border rounded text-sm btn-outline"
              title="Télécharger ce graphique (PNG)"
            >
              Télécharger
            </button>
          </div>
        </div>

        {barData.length === 0 ? (
          <div className="text-sm text-muted">Aucune donnée disponible</div>
        ) : (
          <>
            {chartType === "bar" && (
              <div style={{ width: "100%", height: 340 }}>
                <ResponsiveContainer>
                  <BarChart data={barData} margin={{ top: 8, right: 16, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="responses" onClick={(e) => onBarClick(e.id)}>
                      {barData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {(chartType === "pie" || chartType === "donut") && (
              <div style={{ width: "100%", height: 340 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={chartType === "pie" ? 110 : 90}
                      innerRadius={chartType === "donut" ? 44 : 0}
                      onClick={(e) => onPieClick(e)}
                      label={(entry) => `${entry.name} (${Math.round((entry.value / total) * 100)}%)`}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={`cell-pie-${idx}`} fill={colors[idx % colors.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        <div className="text-xs text-muted mt-4">Cliquez sur une barre (ou un slice) pour charger les réponses.</div>

        {/* DETAIL: preview table + download CSV */}
        <div className="mt-4 text-sm">
          {detailed ? (
            loading ? (
              <div>Chargement des réponses...</div>
            ) : detailed.error ? (
              <div className="text-red-600">Erreur chargement : {String(detailed.error?.message || detailed.error)}</div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">Détail réponses (extrait)</div>
                  <div className="text-xs text-muted">
                    {Array.isArray(detailed.responses) ? detailed.responses.length : 0} éléments
                  </div>
                </div>

                {Array.isArray(detailed.responses) && detailed.responses.length > 0 ? (
                  <>
                    {/* preview table (first 8 rows) */}
                    <div className="overflow-auto border rounded">
                      <table className="w-full text-sm">
                        <thead className="bg-[var(--card)]/50">
                          <tr>
                            {/* build header from first item keys */}
                            {Object.keys(detailed.responses[0]).slice(0, 10).map((k) => (
                              <th key={k} className="p-2 text-left text-xs text-muted">{k}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {detailed.responses.slice(0, 8).map((row, i) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-[var(--bg)]" : ""}>
                              {Object.keys(detailed.responses[0]).slice(0, 10).map((k) => (
                                <td key={k} className="p-2 align-top break-words text-xs">{typeof row[k] === "object" ? JSON.stringify(row[k]) : String(row[k] ?? "")}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          const rows = normalizeResponsesForCsv(detailed.responses);
                          downloadCsvFile(`responses_survey_${detailed.surveyId}_${Date.now()}.csv`, rows);
                        }}
                        className="px-3 py-1 btn-primary text-sm"
                      >
                        Télécharger (CSV / Excel)
                      </button>

                      <button
                        onClick={() => {
                          // quick copy first 20 items JSON to clipboard for debugging
                          try {
                            navigator.clipboard.writeText(JSON.stringify(detailed.responses.slice(0, 20), null, 2));
                            alert("Extrait JSON copié dans le presse-papiers (premiers 20).");
                          } catch (e) {
                            console.warn(e);
                            alert("Impossible de copier — regarde la console.");
                          }
                        }}
                        className="px-3 py-1 border rounded text-sm btn-outline"
                      >
                        Copier extrait (JSON)
                      </button>
                    </div>

                    <div className="text-xs text-muted mt-2">Aperçu limité : les colonnes affichées sont les clés du premier objet. Le CSV exporte toutes les clés présentes (dans l'extrait).</div>
                  </>
                ) : (
                  <div className="text-sm text-muted">Aucune réponse structurée trouvée.</div>
                )}
              </div>
            )
          ) : (
            <div className="text-sm text-muted">Cliquez sur une barre ou un slice pour voir un extrait des réponses.</div>
          )}
        </div>
      </div>
    </div>
  );
}
