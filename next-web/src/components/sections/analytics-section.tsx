"use client";

import { useMemo, useState } from "react";
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
import { TrendChart, type ChartSeries } from "@/components/trend-chart";

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
const OVERLAY_COLORS = ["#2f6fed", "#c4622d", "#7c3aed", "#0d9488"];
const PRIMARY_COLOR = "#1f6b54";

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

function stationHistoryInRange(
  stationId: string,
  history: History,
  rangeAnchor: number,
  timeRange: TimeRange,
): Reading[] {
  const all = history[stationId] ?? [];
  const filtered = all.filter(
    (reading) => reading.timestamp >= rangeAnchor - RANGE_MS[timeRange],
  );
  return filtered.length >= 2 ? filtered : all.slice(-Math.min(2, all.length));
}

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
  const latest = displayRangeHistory[displayRangeHistory.length - 1];
  const latestLabel = latest ? formatDateTime(latest.timestamp) : "—";
  const [exportState, setExportState] = useState<"idle" | "loading" | "done">("idle");
  const [chartMode, setChartMode] = useState<"line" | "bar">("line");
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  const overlaySeries = useMemo<ChartSeries[]>(() => {
    const others = comparisonStations.filter(
      (station) => station.id !== activeStation.id,
    );
    return others.map((station, index) => ({
      id: station.id,
      name: station.name,
      color: OVERLAY_COLORS[index % OVERLAY_COLORS.length],
      readings: stationHistoryInRange(
        station.id,
        history,
        rangeAnchor,
        timeRange,
      ),
    }));
  }, [activeStation.id, comparisonStations, history, rangeAnchor, timeRange]);

  type Chip = {
    id: string;
    name: string;
    color: string;
    ntu: number;
    avg: number;
  };

  const chips = useMemo<Chip[]>(() => {
    const primary: Chip = {
      id: activeStation.id,
      name: activeStation.name,
      color: PRIMARY_COLOR,
      ntu: activeStation.ntu,
      avg: stationAverageInRange(
        activeStation,
        history,
        rangeAnchor,
        timeRange,
      ),
    };
    const others = overlaySeries.map((s) => {
      const station =
        comparisonStations.find((c) => c.id === s.id) ??
        stations.find((c) => c.id === s.id);
      return {
        id: s.id,
        name: s.name,
        color: s.color,
        ntu: station?.ntu ?? s.readings[s.readings.length - 1]?.ntu ?? 0,
        avg: station
          ? stationAverageInRange(station, history, rangeAnchor, timeRange)
          : 0,
      };
    });
    return [primary, ...others];
  }, [
    activeStation,
    comparisonStations,
    history,
    overlaySeries,
    rangeAnchor,
    stations,
    timeRange,
  ]);

  const insightsBlock = useMemo(() => {
    if (chips.length === 0) return null;
    const sorted = [...chips].sort((a, b) => a.avg - b.avg);
    const clearest = sorted[0];
    const murkiest = sorted[sorted.length - 1];
    const gap = murkiest.avg - clearest.avg;
    const overThreshold = chips.filter((c) => c.avg > 25);
    return {
      clearest,
      murkiest,
      gap,
      overThreshold,
    };
  }, [chips]);

  const barRows = useMemo(() => {
    const rows = chips.map((c) => ({ ...c }));
    const maxAvg = Math.max(...rows.map((r) => r.avg), 1);
    return rows
      .sort((a, b) => b.avg - a.avg)
      .map((r) => ({ ...r, pct: (r.avg / maxAvg) * 100 }));
  }, [chips]);

  function toggleHidden(id: string) {
    setHiddenIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

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
                <span className="analytics-export-check" aria-hidden="true">
                  ✓
                </span>
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
                ? ((rangeMin - activeStation.baseline) / activeStation.baseline) *
                    100
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
                ? ((rangeMax - activeStation.baseline) / activeStation.baseline) *
                    100
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
          <div>
            <h2>Tren kekeruhan (NTU)</h2>
            <p className="analytics-card-sub">
              {TIME_RANGE_LABELS[timeRange]} · hover titik untuk detail · klik chip
              untuk tampil/sembunyi
            </p>
          </div>
          <div className="analytics-segment" role="group" aria-label="Mode grafik">
            <button
              type="button"
              className={chartMode === "line" ? "is-on" : undefined}
              onClick={() => setChartMode("line")}
            >
              Garis tren
            </button>
            <button
              type="button"
              className={chartMode === "bar" ? "is-on" : undefined}
              onClick={() => setChartMode("bar")}
            >
              Perbandingan
            </button>
          </div>
        </div>

        <div className="analytics-series-chips">
          {chips.map((chip) => {
            const on = !hiddenIds.includes(chip.id);
            return (
              <button
                type="button"
                key={chip.id}
                className={`analytics-series-chip${on ? " is-on" : " is-off"}`}
                style={{ ["--chip-c" as string]: chip.color }}
                onClick={() => toggleHidden(chip.id)}
                aria-pressed={on}
              >
                <i className="analytics-series-dot" aria-hidden="true" />
                <span className="analytics-series-name">{chip.name}</span>
                <strong>{formatNtu(chip.ntu)}</strong>
                <small>NTU</small>
              </button>
            );
          })}
        </div>

        {chartMode === "line" ? (
          <>
            <TrendChart
              readings={displayRangeHistory}
              baseline={activeStation.baseline}
              series={overlaySeries}
              hiddenIds={hiddenIds}
              primaryId={activeStation.id}
              primaryName={activeStation.name}
              primaryColor={PRIMARY_COLOR}
            />
            {insightsBlock && (
              <div className="analytics-insight-row">
                <article>
                  <label>Paling jernih</label>
                  <strong>{insightsBlock.clearest.name}</strong>
                  <em className="is-good">
                    Rata-rata {formatNtu(insightsBlock.clearest.avg)} NTU
                    {insightsBlock.clearest.avg <= 25
                      ? " · di bawah ambang"
                      : ""}
                  </em>
                </article>
                <article>
                  <label>Perlu perhatian</label>
                  <strong>{insightsBlock.murkiest.name}</strong>
                  <em
                    className={
                      insightsBlock.murkiest.avg > 25 ? "is-warn" : undefined
                    }
                  >
                    Rata-rata {formatNtu(insightsBlock.murkiest.avg)} NTU
                    {insightsBlock.murkiest.avg > 25
                      ? " · di atas ambang 25"
                      : " · masih di bawah ambang"}
                  </em>
                </article>
                <article>
                  <label>Selisih terbesar</label>
                  <strong>
                    {insightsBlock.murkiest.name.split(" ")[0]} vs{" "}
                    {insightsBlock.clearest.name.split(" ")[0]}
                  </strong>
                  <em>
                    {formatNtu(insightsBlock.gap)} NTU dalam{" "}
                    {TIME_RANGE_LABELS[timeRange]}
                  </em>
                </article>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="analytics-bar-lead">
              Rata-rata NTU · {TIME_RANGE_LABELS[timeRange]} — bar relatif ke
              stasiun paling keruh di set yang ditampilkan.
            </p>
            <div className="analytics-bar-list">
              {barRows
                .filter((row) => !hiddenIds.includes(row.id))
                .map((row) => (
                  <div className="analytics-bar-row" key={row.id}>
                    <div className="analytics-bar-name">
                      <i style={{ background: row.color }} />
                      {row.name}
                    </div>
                    <div className="analytics-bar-track">
                      <span
                        style={{
                          width: `${Math.max(6, row.pct)}%`,
                          background: row.color,
                        }}
                      />
                    </div>
                    <div className="analytics-bar-val">{formatNtu(row.avg)}</div>
                  </div>
                ))}
            </div>
            {insightsBlock && (
              <div className="analytics-insight-row">
                <article>
                  <label>Ambang 25 NTU</label>
                  <strong>
                    {insightsBlock.overThreshold.length} dari {chips.length} di
                    atas
                  </strong>
                  <em
                    className={
                      insightsBlock.overThreshold.length ? "is-warn" : "is-good"
                    }
                  >
                    {insightsBlock.overThreshold.length
                      ? insightsBlock.overThreshold
                          .map((s) => s.name)
                          .join(" · ")
                      : "Semua di bawah ambang"}
                  </em>
                </article>
                <article>
                  <label>Baseline aktif</label>
                  <strong>{formatNtu(activeStation.baseline)} NTU</strong>
                  <em>
                    Aktual {formatNtu(activeStation.ntu)} ·{" "}
                    {formatPercent(activeInsight.deviation)} vs baseline
                  </em>
                </article>
                <article>
                  <label>Rekomendasi</label>
                  <strong>Cek {insightsBlock.murkiest.name}</strong>
                  <em>Rata-rata tertinggi di set perbandingan</em>
                </article>
              </div>
            )}
          </>
        )}

        <p className="analytics-footnote">
          Chip mengontrol tampilan garis saja. Pilih stasiun di kartu bawah untuk
          menambah/mengurangi set perbandingan (maks. 3).
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
          const overlayColor =
            station.id === activeStation.id
              ? PRIMARY_COLOR
              : OVERLAY_COLORS[
                  Math.max(
                    0,
                    comparisonStations
                      .filter((s) => s.id !== activeStation.id)
                      .findIndex((s) => s.id === station.id),
                  ) % OVERLAY_COLORS.length
                ];
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
              <span className="analytics-compare-name">
                {selected && (
                  <i
                    className="analytics-compare-swatch"
                    style={{ background: overlayColor }}
                    aria-hidden="true"
                  />
                )}
                {station.name}
              </span>
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
        Pilih 1–3 stasiun. Stasiun aktif (hijau) + stasiun terpilih lain muncul di
        chip dan grafik di atas.
      </p>

      <section className="analytics-card analytics-history-card" aria-label="Riwayat">
        <div className="analytics-card-head">
          <h2>Riwayat pengukuran</h2>
          <span className="analytics-card-meta">Terbaru di atas · stasiun aktif</span>
        </div>
        <div className="analytics-history-list">
          {[...displayRangeHistory]
            .reverse()
            .slice(0, 10)
            .map((reading) => {
              const water = classifyNtu(reading.ntu);
              const severity = getSeverity(reading.ntu, activeStation.baseline);
              const isAlert = severity === "high" || severity === "critical";
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
