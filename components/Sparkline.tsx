"use client";

export function Sparkline({
  values,
  labels,
  activeIndex,
  onSelect,
}: {
  values: number[];
  labels?: string[];
  activeIndex?: number;
  onSelect?: (index: number) => void;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const w = 280;
  const h = 64;
  const pad = 6;
  const pts = values.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (values.length - 1);
    const y = h - pad - (v / max) * (h - pad * 2);
    return { x, y, v, i };
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="sparkline" role="img" aria-label="Composite access over time">
      <path d={d} fill="none" stroke="#d4a017" strokeWidth="1.8" />
      {pts.map((p) => (
        <g key={p.i}>
          <circle
            cx={p.x}
            cy={p.y}
            r={p.i === activeIndex ? 4.2 : 3}
            fill={p.i === activeIndex ? "#efe7d6" : "#d4a017"}
            onClick={() => onSelect?.(p.i)}
            style={{ cursor: onSelect ? "pointer" : "default" }}
          />
          {labels && (
            <text x={p.x} y={h - 1} textAnchor="middle" className="spark-lab">
              {labels[p.i]}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
