import React from "react";

export default function ActivityList({ items = [] }) {
  return (
    <div className="section-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Activité récente</div>
        <div className="text-xs text-muted">Dernières 24h</div>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <div className="text-sm text-muted">Aucune activité</div>}
        {items.map((it, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-md bg-[var(--sana-blue)]/10 flex items-center justify-center text-[12px] font-medium text-[var(--sana-blue)]">
              {it.icon || "•"}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{it.title}</div>
              <div className="text-xs text-muted">{it.subtitle}</div>
            </div>
            <div className="text-xs text-muted">{it.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
