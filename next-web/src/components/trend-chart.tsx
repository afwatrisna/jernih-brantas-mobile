"use client";

import { useState } from "react";
import type { Reading } from "@/lib/jernih-data";
import { formatNtu } from "@/lib/jernih-data";
import { formatDateTime, getSeverity } from "@/lib/dashboard-utils";

export type ChartSeries = {
  id: string;
  name: string;
  color: string;
  readings: Reading[];
  primary?: boolean;
};

type TrendChartProps = {
  readings: Reading[];
  baseline: number;
  series?: ChartSeries[];
  /** Station ids temporarily hidden via chip toggle */
  hiddenIds?: string[];
  primaryId?: string;
  primaryName?: string;
  primaryColor?: string;
};

type TipState = {
  x: number;
  y: number;
  title: string;
  name: string;
  color: string;
  ntu: number;
} | null;

const WIDTH = 640;
const HEIGHT = 230;
const CHART_HEIGHT = 150;
const X0 = 48;
const X1 = 620;
const SPAN = X1 - X0;

function shortAxisLabel(ts: number, spanMs: number) {
  if (spanMs <= 36 * 60 * 60 * 1000) {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(ts);
  }
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
  }).format(ts);
}

function buildPath(
  values: number[],
  timestamps: number[],
  tMin: number,
  tMax: number,
  yFor: (v: number) => number,
): { path: string; points: { x: number; y: number; ntu: number; ts: number }[] } {
  if (values.length === 0) return { path: "", points: [] };
  const tSpan = Math.max(1, tMax - tMin);
  const points = values.map((value, index) => {
    const t = timestamps[index] ?? tMin;
    const x =
      values.length === 1 ? X0 + SPAN / 2 : X0 + ((t - tMin) / tSpan) * SPAN;
    return { x, y: yFor(value), ntu: value, ts: t };
  });
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
  return { path, points };
}

export function TrendChart({
  readings,
  baseline,
  series,
  hiddenIds = [],
  primaryId = "primary",
  primaryName = "Stasiun aktif",
  primaryColor = "#1f6b54",
}: TrendChartProps) {
  const [tip, setTip] = useState<TipState>(null);

  const primaryHidden = hiddenIds.includes(primaryId);
  const primaryData = primaryHidden ? [] : readings.slice(-48);
  const overlaySeries = (series ?? [])
    .filter((s) => !hiddenIds.includes(s.id) && s.readings.length >= 2)
    .map((s) => ({
      ...s,
      readings: s.readings.slice(-48),
    }));

  if (primaryData.length < 2 && overlaySeries.length === 0) {
    return (
      <div className="chart-empty">
        Data belum cukup untuk menampilkan tren. Aktifkan chip stasiun di atas.
      </div>
    );
  }

  const allValues: number[] = [
    ...primaryData.map((r) => r.ntu),
    ...overlaySeries.flatMap((s) => s.readings.map((r) => r.ntu)),
    baseline,
    25,
  ];
  const allTimestamps: number[] = [
    ...primaryData.map((r) => r.timestamp),
    ...overlaySeries.flatMap((s) => s.readings.map((r) => r.timestamp)),
  ];
  const min = Math.max(0, Math.min(...allValues) - 4);
  const max = Math.max(...allValues, 50) + 5;
  const tMin = Math.min(...allTimestamps);
  const tMax = Math.max(...allTimestamps);
  const spanMs = Math.max(1, tMax - tMin);
  const yFor = (value: number) =>
    24 + (1 - (value - min) / Math.max(1, max - min)) * CHART_HEIGHT;

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

  const yTicks = [min, (min + max) / 2, max];

  return (
    <div
      className="trend-chart trend-chart-readable"
      aria-label="Grafik tren NTU multi-stasiun"
      onMouseLeave={() => setTip(null)}
    >
      {tip && (
        <div
          className="chart-tip"
          style={{
            left: `${(tip.x / WIDTH) * 100}%`,
            top: `${(tip.y / HEIGHT) * 100}%`,
          }}
          role="tooltip"
        >
          <strong>{tip.title}</strong>
          <div className="chart-tip-row">
            <span>
              <i style={{ background: tip.color }} />
              {tip.name}
            </span>
            <b>{formatNtu(tip.ntu)} NTU</b>
          </div>
        </div>
      )}
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img">
        {yTicks.map((v, i) => {
          const y = yFor(v);
          return (
            <g key={i}>
              <line x1={X0} x2={X1} y1={y} y2={y} className="chart-guide" />
              <text x={6} y={y + 3} className="chart-axis-label">
                {v.toFixed(0)}
              </text>
            </g>
          );
        })}

        <line
          x1={X0}
          x2={X1}
          y1={yFor(baseline)}
          y2={yFor(baseline)}
          className="chart-baseline"
        />
        <text
          x={X1 - 110}
          y={Math.max(14, yFor(baseline) - 5)}
          className="chart-anno chart-anno-base"
        >
          baseline {formatNtu(baseline)}
        </text>

        <line
          x1={X0}
          x2={X1}
          y1={yFor(25)}
          y2={yFor(25)}
          className="chart-threshold"
        />
        <text
          x={X1 - 72}
          y={Math.max(14, yFor(25) - 5)}
          className="chart-anno chart-anno-threshold"
        >
          ambang 25
        </text>

        {max > 48 && (
          <>
            <line
              x1={X0}
              x2={X1}
              y1={yFor(50)}
              y2={yFor(50)}
              className="chart-threshold high"
            />
            <text
              x={X1 - 28}
              y={Math.max(14, yFor(50) - 5)}
              className="chart-anno chart-anno-threshold-high"
            >
              50
            </text>
          </>
        )}

        {overlays.map((s) => (
          <g key={s.id} className="chart-series-overlay">
            <path
              d={s.path}
              className="chart-line chart-line-overlay"
              style={{ stroke: s.color }}
            />
            {s.points.map((point, index) => (
              <circle
                key={`${s.id}-${index}`}
                cx={point.x}
                cy={point.y}
                r={index === s.points.length - 1 ? 4.5 : 3.2}
                fill={s.color}
                stroke="#fffdf8"
                strokeWidth={2}
                className="chart-hit"
                onMouseEnter={() =>
                  setTip({
                    x: point.x,
                    y: point.y,
                    title: formatDateTime(point.ts),
                    name: s.name,
                    color: s.color,
                    ntu: point.ntu,
                  })
                }
              />
            ))}
          </g>
        ))}

        {primary.path && (
          <g className="chart-series-primary">
            <path d={primary.path} className="chart-line" style={{ stroke: primaryColor }} />
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
                  key={`p-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={
                    index === primary.points.length - 1 || anomaly ? 5 : 3.4
                  }
                  className={`chart-point chart-hit ${index === primary.points.length - 1 ? "active" : ""} ${anomaly ? "anomaly" : ""}`}
                  onMouseEnter={() =>
                    setTip({
                      x: point.x,
                      y: point.y,
                      title: formatDateTime(point.ts),
                      name: primaryName,
                      color: primaryColor,
                      ntu: point.ntu,
                    })
                  }
                />
              );
            })}
          </g>
        )}

        <text x={X0} y={210} className="chart-axis-label">
          {shortAxisLabel(tMin, spanMs)}
        </text>
        <text x={X1 - 70} y={210} className="chart-axis-label">
          {shortAxisLabel(tMax, spanMs)}
        </text>
        <text x={X0} y={226} className="chart-axis-hint">
          NTU · semakin tinggi = semakin keruh
        </text>
      </svg>
    </div>
  );
}
