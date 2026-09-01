import React, { useMemo, useRef } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import html2canvas from "html2canvas";

const COLORS = [
  "#2563EB",
  "#0EA5E9",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#64748B",
];

const STOP_WORDS = new Set([
  "avec",
  "dans",
  "pour",
  "mais",
  "donc",
  "vous",
  "nous",
  "tout",
  "tous",
  "toute",
  "toutes",
  "plus",
  "moins",
  "très",
  "tres",
  "être",
  "etre",
  "avoir",
  "cette",
  "ceci",
  "cela",
  "comme",
  "dont",
  "votre",
  "notre",
  "leurs",
  "leur",
  "elle",
  "elles",
  "ils",
  "que",
  "qui",
  "les",
  "des",
  "une",
  "un",
  "est",
  "sont",
  "sur",
  "par",
  "pas",
  "non",
  "oui",
  "the",
  "and",
  "with",
  "this",
  "that",
]);

function formatNumber(value) {
  return new Intl.NumberFormat("fr-FR").format(value ?? 0);
}

function getWordFrequency(answers = []) {
  const counts = {};

  answers.forEach((answer) => {
    String(answer)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .split(/\s+/)
      .forEach((word) => {
        const cleanWord = word.trim();

        if (
          cleanWord.length < 4 ||
          STOP_WORDS.has(cleanWord)
        ) {
          return;
        }

        counts[cleanWord] = (counts[cleanWord] || 0) + 1;
      });
  });

  return Object.entries(counts)
    .map(([word, count]) => ({
      name: word,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function getNumericDistribution(answers = []) {
  const values = answers
    .map((answer) =>
      Number(String(answer).replace(",", "."))
    )
    .filter((value) => Number.isFinite(value));

  const frequency = {};

  values.forEach((value) => {
    const label = String(value);
    frequency[label] = (frequency[label] || 0) + 1;
  });

  const distribution = Object.entries(frequency)
    .map(([name, count]) => ({
      name,
      count,
      value: Number(name),
    }))
    .sort((a, b) => a.value - b.value);

  return {
    values,
    distribution,
  };
}

export default function SurveyCharts({ questions = [] }) {
  const chartRefs = useRef({});

  async function downloadChart(questionId, title) {
    const node = chartRefs.current[questionId];

    if (!node) {
      alert("Impossible de trouver ce graphique.");
      return;
    }

    try {
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: "#FFFFFF",
      });

      const safeTitle = String(title || "graphique")
        .replace(/\s+/g, "_")
        .replace(/[^\w-]/g, "");

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `sanametrics_${safeTitle}.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Erreur téléchargement graphique :", error);
      alert("Impossible de télécharger le graphique.");
    }
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted">
        Aucune question ou donnée disponible.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {questions.map((question, index) => {
        const questionId = question.id ?? `question-${index}`;

        const totalAnswers = question.totalAnswers ?? 0;

        const choiceData = (question.choiceCounts || [])
          .map((choice) => ({
            name: choice.text || "Sans libellé",
            count: choice.count ?? 0,
            percentage:
              totalAnswers > 0
                ? Math.round(((choice.count ?? 0) / totalAnswers) * 1000) / 10
                : 0,
          }))
          .sort((a, b) => b.count - a.count);

        const textAnswers = question.textAnswers || [];

        const wordData = useMemo(
          () => getWordFrequency(textAnswers),
          [questionId, textAnswers.join("|")]
        );

        const numericData = useMemo(
          () => getNumericDistribution(textAnswers),
          [questionId, textAnswers.join("|")]
        );

        const numericAverage =
          numericData.values.length > 0
            ? (
                numericData.values.reduce((sum, value) => sum + value, 0) /
                numericData.values.length
              ).toFixed(2)
            : null;

        const isChoice =
          question.question_type === "single" ||
          question.question_type === "multiple";

        const isNumeric = question.question_type === "number";

        return (
          <section
            key={questionId}
            className="rounded-xl border border-[var(--input-border)] bg-white p-4 md:p-6"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-5">
              <div>
                <div className="text-xs font-semibold text-[var(--brand)] mb-2">
                  QUESTION {index + 1}
                </div>

                <h3 className="font-semibold text-lg">
                  {question.text}
                </h3>

                <p className="text-xs text-muted mt-2">
                  {formatNumber(totalAnswers)} réponse(s) enregistrée(s)
                  {question.question_type === "multiple"
                    ? " — plusieurs choix possibles par répondant"
                    : ""}
                </p>
              </div>

              <button
                type="button"
                className="btn-outline text-sm"
                onClick={() => downloadChart(questionId, question.text)}
              >
                Télécharger PNG
              </button>
            </div>

            <div ref={(node) => (chartRefs.current[questionId] = node)}>
              {isChoice && (
                <>
                  {choiceData.length === 0 ? (
                    <div className="rounded-lg bg-slate-50 p-6 text-sm text-muted">
                      Aucune réponse disponible pour cette question.
                    </div>
                  ) : (
                    <>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={choiceData}
                            layout="vertical"
                            margin={{
                              top: 8,
                              right: 45,
                              left: 30,
                              bottom: 8,
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
                              width={140}
                              tick={{
                                fontSize: 11,
                                fill: "#334155",
                              }}
                              tickFormatter={(name) =>
                                name.length > 22
                                  ? `${name.slice(0, 22)}…`
                                  : name
                              }
                            />

                            <Tooltip
                              formatter={(value, name, item) => {
                                if (name === "count") {
                                  return [
                                    `${value} réponse(s) — ${item.payload.percentage}%`,
                                    "Résultat",
                                  ];
                                }

                                return [value, name];
                              }}
                            />

                            <Bar
                              dataKey="count"
                              radius={[0, 6, 6, 0]}
                            >
                              {choiceData.map((item, itemIndex) => (
                                <Cell
                                  key={`${item.name}-${itemIndex}`}
                                  fill={COLORS[itemIndex % COLORS.length]}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b text-left text-muted">
                            <tr>
                              <th className="pb-2 font-medium">Réponse</th>
                              <th className="pb-2 text-center font-medium">
                                Effectif
                              </th>
                              <th className="pb-2 text-center font-medium">
                                Pourcentage
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {choiceData.map((item) => (
                              <tr
                                key={item.name}
                                className="border-b last:border-0"
                              >
                                <td className="py-2">{item.name}</td>
                                <td className="py-2 text-center">
                                  {item.count}
                                </td>
                                <td className="py-2 text-center">
                                  {item.percentage}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              )}

              {isNumeric && (
                <>
                  {numericData.values.length === 0 ? (
                    <div className="rounded-lg bg-slate-50 p-6 text-sm text-muted">
                      Aucune réponse numérique exploitable.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5">
                        <div className="rounded-lg bg-blue-50 p-4">
                          <div className="text-xs text-muted">Moyenne</div>
                          <div className="text-xl font-bold text-blue-700 mt-1">
                            {numericAverage}
                          </div>
                        </div>

                        <div className="rounded-lg bg-violet-50 p-4">
                          <div className="text-xs text-muted">Minimum</div>
                          <div className="text-xl font-bold text-violet-700 mt-1">
                            {Math.min(...numericData.values)}
                          </div>
                        </div>

                        <div className="rounded-lg bg-emerald-50 p-4">
                          <div className="text-xs text-muted">Maximum</div>
                          <div className="text-xl font-bold text-emerald-700 mt-1">
                            {Math.max(...numericData.values)}
                          </div>
                        </div>

                        <div className="rounded-lg bg-amber-50 p-4">
                          <div className="text-xs text-muted">Réponses</div>
                          <div className="text-xl font-bold text-amber-700 mt-1">
                            {numericData.values.length}
                          </div>
                        </div>
                      </div>

                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={numericData.distribution}
                            margin={{
                              top: 8,
                              right: 20,
                              left: -15,
                              bottom: 8,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="rgba(100, 116, 139, 0.18)"
                            />

                            <XAxis
                              dataKey="name"
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
                                `${value} réponse(s)`,
                                "Effectif",
                              ]}
                            />

                            <Bar
                              dataKey="count"
                              fill="#8B5CF6"
                              radius={[6, 6, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </>
              )}

              {!isChoice && !isNumeric && (
                <>
                  {textAnswers.length === 0 ? (
                    <div className="rounded-lg bg-slate-50 p-6 text-sm text-muted">
                      Aucune réponse libre disponible.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">
                          Mots les plus cités
                        </h4>

                        {wordData.length === 0 ? (
                          <div className="rounded-lg bg-slate-50 p-5 text-sm text-muted">
                            Pas assez de mots exploitables pour établir une
                            tendance.
                          </div>
                        ) : (
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={wordData}
                                layout="vertical"
                                margin={{
                                  top: 8,
                                  right: 20,
                                  left: 20,
                                  bottom: 8,
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
                                  width={100}
                                  tick={{
                                    fontSize: 11,
                                    fill: "#334155",
                                  }}
                                />

                                <Tooltip
                                  formatter={(value) => [
                                    `${value} occurrence(s)`,
                                    "Fréquence",
                                  ]}
                                />

                                <Bar
                                  dataKey="count"
                                  fill="#10B981"
                                  radius={[0, 6, 6, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">
                          Extraits de réponses
                        </h4>

                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {textAnswers.slice(0, 20).map((answer, answerIndex) => (
                            <div
                              key={`${answer}-${answerIndex}`}
                              className="rounded-lg border bg-slate-50 p-3 text-sm"
                            >
                              {answer}
                            </div>
                          ))}
                        </div>

                        {textAnswers.length > 20 && (
                          <p className="text-xs text-muted mt-3">
                            {textAnswers.length - 20} autre(s) réponse(s)
                            disponible(s) dans l’export Excel.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}