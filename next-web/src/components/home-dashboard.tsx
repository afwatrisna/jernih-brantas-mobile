"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, type FormEvent } from "react";
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
} from "@/lib/jernih-data";
import type {
  History,
  MapFilter,
  Section,
  SourceByStation,
  StationInsight,
  TimeRange,
} from "@/lib/dashboard-types";
import {
  MAX_HISTORY,
  RANGE_MS,
  SEVERITY_META,
  STORAGE_KEY,
  formatDateTime,
  formatPercent,
  getConditionCopy,
  getSeverity,
  getStationInsight,
  seedHistory,
} from "@/lib/dashboard-utils";
import { useSupabaseReadings, type SupabaseReading } from "@/hooks/useSupabaseReadings";
import { useFieldModeAccess } from "@/hooks/useFieldModeAccess";
import { createAuthenticatedManualReading } from "@/lib/readings-client";
import { Icon } from "@/components/ui/icon";
import { NavButton } from "@/components/ui/nav-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTrust } from "@/components/ui/data-trust";
import { TrendChart } from "@/components/trend-chart";
import { AlertPanel } from "@/components/alert-panel";
import { SettingsSection } from "@/components/sections/settings-section";

function toReading(row: SupabaseReading): Reading {
  return {
    id: row.id,
    ntu: Number(row.ntu),
    timestamp: new Date(row.created_at).getTime(),
    source: row.source,
    equipment: row.equipment,
  };
}

const BrantasMap = dynamic(
  () => import("@/components/brantas-map").then((module) => module.BrantasMap),
  {
    ssr: false,
    loading: () => (
      <div className="leaflet-map-placeholder">Memuat peta interaktif…</div>
    ),
  },
);

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
            <div className="monitor-explore"><BrantasMap stations={stations} insights={insights} activeId={activeId} filter={mapFilter} onFilter={setMapFilter} onSelect={selectStation} onOpenAnalytics={() => openAnalytics()} /></div>
            <section className={`hero-card severity-${activeInsight.severity}`}>
              <div className="hero-heading"><span className="hero-river">SUNGAI BRANTAS · {activeStation.subtitle.toUpperCase()}</span><h2>{activeStation.name}</h2><StatusBadge insight={activeInsight} compact /></div>
              <span className={`live-status ${simulation ? "live" : "paused"}`}><i />{simulation ? "SIMULASI AKTIF" : "SIMULASI DIJEDA"}</span>
              <div className="hero-value"><strong key={activeStation.ntu}>{formatNtu(activeStation.ntu)}</strong><span>NTU</span></div>
              <div className="hero-condition"><div><strong>{activeCondition.title}</strong><span>{activeCondition.detail} {activeClass.label} · Kelas {activeClass.grade}.</span></div></div>
              <div className="gauge"><div className="gauge-track"><i style={{ height: `${Math.min(100, Math.max(4, activeStation.ntu))}%` }} /></div><span>100</span><span>50</span><span>0</span></div>
            </section>
            <p className="hero-plain-explainer">{NTU_PLAIN_EXPLANATION} Kelas {activeClass.grade}: {WATER_CLASS_PLAIN_LABEL[activeClass.grade]}.</p>
            <div className="metric-grid"><article><Icon name="water" /><strong>{formatNtu(average)}</strong><span>Rata-rata sungai</span></article><article className={compliant >= 4 ? "positive" : compliant >= 3 ? "attention" : "critical"}><Icon name="check" /><strong>{compliant} / 5</strong><span>Sesuai Kelas II</span></article><article className={activeAlerts > 0 ? "attention" : ""}><Icon name="alert" /><strong>{activeAlerts}</strong><span>Alert aktif</span></article><article><Icon name="database" /><strong>{recordCount}</strong><span>{demoDisplayMode ? "Catatan demo aktif" : hasRemoteReadings ? "Catatan Supabase" : "Catatan demo"}</span></article></div>
            <section className="monitor-priority" aria-labelledby="monitor-priority-title"><div className="monitor-section-heading"><span>PRIORITAS HARI INI</span><h2 id="monitor-priority-title">Tinjau sebelum mengambil tindakan.</h2><p>Alert dan pola tidak biasa ditampilkan lebih dahulu; keduanya tetap memerlukan verifikasi lapangan.</p></div><AlertPanel stations={stations} insights={insights} onSelect={selectStation} onAnalytics={openAnalytics} /></section>
            <div className="monitor-action-bar" aria-label="Tindakan monitor"><button type="button" className="monitor-action-primary" onClick={() => setSection("field")}><span><Icon name="field" /> Catat hasil ukur</span><b>→</b></button><button type="button" className="monitor-action-secondary" onClick={() => openAnalytics()}><span><Icon name="chart" /> Lihat analitik</span><b>→</b></button></div>
            <DataTrust source={activeSource} simulation={simulation} updatedAt={updatedAt} equipment={demoDisplayMode ? "NTU-Logger demo" : latest?.equipment ?? "NTU-Logger demo"} />
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

          {section === "settings" && (
            <SettingsSection
              simulation={simulation}
              demoDisplayMode={demoDisplayMode}
              hasRemoteReadings={hasRemoteReadings}
              recordCount={recordCount}
              onToggleSimulation={() => setSimulation((value) => !value)}
              onToggleDemoDisplayMode={() => setDemoDisplayMode((value) => !value)}
              onResetDemo={resetDemo}
            />
          )}
        </section>
      </div>
      {toast && <div className="toast" role="status">✓ {toast}</div>}
      <footer className="app-footer">Jernih Brantas · Next.js + TypeScript · <span>SUPABASE + DEMO</span></footer>
    </main>
  );
}
