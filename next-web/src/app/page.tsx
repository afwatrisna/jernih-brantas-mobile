"use client";

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import {
  EQUIPMENT,
  NTU_PLAIN_EXPLANATION,
  WATER_CLASS_PLAIN_LABEL,
  classifyNtu,
  formatNtu,
  formatTime,
  initialStationStates,
  type Reading,
  type ReadingSource,
  type StationState,
} from "../lib/jernih-data";
import { useSupabaseReadings, type SupabaseReading } from "../hooks/useSupabaseReadings";
import { useFieldModeAccess } from "../hooks/useFieldModeAccess";
import { createAuthenticatedManualReading } from "../lib/readings-client";
import { AssistantPanel } from "../components/assistant-panel";

function toReading(row: SupabaseReading): Reading {
  return {
    id: row.id,
    ntu: Number(row.ntu),
    timestamp: new Date(row.created_at).getTime(),
    source: row.source,
    equipment: row.equipment,
  };
}

type Section = "monitor" | "field" | "analytics" | "settings";
type History = Record<string, Reading[]>;
type SourceByStation = Record<string, ReadingSource>;
type Severity = "normal" | "warning" | "high" | "critical";
type MapFilter = "all" | "normal" | "warning" | "alert" | "anomaly";
type TimeRange = "24H" | "7D" | "30D" | "90D";
type AlertState = "active" | "resolved" | "none";

type StationInsight = {
  severity: Severity;
  label: string;
  color: string;
  softColor: string;
  deviation: number;
  anomaly: string | null;
  alertState: AlertState;
};

const STORAGE_KEY = "jernih-next-dashboard-v2";
const MAX_HISTORY = 160;
const RANGE_MS: Record<TimeRange, number> = {
  "24H": 24 * 60 * 60 * 1000,
  "7D": 7 * 24 * 60 * 60 * 1000,
  "30D": 30 * 24 * 60 * 60 * 1000,
  "90D": 90 * 24 * 60 * 60 * 1000,
};

const SEVERITY_META: Record<Severity, Pick<StationInsight, "label" | "color" | "softColor">> = {
  normal: { label: "Normal", color: "#2D6A5C", softColor: "#DCEBE5" },
  warning: { label: "Warning", color: "#A27719", softColor: "#F5ECD0" },
  high: { label: "High", color: "#C4622D", softColor: "#F6E2D6" },
  critical: { label: "Critical", color: "#8B3A1F", softColor: "#F0D9D0" },
};

function makeReading(ntu: number, source: ReadingSource, equipment: string, timestamp = Date.now()): Reading {
  return {
    id: `${timestamp}-${Math.random().toString(36).slice(2, 7)}`,
    ntu: Math.round(ntu * 10) / 10,
    timestamp,
    source,
    equipment,
  };
}

function seedHistory(stations: StationState[]): History {
  const now = Date.now();
  const ninetyDays = RANGE_MS["90D"];
  return Object.fromEntries(
    stations.map((station, stationIndex) => {
      const archive = Array.from({ length: 48 }, (_, index) => {
        const age = ((48 - index) / 48) * ninetyDays;
        const seasonal = Math.sin(index * 0.78 + stationIndex) * (1.8 + stationIndex * 0.35);
        const variation = ((index + stationIndex * 2) % 5 - 2) * 0.38;
        const demoSpike = station.id === "mojokerto" && index === 43 ? 19 : 0;
        return makeReading(Math.max(1, station.baseline + seasonal + variation + demoSpike), "simulation", "Arsip demo (simulasi)", now - age);
      });
      const recent = [-3, -2, -1, 0].map((index) => makeReading(station.baseline + index * 0.6, "simulation", "NTU-Logger demo", now + index * 4_000));
      return [station.id, [...archive, ...recent]];
    }),
  );
}

function trustCopy(source: ReadingSource, simulation: boolean) {
  if (source === "manual") {
    return {
      label: "INPUT MANUAL",
      detail: "Perlu verifikasi lapangan",
      note: "Pembacaan manual perlu dibandingkan dengan alat referensi sebelum dipublikasikan.",
    };
  }
  if (source === "sensor") {
    return { label: "SENSOR", detail: "Siap ditinjau", note: "Pembacaan berasal dari perangkat sensor yang terhubung." };
  }
  return {
    label: simulation ? "SIMULASI" : "SIMULASI DIJEDA",
    detail: "Perlu verifikasi",
    note: "Nilai simulasi berguna untuk demo alur kerja; bukan data lingkungan resmi.",
  };
}

function formatDateTime(timestamp: number) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(timestamp);
}

function formatPercent(value: number) {
  const rounded = Math.round(value);
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}

function getSeverity(ntu: number, baseline: number): Severity {
  const deviation = ((ntu - baseline) / Math.max(1, baseline)) * 100;
  if (ntu >= 75 || deviation >= 190) return "critical";
  if (ntu >= 50 || deviation >= 100) return "high";
  if (ntu > 25 || deviation >= 60) return "warning";
  return "normal";
}

function getStationInsight(station: StationState, readings: Reading[]): StationInsight {
  const deviation = ((station.ntu - station.baseline) / Math.max(1, station.baseline)) * 100;
  const severity = getSeverity(station.ntu, station.baseline);
  const recent = readings.slice(-4);
  const rapidChange = recent.length >= 3 && recent[recent.length - 1].ntu - recent[0].ntu >= Math.max(12, station.baseline * 0.55);
  const persistent = recent.length >= 3 && recent.slice(-3).every((reading) => reading.ntu > Math.max(25, station.baseline * 1.4));
  const baselineDeviation = deviation >= 60;
  const anomaly = rapidChange ? "Kenaikan cepat" : persistent ? "Abnormal berlanjut" : baselineDeviation ? "Menyimpang dari baseline" : null;
  const hadAlert = readings.some((reading) => {
    const readingSeverity = getSeverity(reading.ntu, station.baseline);
    return readingSeverity === "high" || readingSeverity === "critical";
  });
  const alertState: AlertState = severity === "high" || severity === "critical" ? "active" : hadAlert ? "resolved" : "none";
  return { severity, ...SEVERITY_META[severity], deviation, anomaly, alertState };
}

