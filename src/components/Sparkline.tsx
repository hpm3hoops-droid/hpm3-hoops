/** Small server-rendered SVG line chart. Lower-is-better metrics pass invert. */
export default function Sparkline({ points, label, unit, invert }: { points: { x: string; y: number }[]; label: string; unit?: string; invert?: boolean }) {
  const W = 320, H = 110, P = { l: 30, r: 10, t: 12, b: 22 };
  const ys = points.map((p) => p.y);
  if (!points.length) return <div className="card"><h4>{label}</h4><p className="small muted" style={{ marginTop: 8 }}>No data yet.</p></div>;
  let min = Math.min(...ys), max = Math.max(...ys);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.15; min -= pad; max += pad;
  const sx = (i: number) => P.l + (points.length === 1 ? (W - P.l - P.r) / 2 : (i / (points.length - 1)) * (W - P.l - P.r));
  const sy = (v: number) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
  const d = points.map((p, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
  const area = `${d} L${sx(points.length - 1).toFixed(1)},${(H - P.b).toFixed(1)} L${sx(0).toFixed(1)},${(H - P.b).toFixed(1)} Z`;
  const first = points[0].y, last = points[points.length - 1].y;
  const delta = last - first;
  const better = invert ? delta < 0 : delta > 0;
  const ticks = [min + pad, max - pad];
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h4>{label}</h4>
        <span className="mono" style={{ fontSize: 13, color: points.length > 1 ? (better ? "var(--green)" : delta === 0 ? "var(--ink2)" : "var(--red)") : "var(--ink2)" }}>
          {last}{unit ?? ""}{points.length > 1 && ` (${delta > 0 ? "+" : ""}${Number.isInteger(delta) ? delta : delta.toFixed(2)})`}
        </span>
      </div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label} over time`}>
        {ticks.map((t) => <g key={t}><line className="grid" x1={P.l} x2={W - P.r} y1={sy(t)} y2={sy(t)} /><text x={P.l - 4} y={sy(t) + 3} textAnchor="end">{Number.isInteger(t) ? t : t.toFixed(1)}</text></g>)}
        <path className="area" d={area} />
        <path className="line" d={d} />
        {points.map((p, i) => <circle className="pt" key={i} cx={sx(i)} cy={sy(p.y)} r={i === points.length - 1 ? 4 : 2.5} />)}
        <text x={P.l} y={H - 6}>{points[0].x.slice(5)}</text>
        {points.length > 1 && <text x={W - P.r} y={H - 6} textAnchor="end">{points[points.length - 1].x.slice(5)}</text>}
      </svg>
    </div>
  );
}
