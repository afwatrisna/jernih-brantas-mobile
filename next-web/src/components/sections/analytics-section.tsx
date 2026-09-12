"use client";

import { useState } from "react";
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

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  "24H": "24 jam",
  "7D": "7 hari",
  "30D": "30 hari",
  "90D": "90 hari",
};

const TIME_RANGES = ["24H", "7D", "30D", "90D"] as const;

function stationAverageInRange(
  station: StationState,
  history: History,
  rangeAnchor: number,
  timeRange: TimeRange,
): number {
  const stationHistory = (history[station.id] ?? []).filter(
    (reading) => reading.timestamp >= rangeAnchor - RANGE_MS[timeRange],
  );
  const values = stationHistory.length
    ? stationHistory.map((reading) => reading.ntu)
    : [station.ntu];
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function AnalyticsSection({
  stations,
  insights,
  activeStation,
  activeInsight,
  timeRange,
  comparisonIds,
  comparisonStations: _comparisonStations,
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
  const latest = displayRangeHistory[displayRangeHistory.length - 1];
  const latestLabel = latest ? formatDateTime(latest.timestamp) : "—";
  const [exportState, setExportState] = useState<"idle" | "loading" | "done">("idle");

  const handleExport = () => {
    if (exportState === "loading") return;
    setExportState("loading");
    window.setTimeout(() => {
      onExportCsv();
      setExportState("done");
      window.setTimeout(() => setExportState("idle"), 1800);
    }, 420);
  };

  return (
    <div className="analytics-page">
      <header className="analytics-page-head">
        <div>
          <h1>Analitik</h1>
          <p>Tren kekeruhan, perbandingan stasiun, dan ekspor data stasiun aktif.</p>
        </div>
        <div className="analytics-head-actions">
          <div className="analytics-segment" role="group" aria-label="Rentang waktu">
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                type="button"
                className={timeRange === range ? "is-on" : undefined}
                onClick={() => onTimeRangeChange(range)}
              >
                {TIME_RANGE_LABELS[range]}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`analytics-export-btn${exportState === "loading" ? " is-loading" : ""}${exportState === "done" ? " is-done" : ""}`}
            onClick={handleExport}
            disabled={exportState === "loading"}
            aria-live="polite"
          >
            {exportState === "loading" ? (
              <>
                <span className="analytics-export-spinner" aria-hidden="true" />
                Menyiapkan…
              </>
            ) : exportState === "done" ? (
              <>
                <span className="analytics-export-check" aria-hidden="true">✓</span>
                Tersimpan
              </>
            ) : (
              <>
                <span aria-hidden="true">↓</span>
                Ekspor CSV
              </>
            )}
          </button>
        </div>
      </header>

      <div className="analytics-station-strip">
        <div className="analytics-station-chip">
          <span
            className="analytics-station-dot"
            style={{ background: activeInsight.color }}
            aria-hidden="true"
          />
          <div>
            <strong>{activeStation.name}</strong>
            <span>
              ID · {activeStation.id} · pembacaan {latestLabel}
            </span>
          </div>
        </div>
        <div className="analytics-station-meta">
          <span
            className="analytics-meta-pill"
            style={{
              background: activeInsight.softColor,
              color: activeInsight.color,
            }}
          >
            {activeInsight.label} · {formatNtu(activeStation.ntu)} NTU
          </span>
          <span className="analytics-meta-pill is-neutral">
            {latest?.source === "manual" ? "Input manual" : "Simulasi demo"}
          </span>
        </div>
      </div>

      <div className="analytics-kpi-row">
        <div className="analytics-kpi">
          <label>Rata-rata</label>
          <strong>{formatNtu(rangeAverage)}</strong>
          <em>NTU · {TIME_RANGE_LABELS[timeRange]}</em>
        </div>
        <div className="analytics-kpi">
          <label>Minimum</label>
          <strong>{formatNtu(rangeMin)}</strong>
          <em>
            {formatPercent(
              activeStation.baseline
                ? ((rangeMin - activeStation.baseline) / activeStation.baseline) * 100
                : 0,
            )}{" "}
            vs baseline
          </em>
        </div>
        <div className="analytics-kpi">
          <label>Maksimum</label>
          <strong>{formatNtu(rangeMax)}</strong>
          <em>
            {formatPercent(
              activeStation.baseline
                ? ((rangeMax - activeStation.baseline) / activeStation.baseline) * 100
                : 0,
            )}{" "}
            vs baseline
          </em>
        </div>
        <div className="analytics-kpi">
          <label>Baseline</label>
          <strong>{formatNtu(activeStation.baseline)}</strong>
          <em>referensi stasiun</em>
        </div>
      </div>

      <section className="analytics-card" aria-label="Grafik tren">
        <div className="analytics-card-head">
          <h2>Tren NTU · {activeStation.name}</h2>
          <div className="analytics-legend">
            <span>
              <i className="is-val" />
              Pembacaan
            </span>
            <span>
              <i className="is-base" />
              Baseline
            </span>
            <span>
              <i className="is-anom" />
              Anomali
            </span>
          </div>
        </div>
        <TrendChart readings={displayRangeHistory} baseline={activeStation.baseline} />
        <p className="analytics-footnote">
          Anomali ditandai jika deviasi signifikan dari baseline atau pola pembacaan
          stasiun.
        </p>
      </section>

      <p className="analytics-section-label">Perbandingan stasiun</p>
      <div className="analytics-compare-grid">
        {stations.map((station) => {
          const insight = insights[station.id];
          const selected = comparisonIds.includes(station.id);
          const avg = stationAverageInRange(
            station,
            history,
            rangeAnchor,
            timeRange,
          );
          return (
            <button
              type="button"
              key={station.id}
              className={`analytics-compare-card${selected ? " is-selected" : ""}`}
              onClick={() => onToggleComparison(station.id)}
              aria-pressed={selected}
            >
              <span
                className="analytics-compare-badge"
                style={{
                  background: insight.softColor,
                  color: insight.color,
                }}
              >
                {insight.label}
              </span>
              <span className="analytics-compare-name">{station.name}</span>
              <span className="analytics-compare-ntu">
                {formatNtu(station.ntu)}
                <small>NTU</small>
              </span>
              <span className="analytics-compare-delta">
                Rata-rata {formatNtu(avg)} · {formatPercent(insight.deviation)} vs
                baseline
              </span>
              <span className="analytics-compare-check" aria-hidden="true">
                {selected ? "✓" : ""}
              </span>
            </button>
          );
        })}
      </div>
      <p className="analytics-footnote">
        Pilih stasiun untuk menandai perbandingan (maksimal sesuai logika yang ada).
      </p>

      <section className="analytics-card analytics-history-card" aria-label="Riwayat">
        <div className="analytics-card-head">
          <h2>Riwayat pengukuran</h2>
          <span className="analytics-card-meta">Terbaru di atas</span>
        </div>
        <div className="analytics-history-list">
          {[...displayRangeHistory]
            .reverse()
            .slice(0, 10)
            .map((reading) => {
              const water = classifyNtu(reading.ntu);
              const severity = getSeverity(reading.ntu, activeStation.baseline);
              const isAlert =
                severity === "high" || severity === "critical";
              const tagLabel = isAlert
                ? `${SEVERITY_META[severity].label} · ${
                    severity ===
                    getSeverity(activeStation.ntu, activeStation.baseline)
                      ? "Aktif"
                      : "Resolved"
                  }`
                : water.label;
              return (
                <div className="analytics-history-row" key={reading.id}>
                  <i
                    className="analytics-history-bar"
                    style={{ background: SEVERITY_META[severity].color }}
                  />
                  <div className="analytics-history-when">
                    <strong>{formatDateTime(reading.timestamp)}</strong>
                    <small>
                      {reading.source === "manual" ? "Input manual" : "Simulasi"} ·{" "}
                      {reading.equipment}
                    </small>
                  </div>
                  <div className="analytics-history-val">
                    {formatNtu(reading.ntu)}
                    <small>NTU</small>
                  </div>
                  <span
                    className="analytics-history-tag"
                    style={{
                      background: SEVERITY_META[severity].softColor,
                      color: SEVERITY_META[severity].color,
                    }}
                  >
                    {tagLabel}
                  </span>
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
}
