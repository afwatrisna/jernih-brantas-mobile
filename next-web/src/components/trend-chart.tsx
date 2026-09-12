import type { Reading } from "@/lib/jernih-data";
import { formatNtu } from "@/lib/jernih-data";
import { formatDateTime, getSeverity } from "@/lib/dashboard-utils";

export type ChartSeries = {
  id: string;
  name: string;
  color: string;
  readings: Reading[];
  /** thicker stroke + anomaly dots */
  primary?: boolean;
};

type TrendChartProps = {
  readings: Reading[];
  baseline: number;
  /** Optional multi-station overlays. Primary series still uses `readings`. */
  series?: ChartSeries[];
};

const WIDTH = 600;
const HEIGHT = 210;
const CHART_HEIGHT = 145;
const X0 = 38;
const X1 = 568;
const SPAN = X1 - X0;

function buildPath(
  values: number[],
  timestamps: number[],
  tMin: number,
  tMax: number,
  yFor: (v: number) => number,
): { path: string; points: { x: number; y: number; ntu: number }[] } {
  if (values.length === 0) return { path: "", points: [] };
  const tSpan = Math.max(1, tMax - tMin);
  const points = values.map((value, index) => {
    const t = timestamps[index] ?? tMin;
    const x =
      values.length === 1
        ? X0 + SPAN / 2
        : X0 + ((t - tMin) / tSpan) * SPAN;
    return { x, y: yFor(value), ntu: value };
  });
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
  return { path, points };
}

export function TrendChart({ readings, baseline, series }: TrendChartProps) {
  const primaryData = readings.slice(-48);
  const overlaySeries = (series ?? [])
    .filter((s) => s.readings.length >= 2)
    .map((s) => ({
      ...s,
      readings: s.readings.slice(-48),
    }));

  if (primaryData.length < 2 && overlaySeries.length === 0) {
    return (
      <div className="chart-empty">Data belum cukup untuk menampilkan tren.</div>
    );
  }

  const allValues: number[] = [
    ...primaryData.map((r) => r.ntu),
    ...overlaySeries.flatMap((s) => s.readings.map((r) => r.ntu)),
    baseline,
    25,
    50,
  ];
  const allTimestamps: number[] = [
    ...primaryData.map((r) => r.timestamp),
    ...overlaySeries.flatMap((s) => s.readings.map((r) => r.timestamp)),
  ];
  const min = Math.max(0, Math.min(...allValues) - 4);
  const max = Math.max(...allValues) + 5;
  const tMin = Math.min(...allTimestamps);
  const tMax = Math.max(...allTimestamps);
  const yFor = (value: number) =>
    20 + (1 - (value - min) / Math.max(1, max - min)) * CHART_HEIGHT;

  const primary = buildPath(
    primaryData.map((r) => r.ntu),
    primaryData.map((r) => r.timestamp),
    tMin,
    tMax,
    yFor,
  );

  const overlays = overlaySeries.map((s) => ({
    ...s,
    ...buildPath(
      s.readings.map((r) => r.ntu),
      s.readings.map((r) => r.timestamp),
      tMin,
      tMax,
      yFor,
    ),
  }));

  const timeStart =
    primaryData[0]?.timestamp ??
    overlaySeries[0]?.readings[0]?.timestamp ??
    tMin;
  const timeEnd =
    primaryData[primaryData.length - 1]?.timestamp ??
    overlaySeries[0]?.readings[overlaySeries[0].readings.length - 1]?.timestamp ??
    tMax;

  return (
    <div
      className="trend-chart"
      aria-label="Grafik tren NTU multi-stasiun dengan baseline, ambang, dan penanda anomali"
    >
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img">
        {[20, 92, 165].map((y) => (
          <line key={y} x1={X0} x2={X1} y1={y} y2={y} className="chart-guide" />
        ))}
        <line
          x1={X0}
          x2={X1}
          y1={yFor(baseline)}
          y2={yFor(baseline)}
          className="chart-baseline"
        />
        <text x={474} y={Math.max(16, yFor(baseline) - 4)}>
          baseline {formatNtu(baseline)}
        </text>
        <line x1={X0} x2={X1} y1={yFor(25)} y2={yFor(25)} className="chart-threshold" />
        <text x={526} y={Math.max(16, yFor(25) - 4)}>
          25
        </text>
        <line
          x1={X0}
          x2={X1}
          y1={yFor(50)}
          y2={yFor(50)}
          className="chart-threshold high"
        />
        <text x={526} y={Math.max(16, yFor(50) - 4)}>
          50
        </text>
        <text x={4} y={24}>
          {max.toFixed(0)}
        </text>
        <text x={4} y={96}>
          {((max + min) / 2).toFixed(0)}
        </text>
        <text x={15} y={169}>
          {min.toFixed(0)}
        </text>

        {/* Overlay series first (under primary) */}
        {overlays.map((s) => (
          <g key={s.id} className="chart-series-overlay">
            <path
              d={s.path}
              className="chart-line chart-line-overlay"
              style={{ stroke: s.color }}
            />
            {s.points.length > 0 && (
              <circle
                cx={s.points[s.points.length - 1].x}
                cy={s.points[s.points.length - 1].y}
                r={3.6}
                fill={s.color}
                stroke="#fffdf8"
                strokeWidth={2}
              />
            )}
          </g>
        ))}

        {primary.path && (
          <>
            <path d={primary.path} className="chart-line" />
            {primary.points.map((point, index) => {
              const reading = primaryData[index];
              if (!reading) return null;
              const severity = getSeverity(reading.ntu, baseline);
              const anomaly =
                severity === "high" ||
                severity === "critical" ||
                reading.ntu > baseline * 1.6;
              return (
                <circle
                  key={`${point.x}-${point.y}-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={
                    index === primary.points.length - 1 || anomaly ? 5 : 3.4
                  }
                  className={`chart-point ${index === primary.points.length - 1 ? "active" : ""} ${anomaly ? "anomaly" : ""}`}
                />
              );
            })}
          </>
        )}

        <text x={X0} y={198}>
          {formatDateTime(timeStart)}
        </text>
        <text x={470} y={198}>
          {formatDateTime(timeEnd)}
        </text>
      </svg>
      <div className="chart-legend">
        <span>
          <i className="baseline" />
          Baseline
        </span>
        <span>
          <i className="threshold" />
          Ambang
        </span>
        <span>
          <i className="anomaly" />
          Anomali
        </span>
        {overlays.map((s) => (
          <span key={s.id} className="chart-legend-series">
            <i style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