function getConditionCopy(insight: StationInsight) {
  if (insight.severity === "critical") return { title: "Kondisi: sangat perlu ditinjau.", detail: "Nilai berada jauh di atas baseline dan perlu verifikasi lapangan." };
  if (insight.severity === "high") return { title: "Kondisi: perlu ditinjau.", detail: "Nilai melewati ambang perhatian dan perlu verifikasi lapangan." };
  if (insight.severity === "warning") return { title: "Kondisi: perlu diperhatikan.", detail: "Air agak lebih keruh dari biasanya." };
  return { title: "Kondisi: dalam pola normal.", detail: "Nilai masih berada di sekitar baseline stasiun." };
}

function Icon({ name }: { name: "grid" | "field" | "chart" | "settings" | "water" | "map" | "plus" | "check" | "restart" | "shield" | "database" | "alert" | "trend" | "download" }) {
  const map: Record<string, string> = {
    grid: "▦",
    field: "☷",
    chart: "⌁",
    settings: "⚙",
    water: "◒",
    map: "⌖",
    plus: "+",
    check: "✓",
    restart: "↻",
    shield: "◈",
    database: "▤",
    alert: "⚠",
    trend: "↗",
    download: "⇩",
  };
  return <span className={`icon icon-${name}`} aria-hidden="true">{map[name]}</span>;
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: Parameters<typeof Icon>[0]["name"]; label: string; onClick: () => void }) {
  return (
    <button type="button" className={`nav-button ${active ? "is-active" : ""}`} onClick={onClick} aria-current={active ? "page" : undefined}>
      <Icon name={icon} />
      <span>{label}</span>
    </button>
  );
}

function StatusBadge({ insight, compact = false }: { insight: StationInsight; compact?: boolean }) {
  return <span className={`status-badge ${compact ? "compact" : ""} severity-${insight.severity}`}><i />{insight.label}</span>;
}

function DataTrust({ source, simulation, updatedAt, equipment }: { source: ReadingSource; simulation: boolean; updatedAt: number; equipment: string }) {
  const trust = trustCopy(source, simulation);
  const isManual = source === "manual";
  return (
    <section className="trust-strip" aria-label="Status kepercayaan data" aria-live="polite">
      <div className="trust-heading">
        <span className="trust-title"><Icon name="shield" /> DATA TRUST</span>
        <span className={`source-pill ${isManual ? "manual" : "simulation"}`}><i />{trust.label}</span>
      </div>
      <div className="trust-grid">
        <div><span>PEMBARUAN</span><strong>{formatTime(updatedAt)} WIB</strong></div>
        <div><span>SUMBER</span><strong>{equipment}</strong></div>
        <div><span>VALIDASI</span><strong className={isManual || source === "simulation" ? "warning" : "good"}>{trust.detail}</strong></div>
        <div><span>PENYIMPANAN</span><strong>Supabase + demo lokal</strong></div>
      </div>
      <p>{trust.note}</p>
    </section>
  );
}

function RiverMap({
  stations,
  insights,
  activeId,
  filter,
  onFilter,
  onSelect,
  onOpenAnalytics,
}: {
  stations: StationState[];
  insights: Record<string, StationInsight>;
  activeId: string;
  filter: MapFilter;
  onFilter: (filter: MapFilter) => void;
  onSelect: (id: string) => void;
  onOpenAnalytics: () => void;
}) {
  const selected = stations.find((station) => station.id === activeId) ?? stations[0];
  const insight = insights[selected.id];
  const visibleStations = stations.filter((station) => {
    const status = insights[station.id];
    if (filter === "normal") return status.severity === "normal";
    if (filter === "warning") return status.severity === "warning";
    if (filter === "alert") return status.alertState === "active";
    if (filter === "anomaly") return Boolean(status.anomaly);
    return true;
  });
  return (
    <section className="surface-card map-card">
      <div className="card-heading"><div><h2>Aliran & titik pantau</h2><p>Marker menampilkan status, alert aktif, dan pola yang tidak biasa.</p></div><Icon name="map" /></div>
      <div className="map-filter" aria-label="Filter status peta">
        {(["all", "normal", "warning", "alert", "anomaly"] as MapFilter[]).map((item) => <button key={item} type="button" className={filter === item ? "active" : ""} onClick={() => onFilter(item)}>{item === "all" ? "Semua" : item === "alert" ? "Alert" : item === "anomaly" ? "Anomali" : item === "normal" ? "Normal" : "Warning"}</button>)}
      </div>
      <div className="river-map" aria-label="Peta ilustratif titik pantau Sungai Brantas">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M 13 17 C 20 25, 24 33, 29 38 C 36 44, 41 50, 47 54 C 54 59, 57 65, 62 68 C 69 72, 75 78, 81 82" />
          <path className="river-highlight" d="M 13 17 C 20 25, 24 33, 29 38 C 36 44, 41 50, 47 54 C 54 59, 57 65, 62 68 C 69 72, 75 78, 81 82" />
          <text x="6" y="12" className="river-direction">HULU</text><text x="94" y="94" textAnchor="end" className="river-direction">HILIR</text>
        </svg>
        {visibleStations.map((station) => {
          const stationInsight = insights[station.id];
          return <button key={station.id} className={`map-marker ${station.id === activeId ? "selected" : ""} severity-${stationInsight.severity} ${stationInsight.anomaly ? "has-anomaly" : ""}`} onClick={() => onSelect(station.id)} style={{ left: `${station.x}%`, top: `${station.y}%`, "--marker": stationInsight.color } as CSSProperties} aria-label={`${station.name}: ${formatNtu(station.ntu)} NTU, ${stationInsight.label}`} />;
        })}
        {visibleStations.length === 0 && <p className="map-empty">Tidak ada stasiun pada filter ini.</p>}
      </div>
      <div className="map-selection"><div className="map-tooltip-heading"><div><span>STASIUN DIPILIH</span><strong>{selected.name}</strong></div><StatusBadge insight={insight} compact /></div><p>{formatNtu(selected.ntu)} NTU · {formatPercent(insight.deviation)} vs baseline{insight.alertState === "active" ? " · 1 alert aktif" : ""}{insight.anomaly ? ` · ${insight.anomaly}` : ""}</p><button type="button" onClick={onOpenAnalytics}>Lihat analitik →</button></div>
    </section>
  );
}

