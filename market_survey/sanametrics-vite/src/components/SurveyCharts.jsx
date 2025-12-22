// src/components/SurveyCharts.jsx
import React, { useRef, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import html2canvas from "html2canvas";

/**
 * SurveyCharts (allégé) — maintenant avec Donut
 *
 * - garde : chart (Bar | Pie | Donut) + switch mode + bouton téléchargement (capture PNG)
 * - retire : legend/box en bas + counts en double (pour éviter la surcharge visuelle)
 *
 * props:
 *  - questions: array des questions produites par fetchSurveyAnalysis()
 *
 * question shape attendu:
 *   { id, text, question_type, totalAnswers, choiceCounts: [{ id, text, count }], textAnswers: [] }
 */

export default function SurveyCharts({ questions = [] }) {
  const chartRefs = useRef({}); // map qid -> DOM node (chart wrapper)
  const [chartMode, setChartMode] = useState({}); // qid -> "bar"|"pie"|"donut"

  // récupère couleur brand CSS
  const brand = (typeof window !== "undefined"
    ? getComputedStyle(document.documentElement).getPropertyValue("--brand")
    : "")?.trim() || "#2563EB";
  const altColors = ["#60A5FA", "#93C5FD", "#BFDBFE", "#DBEAFE", "#7DD3FC"];

  if (!Array.isArray(questions) || questions.length === 0) {
    return <div className="text-sm text-muted">Aucune donnée graphique disponible.</div>;
  }

  const downloadChartImage = async (qid, title = "chart") => {
    const node = chartRefs.current[qid];
    if (!node) {
      alert("Impossible de trouver le graphique à capturer.");
      return;
    }
    try {
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: null });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      const safeTitle = (title || `survey-${qid}`).replace(/\s+/g, "_").replace(/[^\w\-_.]/g, "");
      link.download = `${safeTitle}_chart.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("Erreur capture chart:", e);
      alert("Échec de la capture. Regarde la console (F12).");
    }
  };

  return (
    <div className="space-y-6">
      {questions.map((q) => {
        const qid = q.id ?? Math.random().toString(36).slice(2, 8);
        const mode = chartMode[qid] || "bar";
        const choices = Array.isArray(q.choiceCounts) ? q.choiceCounts : [];
        const barData = choices.map((c) => ({ name: c.text, value: c.count || 0 }));
        const pieData = choices.map((c) => ({ name: c.text, value: c.count || 0 }));

        return (
          <div key={qid} className="section-card">
            <div className="flex items-start justify-between mb-3 gap-4">
              <div>
                <div className="font-semibold">{q.text}</div>
                <div className="text-xs text-muted">
                  Type: {q.question_type} — {q.totalAnswers || 0} réponses
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(q.question_type === "single" || q.question_type === "multiple") && (
                  <div className="flex gap-1 bg-transparent rounded">
                    <button
                      onClick={() => setChartMode((s) => ({ ...s, [qid]: "bar" }))}
                      className={`px-2 py-1 text-sm rounded ${mode === "bar" ? "bg-[var(--brand)] text-white" : "text-[var(--text-default)] border border-[var(--input-border)]"}`}
                    >
                      Bar
                    </button>
                    <button
                      onClick={() => setChartMode((s) => ({ ...s, [qid]: "pie" }))}
                      className={`px-2 py-1 text-sm rounded ${mode === "pie" ? "bg-[var(--brand)] text-white" : "text-[var(--text-default)] border border-[var(--input-border)]"}`}
                    >
                      Pie
                    </button>
                    <button
                      onClick={() => setChartMode((s) => ({ ...s, [qid]: "donut" }))}
                      className={`px-2 py-1 text-sm rounded ${mode === "donut" ? "bg-[var(--brand)] text-white" : "text-[var(--text-default)] border border-[var(--input-border)]"}`}
                    >
                      Donut
                    </button>
                  </div>
                )}

                <button
                  onClick={() => downloadChartImage(qid, q.text)}
                  className="px-3 py-1 border rounded text-sm btn-outline"
                  title="Télécharger le graphique (PNG)"
                >
                  Télécharger
                </button>
              </div>
            </div>

            {/* Chart wrapper (on met le ref ici pour capturer uniquement la zone du chart) */}
            <div ref={(el) => (chartRefs.current[qid] = el)}>
              {(q.question_type === "single" || q.question_type === "multiple") ? (
                mode === "bar" ? (
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" name="Réponses">
                          {barData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={[brand, ...altColors][idx % (altColors.length + 1)]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : mode === "pie" ? (
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={0}
                          label={(entry) => `${entry.name} (${entry.value})`}
                        >
                          {pieData.map((entry, idx) => (
                            <Cell key={`pie-${idx}`} fill={[brand, ...altColors][idx % (altColors.length + 1)]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  // donut
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={84}
                          innerRadius={36}
                          label={(entry) => `${entry.name} (${entry.value})`}
                        >
                          {pieData.map((entry, idx) => (
                            <Cell key={`donut-${idx}`} fill={[brand, ...altColors][idx % (altColors.length + 1)]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )
              ) : (
                // text answers -> just a short list (no extra legend)
                <div className="mt-2">
                  <div className="text-sm text-muted mb-2">Extraits de réponses ({q.textAnswers?.length || 0})</div>
                  <div className="grid gap-2">
                    {(q.textAnswers || []).slice(0, 8).map((t, i) => (
                      <div key={i} className="p-2 bg-[var(--bg)] rounded border text-sm break-words">{t}</div>
                    ))}
                    {(q.textAnswers || []).length > 8 && (
                      <div className="text-xs text-muted">+ {q.textAnswers.length - 8} autres réponses…</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* removed bottom legend / counts to avoid clutter */}
          </div>
        );
      })}
    </div>
  );
}
