// src/components/TopSurveysList.jsx
import React from "react";
import { Link } from "react-router-dom";

/**
 * TopSurveysList
 * props:
 *  - surveys: [{ id, title, description, responses }, ...]
 *  - maxResp: number (pour le calcul de la largeur des barres)
 */
export default function TopSurveysList({ surveys = [], maxResp = 1 }) {
  return (
    <div>
      {surveys.length === 0 ? (
        <div className="text-sm text-muted">Aucune enquête n'a encore de réponses</div>
      ) : (
        <div className="space-y-4">
          {surveys.map((s) => (
            <div key={s.id} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  {/* titre cliquable (navigue vers /dashboard/survey/:id) */}
                  <Link
                    to={`/dashboard/survey/${s.id}`}
                    className="font-semibold text-[var(--text-default)] hover:underline"
                    title={s.title || "Sans titre"}
                  >
                    {s.title || "Sans titre"}
                  </Link>

                  <div className="text-sm text-muted">{s.responses} réponses</div>
                </div>

                {/* mini bar */}
                <div className="w-full bg-[var(--glass)] h-2 rounded mt-2 overflow-hidden">
                  <div
                    className="h-2 rounded bg-[var(--brand)]"
                    style={{
                      width: `${Math.round(( (s.responses || 0) / Math.max(1, maxResp) ) * 100)}%`
                    }}
                  />
                </div>

                <div className="text-xs text-muted mt-1">{s.description || ""}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