function TrendChart({ readings, baseline }: { readings: Reading[]; baseline: number }) {
  const data = readings.slice(-48);
  if (data.length < 2) return <div className="chart-empty">Data belum cukup untuk menampilkan tren.</div>;
  const values = data.map((reading) => reading.ntu);
  const min = Math.max(0, Math.min(...values, baseline, 25) - 4);
  const max = Math.max(...values, baseline, 50) + 5;
  const width = 600;
  const height = 210;
  const chartHeight = 145;
  const yFor = (value: number) => 20 + (1 - (value - min) / Math.max(1, max - min)) * chartHeight;
  const points = values.map((value, index) => ({ x: 38 + (index / (values.length - 1)) * 530, y: yFor(value) }));
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
  return (
    <div className="trend-chart" aria-label="Grafik tren NTU dengan baseline, ambang, dan penanda anomali">
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        {[20, 92, 165].map((y) => <line key={y} x1="38" x2="568" y1={y} y2={y} className="chart-guide" />)}
        <line x1="38" x2="568" y1={yFor(baseline)} y2={yFor(baseline)} className="chart-baseline" /><text x="474" y={Math.max(16, yFor(baseline) - 4)}>baseline {formatNtu(baseline)}</text>
        <line x1="38" x2="568" y1={yFor(25)} y2={yFor(25)} className="chart-threshold" /><text x="526" y={Math.max(16, yFor(25) - 4)}>25</text>
        <line x1="38" x2="568" y1={yFor(50)} y2={yFor(50)} className="chart-threshold high" /><text x="526" y={Math.max(16, yFor(50) - 4)}>50</text>
        <text x="4" y="24">{max.toFixed(0)}</text><text x="4" y="96">{((max + min) / 2).toFixed(0)}</text><text x="15" y="169">{min.toFixed(0)}</text>
        <path d={line} className="chart-line" />
        {points.map((point, index) => {
          const severity = getSeverity(data[index].ntu, baseline);
          const anomaly = severity === "high" || severity === "critical" || data[index].ntu > baseline * 1.6;
          return <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r={index === points.length - 1 || anomaly ? 5 : 3.4} className={`chart-point ${index === points.length - 1 ? "active" : ""} ${anomaly ? "anomaly" : ""}`} />;
        })}
        <text x="38" y="198">{formatDateTime(data[0].timestamp)}</text><text x="470" y="198">{formatDateTime(data[data.length - 1].timestamp)}</text>
      </svg>
      <div className="chart-legend"><span><i className="baseline" />Baseline</span><span><i className="threshold" />Ambang</span><span><i className="anomaly" />Anomali</span></div>
    </div>
  );
}

function AlertPanel({
  stations,
  insights,
  onSelect,
  onAnalytics,
}: {
  stations: StationState[];
  insights: Record<string, StationInsight>;
  onSelect: (id: string) => void;
  onAnalytics: (id?: string) => void;
}) {
  const activeAlerts = stations.filter((station) => insights[station.id].alertState === "active");
  const resolvedAlerts = stations.filter((station) => insights[station.id].alertState === "resolved");
  const anomalyStations = stations.filter((station) => insights[station.id].anomaly);
  const priority = activeAlerts[0] ?? anomalyStations[0];
  return (
    <div className="insight-grid">
      <section className={`alert-card ${priority ? `severity-${insights[priority.id].severity}` : "normal"}`}>
        <div className="alert-heading"><span><Icon name="alert" /> PERINGATAN DINI</span>{priority ? <StatusBadge insight={insights[priority.id]} compact /> : <span className="quiet-label">Tidak ada alert aktif</span>}</div>
        {priority ? <><h2>{insights[priority.id].alertState === "active" ? `${insights[priority.id].label.toUpperCase()} · KEKERUHAN` : "PERUBAHAN TIDAK BIASA"}</h2><strong>{priority.name}</strong><div className="alert-number">{formatNtu(priority.ntu)} <small>NTU</small></div><p>Baseline {formatNtu(priority.baseline)} NTU · {formatPercent(insights[priority.id].deviation)} · {insights[priority.id].anomaly ?? "Nilai perlu ditinjau"}</p><p className="alert-plain-explainer">Artinya: air di titik ini lebih keruh dari kondisi biasanya (baseline). Ini belum tentu berarti tercemar — bisa karena hujan atau sedimen — dan tetap perlu dicek petugas untuk kepastian.</p><div className="alert-actions"><button type="button" onClick={() => onSelect(priority.id)}>Lihat stasiun</button><button type="button" onClick={() => onAnalytics(priority.id)}>Riwayat →</button></div></> : <><h2>Semua terkendali</h2><p>Sistem akan menandai kenaikan cepat, penyimpangan baseline, dan status High/Critical ketika data simulasi atau input manual berubah.</p></>}
        {resolvedAlerts.length > 0 && <small className="resolved-note">{resolvedAlerts.length} alert sebelumnya berstatus Resolved setelah pembacaan kembali normal.</small>}
      </section>
      <section className="anomaly-card surface-card">
        <div className="card-heading"><div><h2>Deteksi anomali</h2><p>Pola tidak biasa, bukan penetapan pencemaran.</p></div><Icon name="trend" /></div>
        {anomalyStations.length > 0 ? <div className="anomaly-summary"><span>POLA TIDAK BIASA</span><strong>{anomalyStations[0].name}</strong><p>{anomalyStations[0] && insights[anomalyStations[0].id].anomaly} · deviasi {formatPercent(insights[anomalyStations[0].id].deviation)} dari baseline.</p><button type="button" onClick={() => onAnalytics(anomalyStations[0].id)}>Buka data historis →</button></div> : <div className="anomaly-summary quiet"><span>POLA NORMAL</span><strong>Belum ada anomali</strong><p>Ambang akan ditinjau kembali setiap pembacaan baru.</p></div>}
      </section>
    </div>
  );
}

