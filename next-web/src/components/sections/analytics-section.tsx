"use client";

import {
  classifyNtu,
  formatNtu,
  type Reading,
  type StationState,
} from "@/lib/jernih-data";
import type { History, StationInsight, TimeRange } from "@/lib/dashboard-types";
import {
  RANGE_MS,
  SEVERITY_META,
  formatDateTime,
  formatPercent,
  getSeverity,
} from "@/lib/dashboard-utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { TrendChart } from "@/components/trend-chart";

export type AnalyticsSectionProps = {
  stations: StationState[];
  insights: Record<string, StationInsight>;
  activeStation: StationState;
  activeInsight: StationInsight;
  timeRange: TimeRange;
  comparisonIds: string[];
  comparisonStations: StationState[];
  displayRangeHistory: Reading[];
  rangeAverage: number;
  rangeMin: number;
  rangeMax: number;
  history: History;
  rangeAnchor: number;
  onTimeRangeChange: (range: TimeRange) => void;
  onToggleComparison: (id: string) => void;
  onExportCsv: () => void;
};

const TIME_RANGES = ["24H", "7D", "30D", "90D"] as const;

export function AnalyticsSection({
  stations,
  insights,
  activeStation,
  activeInsight,
  timeRange,
  comparisonIds,
  comparisonStations,
  displayRangeHistory,
  rangeAverage,
  rangeMin,
  rangeMax,
  history,
  rangeAnchor,
  onTimeRangeChange,
  onToggleComparison,
  onExportCsv,
}: AnalyticsSectionProps) {
  return (
    <>
      <section className="intro">
        <h1>Analitik</h1>
        <p>Tren, perbandingan, dan ekspor data stasiun aktif.</p>
      </section>
      <div className="analytics-toolbar">
        <div className="range-pills">
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              className={timeRange === r ? "selected" : ""}
              onClick={() => onTimeRangeChange(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <button type="button" className="export-btn" onClick={onExportCsv}>
          Ekspor CSV
        </button>
      </div>
      <section className="surface-card">
        <div className="card-heading">
          <h2>{activeStation.name}</h2>
          <StatusBadge insight={activeInsight} />
        </div>
        <TrendChart readings={displayRangeHistory} baseline={activeStation.baseline} />
        <div className="range-stats">
          <span>Rata-rata {formatNtu(rangeAverage)}</span>
          <span>Min {formatNtu(rangeMin)}</span>
          <span>Max {formatNtu(rangeMax)}</span>
        </div>
      </section>
      <section className="surface-card">
        <div className="card-heading">
          <h2>Perbandingan stasiun</h2>
        </div>
        <div className="comparison-chips">
          {stations.map((station) => (
            <button
              type="button"
              key={station.id}
              className={comparisonIds.includes(station.id) ? "selected" : ""}
              onClick={() => onToggleComparison(station.id)}
            >
              <i style={{ background: insights[station.id].color }} />
              {station.name}
            </button>
          ))}
        </div>
        <div className="comparison-table">
          {comparisonStations.map((station) => {
            const stationHistory = (history[station.id] ?? []).filter(
              (reading) => reading.timestamp >= rangeAnchor - RANGE_MS[timeRange],
            );
            const values = stationHistory.length
              ? stationHistory.map((reading) => reading.ntu)
              : [station.ntu];
            const stationAverage =
              values.reduce((sum, value) => sum + value, 0) / values.length;
            return (
              <article key={station.id}>
                <div>
                  <span>{station.name}</span>
                  <StatusBadge insight={insights[station.id]} compact />
                </div>
                <strong>
                  {formatNtu(station.ntu)} <small>NTU</small>
                </strong>
                <p>
                  Rata-rata {formatNtu(stationAverage)} ·{" "}
                  {formatPercent(insights[station.id].deviation)} vs baseline
                </p>
              </article>
            );
          })}
        </div>
      </section>
      <section className="surface-card history-card">
        <div className="card-heading">
          <div>
            <h2>Riwayat pengukuran</h2>
            <p>
              Terbaru berada di urutan pertama. Alert aktif atau resolved berasal
              dari pola pembacaan yang tersedia.
            </p>
          </div>
        </div>
        {[...displayRangeHistory]
          .reverse()
          .slice(0, 10)
          .map((reading) => {
            const water = classifyNtu(reading.ntu);
            const severity = getSeverity(reading.ntu, activeStation.baseline);
            return (
              <div className="history-row" key={reading.id}>
                <i style={{ background: SEVERITY_META[severity].color }} />
                <span>
                  <strong>{formatDateTime(reading.timestamp)}</strong>
                  <small>
                    {reading.source === "manual" ? "Input manual" : "Simulasi"} ·{" "}
                    {reading.equipment}
                  </small>
                </span>
                <b>
                  {formatNtu(reading.ntu)} <small>NTU</small>
                </b>
                <em style={{ color: water.color }}>
                  {severity === "high" || severity === "critical"
                    ? `${SEVERITY_META[severity].label} · ${
                        severity ===
                        getSeverity(activeStation.ntu, activeStation.baseline)
                          ? "Aktif"
                          : "Resolved"
                      }`
                    : water.label}
                </em>
              </div>
            );
          })}
      </section>
    </>
  );
}
