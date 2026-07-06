import type { VolumePoint } from "@/utils/stats";

function formatNumber(n: number): string {
  return n.toLocaleString("de-DE");
}

/** Vertikales Balkendiagramm. */
export function BarChart({ data }: { data: VolumePoint[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">Noch keine Daten.</p>;
  }

  const width = 520;
  const height = 180;
  const padBottom = 26;
  const padTop = 14;
  const max = Math.max(...data.map((d) => d.value), 1);
  const slot = width / data.length;
  const barW = Math.min(38, slot * 0.6);
  const chartH = height - padBottom - padTop;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {data.map((d, i) => {
        const h = (d.value / max) * chartH;
        const x = i * slot + (slot - barW) / 2;
        const y = padTop + (chartH - h);
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={5}
              className="text-accent"
              fill="currentColor"
            />
            {d.value > 0 && (
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                className="fill-white text-[10px]"
              >
                {formatNumber(d.value)}
              </text>
            )}
            <text
              x={x + barW / 2}
              y={height - 8}
              textAnchor="middle"
              className="fill-[var(--color-muted)] text-[10px]"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Liniendiagramm mit Punkten. */
export function LineChart({ data }: { data: VolumePoint[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">Noch keine Daten.</p>;
  }
  if (data.length === 1) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        {data[0].label}: <span className="font-semibold text-white">{data[0].value}</span> – ab dem
        zweiten Eintrag entsteht eine Kurve.
      </p>
    );
  }

  const width = 520;
  const height = 200;
  const padX = 28;
  const padTop = 16;
  const padBottom = 26;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;
  const chartW = width - padX * 2;
  const chartH = height - padTop - padBottom;

  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * chartW;
    const y = padTop + (1 - (d.value - min) / range) * chartH;
    return { x, y, d };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${padX},${padTop + chartH} ${line} ${padX + chartW},${padTop + chartH}`;
  const step = Math.ceil(data.length / 7);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      <polygon points={area} className="text-accent" fill="currentColor" opacity={0.12} />
      <polyline
        points={line}
        fill="none"
        className="text-accent"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.5} className="text-accent" fill="currentColor" />
          {i % step === 0 && (
            <text
              x={p.x}
              y={height - 8}
              textAnchor="middle"
              className="fill-[var(--color-muted)] text-[10px]"
            >
              {p.d.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/** Horizontale Balkenliste (z. B. Muskelgruppen). */
export function HBars({ data, suffix }: { data: VolumePoint[]; suffix?: string }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">Noch keine Daten.</p>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-sm text-muted">{d.label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sunken">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="w-14 shrink-0 text-right text-sm font-semibold">
            {formatNumber(d.value)}
            {suffix ? ` ${suffix}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