export default function Home() {
  const defaultStations = useMemo(() => initialStationStates(), []);
  const [localStations, setLocalStations] = useState<StationState[]>(defaultStations);
  const { readings: supabaseReadings, loading: readingsLoading, refetch } = useSupabaseReadings();
  const [activeId, setActiveId] = useState("malang");
  const [section, setSection] = useState<Section>("monitor");
  const [simulation, setSimulation] = useState(false);
  const [demoDisplayMode, setDemoDisplayMode] = useState(false);
  const [sourceByStation, setSourceByStation] = useState<SourceByStation>(() => Object.fromEntries(defaultStations.map((station) => [station.id, "simulation"])) as SourceByStation);
  const [fieldStation, setFieldStation] = useState("malang");
  const [fieldNtu, setFieldNtu] = useState("");
  const [fieldEquipment, setFieldEquipment] = useState<(typeof EQUIPMENT)[number]>(EQUIPMENT[0]);
  const [fieldError, setFieldError] = useState("");
  const [fieldAuthEmail, setFieldAuthEmail] = useState("");
  const [fieldAuthMessage, setFieldAuthMessage] = useState("");
  const [fieldAuthSubmitting, setFieldAuthSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const [mapFilter, setMapFilter] = useState<MapFilter>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("24H");
  const [comparisonIds, setComparisonIds] = useState<string[]>(["malang", "mojokerto"]);
  const [rangeAnchor] = useState(() => Date.now());
  const fallbackHistory = useMemo(() => seedHistory(defaultStations), [defaultStations]);
  const history = useMemo<History>(() => {
    if (readingsLoading || supabaseReadings.length === 0) return fallbackHistory;
    const grouped = Object.fromEntries(defaultStations.map((station) => [station.id, [] as Reading[]])) as History;
    for (const row of supabaseReadings) {
      if (grouped[row.station_id]) grouped[row.station_id].push(toReading(row));
    }
    for (const stationId of Object.keys(grouped)) {
      grouped[stationId] = grouped[stationId].length > 0
        ? grouped[stationId].slice(-MAX_HISTORY)
        : fallbackHistory[stationId];
    }
    return grouped;
  }, [defaultStations, fallbackHistory, readingsLoading, supabaseReadings]);
  const hasRemoteReadings = supabaseReadings.length > 0;
  const displaySupabaseReadings = hasRemoteReadings && !demoDisplayMode;
  const recordCount = hasRemoteReadings ? supabaseReadings.length : 45;
  const remoteSourceByStation = useMemo(() => {
    const sources: Partial<SourceByStation> = {};
    for (const row of supabaseReadings) sources[row.station_id] = row.source;
    return sources;
  }, [supabaseReadings]);
  const stations = useMemo(
    () => localStations.map((station) => {
      const latestReading = displaySupabaseReadings ? history[station.id]?.at(-1) : undefined;
      return latestReading ? { ...station, ntu: latestReading.ntu } : station;
    }),
    [displaySupabaseReadings, history, localStations],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { activeId?: string; sourceByStation?: SourceByStation };
          if (parsed.activeId) setActiveId(parsed.activeId);
          if (parsed.sourceByStation) setSourceByStation(parsed.sourceByStation);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        setStorageReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeId, sourceByStation }));
  }, [activeId, sourceByStation, storageReady]);

  useEffect(() => {
    if (!simulation) return;
    const timer = window.setInterval(() => {
      setLocalStations((current) => {
        const next = current.map((station) => {
          const anomalyEvent = Math.random() < 0.035 ? 20 + Math.random() * 26 : 0;
          const measured = station.ntu + (Math.random() - 0.5) * 3 + anomalyEvent;
          const corrected = measured + (station.baseline - measured) * 0.05;
          return { ...station, ntu: Math.max(1, Math.round(corrected * 10) / 10) };
        });
        return next;
      });
      setSourceByStation(Object.fromEntries(defaultStations.map((station) => [station.id, "simulation"])) as SourceByStation);
    }, 4_000);
    return () => window.clearInterval(timer);
  }, [defaultStations, simulation]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const insights = useMemo(() => Object.fromEntries(stations.map((station) => [station.id, getStationInsight(station, history[station.id] ?? [])])) as Record<string, StationInsight>, [history, stations]);
  const activeStation = stations.find((station) => station.id === activeId) ?? stations[0];
  const activeHistory = history[activeStation.id] ?? [];
  const activeRangeHistory = activeHistory.filter((reading) => reading.timestamp >= rangeAnchor - RANGE_MS[timeRange]);
  const displayRangeHistory = activeRangeHistory.length >= 2 ? activeRangeHistory : activeHistory.slice(-2);
  const latest = activeHistory[activeHistory.length - 1];
  const updatedAt = latest?.timestamp ?? 0;
  const activeSource = demoDisplayMode ? "simulation" : remoteSourceByStation[activeStation.id] ?? sourceByStation[activeStation.id] ?? "simulation";
  const average = stations.reduce((sum, station) => sum + station.ntu, 0) / stations.length;
  const compliant = stations.filter((station) => station.ntu <= 25).length;
  const activeClass = classifyNtu(activeStation.ntu);
  const activeInsight = insights[activeStation.id];
  const activeCondition = getConditionCopy(activeInsight);
  const activeAlerts = stations.filter((station) => insights[station.id].alertState === "active").length;
  const selectedFieldStation = stations.find((station) => station.id === fieldStation) ?? activeStation;
  const fieldValue = Number.parseFloat(fieldNtu.replace(",", "."));
  const fieldClass = Number.isFinite(fieldValue) ? classifyNtu(fieldValue) : null;
  const { access: fieldAccess, loading: fieldAccessLoading, issue: fieldAccessIssue, requestMagicLink, signOut: signOutFieldMode } = useFieldModeAccess();
  const canWriteFieldMode = Boolean(
    fieldAccess
      && (fieldAccess.role === "admin" || (fieldAccess.role === "field_operator" && fieldAccess.stationIds.includes(fieldStation))),
  );
  const rangeValues = displayRangeHistory.map((reading) => reading.ntu);
  const rangeAverage = rangeValues.reduce((sum, value) => sum + value, 0) / Math.max(1, rangeValues.length);
  const rangeMin = Math.min(...rangeValues);
  const rangeMax = Math.max(...rangeValues);
  const comparisonStations = stations.filter((station) => comparisonIds.includes(station.id));

  function selectStation(id: string) {
    setActiveId(id);
    setFieldStation(id);
  }

  function openAnalytics(id?: string) {
    if (id) selectStation(id);
    setSection("analytics");
  }

  async function requestFieldModeAccess() {
    setFieldAuthSubmitting(true);
    setFieldAuthMessage("");
    try {
      await requestMagicLink(fieldAuthEmail);
      setFieldAuthMessage("Tautan masuk telah dikirim. Buka email tersebut, lalu kembali ke halaman Catat Hasil Ukur.");
    } catch (error) {
      setFieldAuthMessage(error instanceof Error ? error.message : "Tautan masuk tidak dapat dikirim.");
    } finally {
      setFieldAuthSubmitting(false);
    }
  }

  async function saveMeasurement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fieldAccess) {
      setFieldError("Masuk sebagai petugas yang ditugaskan sebelum menyimpan pengukuran.");
      return;
    }
    if (!canWriteFieldMode) {
      setFieldError(`Akun ini belum memiliki izin Catat Hasil Ukur untuk ${selectedFieldStation.name}.`);
      return;
    }
    if (!Number.isFinite(fieldValue) || fieldValue < 0 || fieldValue > 500) {
      setFieldError("Masukkan nilai antara 0 hingga 500 NTU.");
      return;
    }
    const nextSeverity = getSeverity(fieldValue, selectedFieldStation.baseline);
    try {
      await createAuthenticatedManualReading({
        station_id: fieldStation,
        ntu: fieldValue,
        equipment: fieldEquipment,
      });
      await refetch();
      setLocalStations((current) => current.map((station) => station.id === fieldStation ? { ...station, ntu: Math.round(fieldValue * 10) / 10 } : station));
      setSourceByStation((current) => ({ ...current, [fieldStation]: "manual" }));
      setSimulation(false);
      setActiveId(fieldStation);
      setFieldNtu("");
      setFieldError("");
      setToast(nextSeverity === "high" || nextSeverity === "critical" ? `Pengukuran lapangan disimpan. Alert ${SEVERITY_META[nextSeverity].label} aktif untuk ${selectedFieldStation.name}.` : `Pengukuran lapangan ${selectedFieldStation.name} berhasil disimpan ke Supabase.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan pengukuran.";
      setFieldError(message);
      setToast("Pengukuran belum tersimpan — periksa koneksi dan konfigurasi.");
    }
  }

  function toggleComparison(id: string) {
    setComparisonIds((current) => {
      if (current.includes(id)) {
        if (current.length === 1) {
          setToast("Pilih minimal satu stasiun untuk perbandingan.");
          return current;
        }
        return current.filter((item) => item !== id);
      }
      if (current.length >= 3) {
        setToast("Perbandingan dibatasi maksimal tiga stasiun.");
        return current;
      }
      return [...current, id];
    });
  }

  function exportCsv() {
    const rows = displayRangeHistory.map((reading) => [
      new Date(reading.timestamp).toISOString(),
      activeStation.name,
      reading.ntu.toFixed(1),
      reading.source,
      reading.equipment,
      getSeverity(reading.ntu, activeStation.baseline),
    ]);
    const csv = ["timestamp,station,ntu,source,equipment,status", ...rows.map((row) => row.map((value) => `\"${String(value).replaceAll("\"", "\"\"")}\"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `jernih-brantas-${activeStation.id}-${timeRange.toLowerCase()}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setToast(`CSV ${activeStation.name} untuk rentang ${timeRange} telah disiapkan.`);
  }

  function resetDemo() {
    setSourceByStation(Object.fromEntries(defaultStations.map((station) => [station.id, "simulation"])) as SourceByStation);
    setActiveId("malang");
    setFieldStation("malang");
    window.localStorage.removeItem(STORAGE_KEY);
    setToast("Preferensi demo lokal telah direset. Pembacaan Supabase tidak dihapus.");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setSection("monitor")} aria-label="Beranda Jernih"><span className="brand-mark">◒</span><span><b>Jernih</b><small>BRANTAS · NEXT</small></span></button>
        <span className="demo-badge"><i /> NEXT.JS DEMO</span>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <button className="sidebar-brand" onClick={() => setSection("monitor")} aria-label="Beranda Jernih"><span className="brand-mark">◒</span><span><b>Jernih</b><small>BRANTAS · NEXT</small></span></button>
          <span className="sidebar-label">RUANG KERJA</span>
          <div className="sidebar-nav">
            <NavButton active={section === "monitor"} icon="grid" label="Monitor" onClick={() => setSection("monitor")} />
            <NavButton active={section === "field"} icon="field" label="Catat Hasil Ukur" onClick={() => setSection("field")} />
            <NavButton active={section === "analytics"} icon="chart" label="Analitik" onClick={() => setSection("analytics")} />
            <NavButton active={section === "settings"} icon="settings" label="Pengaturan" onClick={() => setSection("settings")} />
          </div>
          <div className="sidebar-divider" />
          <span className="sidebar-label">TITIK PANTAU</span>
          <div className="station-list">
            {stations.map((station) => <button key={station.id} onClick={() => { selectStation(station.id); setSection("monitor"); }} className={`station-item ${station.id === activeId ? "selected" : ""}`}><i style={{ background: insights[station.id].color }} /><span><b>{station.name}</b><small>{station.subtitle}</small></span><strong>{formatNtu(station.ntu)}</strong></button>)}
          </div>
          <p className="local-note">◌ Data demo tetap simulasi. Catatan dari Catat Hasil Ukur diberi sumber manual dan tetap perlu verifikasi lapangan.</p>
        </aside>

        <section className="content">
          <div className="mobile-nav">
            <NavButton active={section === "monitor"} icon="grid" label="Monitor" onClick={() => setSection("monitor")} />
            <NavButton active={section === "field"} icon="field" label="Catat" onClick={() => setSection("field")} />
            <NavButton active={section === "analytics"} icon="chart" label="Analitik" onClick={() => setSection("analytics")} />
            <NavButton active={section === "settings"} icon="settings" label="Atur" onClick={() => setSection("settings")} />
          </div>

          {section === "monitor" && <section className="monitor-page">
            <section className="intro monitor-intro"><h1>Monitor</h1><p>Kondisi sungai secara langsung, per titik pantau.</p></section>
            <div className="monitor-station-chips" aria-label="Pilih stasiun monitor">{stations.map((station) => <button type="button" key={station.id} onClick={() => selectStation(station.id)} className={station.id === activeId ? "selected" : ""}><i style={{ background: insights[station.id].color }} /><span>{station.name}</span></button>)}</div>
            <div className="mobile-stations">{stations.map((station) => <button key={station.id} onClick={() => selectStation(station.id)} className={station.id === activeId ? "selected" : ""}><b>{station.name}</b><span>{formatNtu(station.ntu)} NTU</span><i style={{ background: insights[station.id].color }} /></button>)}</div>
            <section className={`hero-card severity-${activeInsight.severity}`}>
              <div className="hero-heading"><span className="hero-river">SUNGAI BRANTAS · {activeStation.subtitle.toUpperCase()}</span><h2>{activeStation.name}</h2></div>
              <span className={`live-status ${simulation ? "live" : "paused"}`}><i />{simulation ? "SIMULASI AKTIF" : "SIMULASI DIJEDA"}</span>
              <div className="hero-value"><strong key={activeStation.ntu}>{formatNtu(activeStation.ntu)}</strong><span>NTU</span></div>
              <div className="hero-condition"><div><strong>{activeCondition.title}</strong><span>{activeCondition.detail} {activeClass.label} · Kelas {activeClass.grade}.</span></div></div>
              <div className="gauge"><div className="gauge-track"><i style={{ height: `${Math.min(100, Math.max(4, activeStation.ntu))}%` }} /></div><span>100</span><span>50</span><span>0</span></div>
            </section>
            <p className="hero-plain-explainer">{NTU_PLAIN_EXPLANATION} Kelas {activeClass.grade}: {WATER_CLASS_PLAIN_LABEL[activeClass.grade]}.</p>
              <DataTrust source={activeSource} simulation={simulation} updatedAt={updatedAt} equipment={demoDisplayMode ? "NTU-Logger demo" : latest?.equipment ?? "NTU-Logger demo"} />
            <div className="metric-grid"><article><Icon name="water" /><strong>{formatNtu(average)}</strong><span>Rata-rata sungai</span></article><article className="positive"><Icon name="check" /><strong>{compliant} / 5</strong><span>Sesuai Kelas II</span></article><article className={activeAlerts > 0 ? "attention" : ""}><Icon name="alert" /><strong>{activeAlerts}</strong><span>Alert aktif</span></article><article><Icon name="database" /><strong>{recordCount}</strong><span>{demoDisplayMode ? "Catatan demo aktif" : hasRemoteReadings ? "Catatan Supabase" : "Catatan demo"}</span></article></div>
            <section className="monitor-priority" aria-labelledby="monitor-priority-title"><div className="monitor-section-heading"><span>PRIORITAS HARI INI</span><h2 id="monitor-priority-title">Tinjau sebelum mengambil tindakan.</h2><p>Alert dan pola tidak biasa ditampilkan lebih dahulu; keduanya tetap memerlukan verifikasi lapangan.</p></div><AlertPanel stations={stations} insights={insights} onSelect={selectStation} onAnalytics={openAnalytics} /></section>
            <div className="monitor-action-bar" aria-label="Tindakan monitor"><button type="button" className="monitor-action-primary" onClick={() => setSection("field")}><span><Icon name="field" /> PENGUKURAN LAPANGAN</span><b>Catat Hasil Ukur →</b></button><button type="button" className="monitor-action-secondary" onClick={() => openAnalytics()}><span><Icon name="chart" /> INVESTIGASI DATA</span><b>Lihat Analitik →</b></button></div>
            <AssistantPanel station={activeStation} source={activeSource} simulationEnabled={simulation} demoDisplayMode={demoDisplayMode} access={fieldAccess} accessLoading={fieldAccessLoading} onOpenFieldMode={() => setSection("field")} />
            <div className="monitor-explore"><RiverMap stations={stations} insights={insights} activeId={activeId} filter={mapFilter} onFilter={setMapFilter} onSelect={selectStation} onOpenAnalytics={() => openAnalytics()} /><section className="field-callout"><Icon name="field" /><span>PENGUKURAN LAPANGAN</span><h2>Siap mencatat hasil turbidimeter?</h2><p>Catat Hasil Ukur dapat digunakan untuk memverifikasi titik yang mengalami alert atau perubahan tidak biasa.</p><button onClick={() => setSection("field")}>Catat Hasil Ukur <b>→</b></button></section></div>
          </section>}

          {section === "field" && <>
            <section className="intro field-intro"><span className="mode-eyebrow"><Icon name="field" /> FIELD MODE · INPUT TERARAH</span><h1>Catat hasil<br />lapangan.</h1><p>Verifikasi akses petugas, pilih titik, lalu masukkan nilai NTU untuk ditinjau sebelum disimpan sebagai catatan lapangan.</p></section>
            <section className="field-access field-access-primary" aria-live="polite">
              <div><span>AKSES PETUGAS</span>{fieldAccessLoading ? <strong>Memeriksa sesi Supabase…</strong> : fieldAccess ? <><strong>{fieldAccess.displayName || fieldAccess.email}</strong><small>{fieldAccess.role === "admin" ? "Administrator · semua stasiun" : fieldAccess.role === "field_operator" ? `Petugas lapangan · ${fieldAccess.stationIds.length} stasiun ditugaskan` : "Akun masuk · menunggu penugasan Catat Hasil Ukur"}</small></> : <><strong>Masuk diperlukan</strong><small>Hanya petugas yang ditugaskan dapat menyimpan input manual.</small></>}</div>
              {fieldAccess ? <button className="field-auth-action" type="button" onClick={() => void signOutFieldMode()}>Keluar</button> : <div className="field-auth-controls"><input value={fieldAuthEmail} onChange={(event) => setFieldAuthEmail(event.target.value)} type="email" inputMode="email" placeholder="email.petugas@instansi.id" aria-label="Email petugas" /><button className="field-auth-action" type="button" disabled={fieldAuthSubmitting} onClick={() => void requestFieldModeAccess()}>{fieldAuthSubmitting ? "Mengirim…" : "Kirim tautan masuk"}</button></div>}
              {(fieldAuthMessage || fieldAccessIssue) && <p>{fieldAuthMessage || fieldAccessIssue}</p>}
            </section>
            <div className="field-layout"><aside className="field-side"><div className="field-station"><span>STASIUN DIPILIH</span><strong>{selectedFieldStation.name}</strong><small>{selectedFieldStation.subtitle}</small></div><ol className="steps"><li className="done"><b>1</b><span>Pilih titik</span></li><li className={fieldNtu ? "done" : ""}><b>2</b><span>Masukkan NTU</span></li><li className={fieldClass ? "done" : ""}><b>3</b><span>Tinjau & simpan</span></li></ol><DataTrust source={activeSource} simulation={simulation} updatedAt={updatedAt} equipment={latest?.equipment ?? "NTU-Logger demo"} /></aside>
              <form className="field-form" onSubmit={saveMeasurement}>
                <div className="field-form-heading"><span>CATAT PENGUKURAN</span><h2>Masukkan pembacaan turbidimeter.</h2><p>Nilai akan diklasifikasikan sebelum catatan dikirim.</p></div>
                <div className="form-grid"><label><span>STASIUN</span><select value={fieldStation} onChange={(event) => setFieldStation(event.target.value)}>{stations.map((station) => <option key={station.id} value={station.id}>{station.name} — {station.subtitle}</option>)}</select></label><label><span>ALAT</span><select value={fieldEquipment} onChange={(event) => setFieldEquipment(event.target.value as (typeof EQUIPMENT)[number])}>{EQUIPMENT.map((equipment) => <option key={equipment}>{equipment}</option>)}</select></label></div>
                <label className="ntu-input"><span>KEKERUHAN TERBACA</span><div><input value={fieldNtu} onChange={(event) => { setFieldNtu(event.target.value); setFieldError(""); }} inputMode="decimal" placeholder="18.4" aria-describedby="ntu-help" /><b>NTU</b></div><small id="ntu-help">Masukkan angka antara 0–500 NTU. Gunakan satu desimal bila diperlukan.</small></label>
                {fieldError && <p className="form-error">{fieldError}</p>}
                <div className={`measurement-review ${fieldClass ? "ready" : ""}`}><div><span>TINJAU KLASIFIKASI</span><strong style={{ color: fieldClass?.color }}>{fieldClass ? `${formatNtu(fieldValue)} NTU · ${fieldClass.label} · Kelas ${fieldClass.grade}` : "Masukkan nilai NTU untuk melihat klasifikasi."}</strong></div><p>{fieldClass && (getSeverity(fieldValue, selectedFieldStation.baseline) === "high" || getSeverity(fieldValue, selectedFieldStation.baseline) === "critical") ? "Nilai ini akan memicu alert untuk ditinjau dan diverifikasi di lapangan." : "Status akhir tetap mengikuti prosedur verifikasi lapangan."}</p></div>
                <button className="save-button" type="submit" disabled={!canWriteFieldMode || fieldAccessLoading}>{fieldAccessLoading ? "Memeriksa akses…" : canWriteFieldMode ? <>Simpan pengukuran lapangan <b>→</b></> : <>Masuk sebagai petugas untuk menyimpan <b>→</b></>}</button><p className="form-footnote">◌ Catatan manual hanya dapat dikirim melalui akun petugas yang diberi peran dan penugasan stasiun. Alert adalah indikator pola, bukan penetapan pencemaran.</p>
              </form></div>
          </>}

          {section === "analytics" && <>
            <section className="intro"><span className="mode-eyebrow"><Icon name="chart" /> ANALITIK</span><h1>Baca pola,<br />bukan sekadar angka.</h1><p>Gunakan rentang waktu, baseline, dan penanda anomali untuk memeriksa perubahan pada data simulasi atau input manual.</p></section>
            <section className="analytics-toolbar" aria-label="Kontrol analitik"><div className="analytics-toolbar-context"><span className="active-dot" style={{ background: activeInsight.color }} /><div><small>STASIUN AKTIF</small><strong>{activeStation.name} · {activeStation.subtitle}</strong></div><StatusBadge insight={activeInsight} compact /></div><div className="analytics-toolbar-controls"><label className="analytics-station-select"><span>STASIUN</span><select value={activeId} onChange={(event) => selectStation(event.target.value)} aria-label="Pilih stasiun analitik">{stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}</select></label><div className="analytics-range-group" aria-label="Rentang waktu analitik"><span>RENTANG</span><div>{(["24H", "7D", "30D", "90D"] as TimeRange[]).map((range) => <button type="button" key={range} className={timeRange === range ? "active" : ""} onClick={() => setTimeRange(range)}>{range}</button>)}</div></div><button type="button" className="analytics-export-button" onClick={exportCsv}><Icon name="download" /> Export CSV</button></div></section>
            <div className="analytics-metrics"><article><span>TERKINI</span><strong>{formatNtu(activeStation.ntu)}</strong><small>NTU</small></article><article><span>RATA-RATA</span><strong>{formatNtu(rangeAverage)}</strong><small>NTU</small></article><article><span>MINIMUM</span><strong>{formatNtu(rangeMin)}</strong><small>NTU</small></article><article><span>MAKSIMUM</span><strong>{formatNtu(rangeMax)}</strong><small>NTU</small></article><article className={activeInsight.anomaly ? "attention" : ""}><span>VS BASELINE</span><strong>{formatPercent(activeInsight.deviation)}</strong><small>{activeInsight.anomaly ?? "dalam pola"}</small></article></div>
            <section className="surface-card chart-card"><div className="card-heading"><div><h2>Tren kekeruhan</h2><p>{displayRangeHistory.length} catatan {timeRange} untuk {activeStation.name}. Garis putus-putus menunjukkan baseline dan ambang 25/50 NTU.</p></div><span className="range-chip">{timeRange} · SIMULASI</span></div><TrendChart readings={displayRangeHistory} baseline={activeStation.baseline} /></section>
            <section className="surface-card comparison-card"><div className="card-heading"><div><h2>Perbandingan stasiun</h2><p>Pilih maksimal tiga stasiun untuk membandingkan kondisi saat ini dengan baseline.</p></div></div><div className="comparison-picker">{stations.map((station) => <button type="button" key={station.id} className={comparisonIds.includes(station.id) ? "selected" : ""} onClick={() => toggleComparison(station.id)}><i style={{ background: insights[station.id].color }} />{station.name}</button>)}</div><div className="comparison-table">{comparisonStations.map((station) => { const stationHistory = (history[station.id] ?? []).filter((reading) => reading.timestamp >= rangeAnchor - RANGE_MS[timeRange]); const values = stationHistory.length ? stationHistory.map((reading) => reading.ntu) : [station.ntu]; const stationAverage = values.reduce((sum, value) => sum + value, 0) / values.length; return <article key={station.id}><div><span>{station.name}</span><StatusBadge insight={insights[station.id]} compact /></div><strong>{formatNtu(station.ntu)} <small>NTU</small></strong><p>Rata-rata {formatNtu(stationAverage)} · {formatPercent(insights[station.id].deviation)} vs baseline</p></article>; })}</div></section>
            <section className="surface-card history-card"><div className="card-heading"><div><h2>Riwayat pengukuran</h2><p>Terbaru berada di urutan pertama. Alert aktif atau resolved berasal dari pola pembacaan yang tersedia.</p></div></div>{[...displayRangeHistory].reverse().slice(0, 10).map((reading) => { const water = classifyNtu(reading.ntu); const severity = getSeverity(reading.ntu, activeStation.baseline); return <div className="history-row" key={reading.id}><i style={{ background: SEVERITY_META[severity].color }} /><span><strong>{formatDateTime(reading.timestamp)}</strong><small>{reading.source === "manual" ? "Input manual" : "Simulasi"} · {reading.equipment}</small></span><b>{formatNtu(reading.ntu)} <small>NTU</small></b><em style={{ color: water.color }}>{severity === "high" || severity === "critical" ? `${SEVERITY_META[severity].label} · ${severity === getSeverity(activeStation.ntu, activeStation.baseline) ? "Aktif" : "Resolved"}` : water.label}</em></div>; })}</section>
          </>}

          {section === "settings" && <>
            <section className="intro"><span className="mode-eyebrow"><Icon name="settings" /> PENGATURAN</span><h1>Kendalikan cara<br />demo bekerja.</h1><p>Pengaturan mengelola simulator, pilihan tampilan demo, pembacaan Supabase yang tersedia, dan referensi klasifikasi untuk seluruh website.</p></section>
            <div className="settings-layout"><section className="settings-card"><div className="setting-row"><span className="setting-icon"><Icon name="field" /></span><div><h2>Mode Simulasi</h2><p>{simulation ? "Aktif · nilai baru dibuat setiap 4 detik, termasuk contoh kenaikan mendadak untuk demonstrasi alert." : "Dijeda · nilai saat ini tetap dapat ditinjau."}</p></div><button className={`switch ${simulation ? "on" : ""}`} type="button" onClick={() => setSimulation((value) => !value)} role="switch" aria-checked={simulation}><i /></button></div><div className="setting-divider" /><div className="setting-row"><span className="setting-icon"><Icon name="water" /></span><div><h2>Data demo untuk presentasi</h2><p>{demoDisplayMode ? "Aktif · Monitor dan Analitik memakai simulasi lokal yang jelas diberi label. Catatan Supabase tetap tersimpan dan tidak dihapus." : "Nonaktif · Monitor dan Analitik menampilkan pembacaan terbaru yang tersedia dari Supabase."}</p></div><button className={`switch ${demoDisplayMode ? "on" : ""}`} type="button" onClick={() => setDemoDisplayMode((value) => !value)} role="switch" aria-checked={demoDisplayMode}><i /></button></div><div className="setting-divider" /><div className="setting-row"><span className="setting-icon"><Icon name="database" /></span><div><h2>{hasRemoteReadings ? "Data pada Supabase" : "Data demo lokal"}</h2><p>{hasRemoteReadings ? `${recordCount} catatan tersedia dari Supabase. ${demoDisplayMode ? "Mode demo sedang menampilkannya sebagai data terpisah." : "Pembacaan manual tetap memerlukan verifikasi."}` : "Riwayat simulasi dipakai sebagai fallback sampai pembacaan Supabase tersedia."}</p></div></div></section>
              <section className="surface-card thresholds"><div className="card-heading"><div><h2>Aturan status</h2><p>Alert memakai nilai NTU dan penyimpangan terhadap baseline; hasilnya tetap memerlukan verifikasi.</p></div></div>{[["Normal", "dalam pola", "#2D6A5C"], ["Warning", ">25 NTU / deviasi", "#A27719"], ["High", "≥50 NTU", "#C4622D"], ["Critical", "≥75 NTU", "#8B3A1F"]].map(([label, range, color]) => <div key={label} className="threshold-row"><i style={{ background: color }} /><span>{label}</span><b>{range}</b></div>)}</section></div>
            <button className="reset-button" type="button" onClick={resetDemo}><Icon name="restart" /><span><b>Reset data demo</b><small>Kembalikan nilai stasiun, riwayat 90 hari simulasi, dan alert lokal ke kondisi awal.</small></span><strong>→</strong></button>
          </>}
        </section>
      </div>
      {toast && <div className="toast" role="status">✓ {toast}</div>}
      <footer className="app-footer">Jernih Brantas · Next.js + TypeScript · <span>SUPABASE + DEMO</span></footer>
    </main>
  );
}
