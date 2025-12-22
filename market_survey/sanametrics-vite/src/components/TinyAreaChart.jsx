import React from "react";

/**
 * TinyAreaChart
 * props: data = [numbers], color (stroke/fill)
 */
export default function TinyAreaChart({ data = [2,4,6,5,7,8,6,9], color = "var(--sana-blue)" }) {
  // normalize
  const max = Math.max(...data, 1);
  const w = 140, h = 48, pad = 6;
  const step = (w - pad*2) / Math.max(1, data.length - 1);
  const points = data.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (1 - v / max) * (h - pad*2);
    return [x, y];
  });
  const pathD = points.map((p, i) => `${i===0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  // polygon for fill
  const fillD = `${pathD} L ${pad + (data.length-1)*step} ${h-pad} L ${pad} ${h-pad} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <defs>
        <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.16" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      <path d={fillD} fill="url(#g1)" stroke="none" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
