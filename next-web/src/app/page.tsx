"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EQUIPMENT,
  classifyNtu,
  formatNtu,
  formatTime,
  initialStationStates,
  type Reading,
  type ReadingSource,
  type StationState,
} from "../lib/jernih-data";

type Section = "monitor" | "field" | "analytics" | "settings";
type History = Record<string, Reading[]>;
type SourceByStation = Record<string, ReadingSource>;

const STORAGE_KEY = "jernih-next-dashboard-v1";
const MAX_HISTORY = 28;

function makeReading(ntu: number, source: ReadingSource, equipment: string): Reading {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ntu: Math.round(ntu * 10) / 10,
    timestamp: Date.now(),
    source,
    equipment,
  };
}

function seedHistory(stations: StationState[]): History {
  const now = Date.now();
  return Object.fromEntries(
    stations.map((station) => [
      station.id,
      [-3, -2, -1, 0].map((index) => ({
        id: `${station.id}-${index}`,
        ntu: Math.round((station.baseline + index * 0.6) * 10) / 10,
        timestamp: now + index * 4_000,
        source: "simulation" as const,
        equipment: "NTU-Logger demo",
      })),
    ]),
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

function Icon({ name }: { name: "grid" | "field" | "chart" | "settings" | "water" | "map" | "plus" | "check" | "restart" | "shield" | "database" }) {
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
        <div><span>PENYIMPANAN</span><strong>Lokal di browser</strong></div>
      </div>
      <p>{trust.note}</p>
    </section>
  );
}

function RiverMap({ stations, activeId, onSelect }: { stations: StationState[]; activeId: string; onSelect: (id: string) => void }) {
  const selected = stations.find((station) => station.id === activeId) ?? stations[0];
  return (
    <section className="surface-card map-card">
      <div className="card-heading"><div><h2>Aliran & titik pantau</h2><p>Pilih titik untuk memperbarui ringkasan. Simulasi diperbarui setiap 4 detik.</p></div><Icon name="map" /></div>
      <div className="river-map" aria-label="Peta ilustratif titik pantau Sungai Brantas">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M 13 17 C 20 25, 24 33, 29 38 C 36 44, 41 50, 47 54 C 54 59, 57 65, 62 68 C 69 72, 75 78, 81 82" />
          <path className="river-highlight" d="M 13 17 C 20 25, 24 33, 29 38 C 36 44, 41 50, 47 54 C 54 59, 57 65, 62 68 C 69 72, 75 78, 81 82" />
        </svg>
        {stations.map((station) => {
          const waterClass = classifyNtu(station.ntu);
          return <button key={station.id} className={`map-marker ${station.id === activeId ? "selected" : ""}`} onClick={() => onSelect(station.id)} style={{ left: `${station.x}%`, top: `${station.y}%`, "--marker": waterClass.color } as React.CSSProperties} aria-label={`${station.name}: ${formatNtu(station.ntu)} NTU`} />;
        })}
        <div className="map-tooltip"><strong>{selected.name}</strong><span>{formatNtu(selected.ntu)} NTU · {classifyNtu(selected.ntu).label}</span></div>
      </div>
    </section>
  );
}

function TrendChart({ readings }: { readings: Reading[] }) {
  const data = readings.slice(-10);
  if (data.length < 2) return <div className="chart-empty">Data belum cukup untuk menampilkan tren.</div>;
  const values = data.map((reading) => reading.ntu);
  const min = Math.max(0, Math.min(...values) - 3);
  const max = Math.max(...values, 20) + 3;
  const width = 600;
  const height = 210;
  const points = values.map((value, index) => {
    const x = 38 + (index / (values.length - 1)) * 530;
    const y = 20 + (1 - (value - min) / (max - min)) * 145;
    return { x, y };
  });
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
  return (
    <div className="trend-chart" aria-label="Grafik tren NTU">
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        {[20, 92, 165].map((y) => <line key={y} x1="38" x2="568" y1={y} y2={y} className="chart-guide" />)}
        <text x="4" y="24">{max.toFixed(0)}</text><text x="4" y="96">{((max + min) / 2).toFixed(0)}</text><text x="15" y="169">{min.toFixed(0)}</text>
        <path d={line} className="chart-line" />
        {points.map((point, index) => <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r={index === points.length - 1 ? 5 : 3.4} className={index === points.length - 1 ? "chart-point active" : "chart-point"} />)}
        <text x="38" y="198">{formatTime(data[0].timestamp)}</text><text x="500" y="198">{formatTime(data[data.length - 1].timestamp)}</text>
      </svg>
    </div>
  );
}

export default function Home() {
  const defaultStations = useMemo(() => initialStationStates(), []);
  const [stations, setStations] = useState<StationState[]>(defaultStations);
  const [history, setHistory] = useState<History>(() => seedHistory(defaultStations));
  const [activeId, setActiveId] = useState("malang");
  const [section, setSection] = useState<Section>("monitor");
  const [simulation, setSimulation] = useState(true);
  const [sourceByStation, setSourceByStation] = useState<SourceByStation>(() => Object.fromEntries(defaultStations.map((station) => [station.id, "simulation"])) as SourceByStation);
  const [recordCount, setRecordCount] = useState(45);
  const [fieldStation, setFieldStation] = useState("malang");
  const [fieldNtu, setFieldNtu] = useState("");
  const [fieldEquipment, setFieldEquipment] = useState<(typeof EQUIPMENT)[number]>(EQUIPMENT[0]);
  const [fieldError, setFieldError] = useState("");
  const [toast, setToast] = useState("");
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { stations?: StationState[]; history?: History; activeId?: string; recordCount?: number; sourceByStation?: SourceByStation };
          if (parsed.stations?.length === defaultStations.length) setStations(parsed.stations);
          if (parsed.history) setHistory(parsed.history);
          if (parsed.activeId) setActiveId(parsed.activeId);
          if (parsed.recordCount) setRecordCount(parsed.recordCount);
          if (parsed.sourceByStation) setSourceByStation(parsed.sourceByStation);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        setStorageReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [defaultStations.length]);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ stations, history, activeId, recordCount, sourceByStation }));
  }, [stations, history, activeId, recordCount, sourceByStation, storageReady]);

  useEffect(() => {
    if (!simulation) return;
    const timer = window.setInterval(() => {
      setStations((current) => {
        const next = current.map((station) => {
          const burst = Math.random() < 0.07 ? (Math.random() * 12 - 3) : 0;
          const measured = station.ntu + (Math.random() - 0.5) * 3 + burst;
          const corrected = measured + (station.baseline - measured) * 0.05;
          return { ...station, ntu: Math.max(1, Math.round(corrected * 10) / 10) };
        });
        setHistory((currentHistory) => {
          const nextHistory = { ...currentHistory };
          next.forEach((station) => {
            nextHistory[station.id] = [...(nextHistory[station.id] ?? []), makeReading(station.ntu, "simulation", "NTU-Logger demo")].slice(-MAX_HISTORY);
          });
          return nextHistory;
        });
        return next;
      });
      setSourceByStation(Object.fromEntries(defaultStations.map((station) => [station.id, "simulation"])) as SourceByStation);
      setRecordCount((current) => current + defaultStations.length);
    }, 4_000);
    return () => window.clearInterval(timer);
  }, [defaultStations, simulation]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activeStation = stations.find((station) => station.id === activeId) ?? stations[0];
  const activeHistory = history[activeStation.id] ?? [];
  const latest = activeHistory[activeHistory.length - 1];
  const updatedAt = latest?.timestamp ?? 0;
  const activeSource = sourceByStation[activeStation.id] ?? "simulation";
  const average = stations.reduce((sum, station) => sum + station.ntu, 0) / stations.length;
  const compliant = stations.filter((station) => station.ntu <= 25).length;
  const activeClass = classifyNtu(activeStation.ntu);
  const selectedFieldStation = stations.find((station) => station.id === fieldStation) ?? activeStation;
  const fieldValue = Number.parseFloat(fieldNtu.replace(",", "."));
  const fieldClass = Number.isFinite(fieldValue) ? classifyNtu(fieldValue) : null;

  function selectStation(id: string) {
    setActiveId(id);
    setFieldStation(id);
  }

  function saveMeasurement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!Number.isFinite(fieldValue) || fieldValue < 0 || fieldValue > 500) {
      setFieldError("Masukkan nilai antara 0 hingga 500 NTU.");
      return;
    }
    const reading = makeReading(fieldValue, "manual", fieldEquipment);
    setStations((current) => current.map((station) => station.id === fieldStation ? { ...station, ntu: reading.ntu } : station));
    setHistory((current) => ({ ...current, [fieldStation]: [...(current[fieldStation] ?? []), reading].slice(-MAX_HISTORY) }));
    setSourceByStation((current) => ({ ...current, [fieldStation]: "manual" }));
    setActiveId(fieldStation);
    setRecordCount((current) => current + 1);
    setFieldNtu("");
    setFieldError("");
    setToast(`Pengukuran ${selectedFieldStation.name} disimpan secara lokal.`);
  }

  function resetDemo() {
    const resetStations = initialStationStates();
    setStations(resetStations);
    setHistory(seedHistory(resetStations));
    setSourceByStation(Object.fromEntries(resetStations.map((station) => [station.id, "simulation"])) as SourceByStation);
    setActiveId("malang");
    setFieldStation("malang");
    setRecordCount(45);
    window.localStorage.removeItem(STORAGE_KEY);
    setToast("Data lokal telah dikembalikan ke kondisi demo awal.");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setSection("monitor")} aria-label="Beranda Jernih"><span className="brand-mark">◒</span><span><b>Jernih</b><small>BRANTAS · NEXT</small></span></button>
        <nav className="topnav" aria-label="Navigasi utama">
          <NavButton active={section === "monitor"} icon="grid" label="Monitor" onClick={() => setSection("monitor")} />
          <NavButton active={section === "field"} icon="field" label="Field Mode" onClick={() => setSection("field")} />
          <NavButton active={section === "analytics"} icon="chart" label="Analitik" onClick={() => setSection("analytics")} />
          <NavButton active={section === "settings"} icon="settings" label="Atur" onClick={() => setSection("settings")} />
        </nav>
        <span className="demo-badge"><i /> NEXT.JS DEMO</span>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <span className="sidebar-label">RUANG KERJA</span>
          <div className="sidebar-nav">
            <NavButton active={section === "monitor"} icon="grid" label="Monitor" onClick={() => setSection("monitor")} />
            <NavButton active={section === "field"} icon="field" label="Field Mode" onClick={() => setSection("field")} />
            <NavButton active={section === "analytics"} icon="chart" label="Analitik" onClick={() => setSection("analytics")} />
            <NavButton active={section === "settings"} icon="settings" label="Pengaturan" onClick={() => setSection("settings")} />
          </div>
          <div className="sidebar-divider" />
          <span className="sidebar-label">TITIK PANTAU</span>
          <div className="station-list">
            {stations.map((station) => <button key={station.id} onClick={() => { selectStation(station.id); setSection("monitor"); }} className={`station-item ${station.id === activeId ? "selected" : ""}`}><i style={{ background: classifyNtu(station.ntu).color }} /><span><b>{station.name}</b><small>{station.subtitle}</small></span><strong>{formatNtu(station.ntu)}</strong></button>)}
          </div>
          <p className="local-note">◌ Local-first demo. Data tersimpan di browser ini.</p>
        </aside>

        <section className="content">
          <div className="mobile-nav">
            <NavButton active={section === "monitor"} icon="grid" label="Monitor" onClick={() => setSection("monitor")} />
            <NavButton active={section === "field"} icon="field" label="Field" onClick={() => setSection("field")} />
            <NavButton active={section === "analytics"} icon="chart" label="Analitik" onClick={() => setSection("analytics")} />
            <NavButton active={section === "settings"} icon="settings" label="Atur" onClick={() => setSection("settings")} />
          </div>

          {section === "monitor" && <>
            <section className="intro"><span className="mode-eyebrow"><Icon name="water" /> MONITOR MODE</span><h1>Kondisi sungai,<br />lebih mudah dipahami.</h1><p>Pantau kejernihan air di titik penting Sungai Brantas, lalu pindah ke Field Mode saat petugas perlu mencatat hasil lapangan.</p></section>
            <div className="mobile-stations">{stations.slice(0, 3).map((station) => <button key={station.id} onClick={() => selectStation(station.id)} className={station.id === activeId ? "selected" : ""}><b>{station.name}</b><span>{formatNtu(station.ntu)} NTU</span></button>)}</div>
            <section className="hero-card">
              <div><span className="hero-river">SUNGAI BRANTAS · {activeStation.subtitle.toUpperCase()}</span><h2>{activeStation.name}</h2></div>
              <span className={`live-status ${simulation ? "live" : "paused"}`}><i />{simulation ? "SIMULASI AKTIF" : "SIMULASI DIJEDA"}</span>
              <div className="hero-value"><strong key={activeStation.ntu}>{formatNtu(activeStation.ntu)}</strong><span>NTU</span></div>
              <div className="class-pill" style={{ background: activeClass.softColor, color: activeClass.color }}><i style={{ background: activeClass.color }} />{activeClass.label} · Kelas {activeClass.grade}</div>
              <div className="gauge"><div className="gauge-track"><i style={{ height: `${Math.min(100, Math.max(4, activeStation.ntu))}%` }} /></div><span>100</span><span>50</span><span>0</span></div>
              <footer><span>Siklus demo · {formatTime(updatedAt)}</span><button onClick={() => setSection("field")}>Buka Field Mode untuk merekam →</button></footer>
            </section>
            <DataTrust source={activeSource} simulation={simulation} updatedAt={updatedAt} equipment={latest?.equipment ?? "NTU-Logger demo"} />
            <div className="metric-grid"><article><Icon name="water" /><strong>{formatNtu(average)}</strong><span>Rata-rata sungai</span></article><article className="positive"><Icon name="check" /><strong>{compliant} / 5</strong><span>Sesuai Kelas II</span></article><article><Icon name="database" /><strong>{recordCount}</strong><span>Catatan lokal</span></article></div>
            <div className="monitor-lower"><RiverMap stations={stations} activeId={activeId} onSelect={selectStation} /><section className="field-callout"><Icon name="field" /><span>PENGUKURAN LAPANGAN</span><h2>Siap mencatat hasil turbidimeter?</h2><p>Field Mode memisahkan pencatatan dari dashboard agar titik, nilai, dan status verifikasi tetap jelas.</p><button onClick={() => setSection("field")}>Buka Field Mode <b>→</b></button></section></div>
          </>}

          {section === "field" && <>
            <section className="intro field-intro"><span className="mode-eyebrow"><Icon name="field" /> FIELD MODE</span><h1>Catat hasil<br />lapangan.</h1><p>Masukkan hasil turbidimeter secara terarah, lalu tinjau klasifikasinya sebelum disimpan secara lokal.</p></section>
            <div className="field-layout"><aside className="field-side"><div className="field-station"><span>STASIUN DIPILIH</span><strong>{selectedFieldStation.name}</strong><small>{selectedFieldStation.subtitle}</small></div><ol className="steps"><li className="done"><b>1</b><span>Pilih titik</span></li><li className={fieldNtu ? "done" : ""}><b>2</b><span>Masukkan NTU</span></li><li className={fieldClass ? "done" : ""}><b>3</b><span>Tinjau & simpan</span></li></ol><DataTrust source={activeSource} simulation={simulation} updatedAt={updatedAt} equipment={latest?.equipment ?? "NTU-Logger demo"} /></aside>
              <form className="field-form" onSubmit={saveMeasurement}>
                <div className="form-grid"><label><span>STASIUN</span><select value={fieldStation} onChange={(event) => setFieldStation(event.target.value)}>{stations.map((station) => <option key={station.id} value={station.id}>{station.name} — {station.subtitle}</option>)}</select></label><label><span>ALAT</span><select value={fieldEquipment} onChange={(event) => setFieldEquipment(event.target.value as (typeof EQUIPMENT)[number])}>{EQUIPMENT.map((equipment) => <option key={equipment}>{equipment}</option>)}</select></label></div>
                <label className="ntu-input"><span>KEKERUHAN TERBACA</span><div><input value={fieldNtu} onChange={(event) => { setFieldNtu(event.target.value); setFieldError(""); }} inputMode="decimal" placeholder="18.4" aria-describedby="ntu-help" /><b>NTU</b></div><small id="ntu-help">Masukkan angka antara 0–500 NTU. Gunakan satu desimal bila diperlukan.</small></label>
                {fieldError && <p className="form-error">{fieldError}</p>}
                <div className={`measurement-review ${fieldClass ? "ready" : ""}`}><div><span>TINJAU KLASIFIKASI</span><strong style={{ color: fieldClass?.color }}>{fieldClass ? `${formatNtu(fieldValue)} NTU · ${fieldClass.label} · Kelas ${fieldClass.grade}` : "Masukkan nilai NTU untuk melihat klasifikasi."}</strong></div><p>Status akhir tetap mengikuti prosedur verifikasi lapangan.</p></div>
                <button className="save-button" type="submit">Simpan pengukuran lokal <b>→</b></button><p className="form-footnote">◌ Catatan tersimpan di browser ini. Sinkronisasi server dapat ditambahkan setelah backend tersedia.</p>
              </form></div>
          </>}

          {section === "analytics" && <>
            <section className="intro"><span className="mode-eyebrow"><Icon name="chart" /> ANALITIK</span><h1>Baca pola,<br />bukan sekadar angka.</h1><p>Ringkasan ini memakai data simulasi dan input manual yang tersedia untuk stasiun aktif.</p></section>
            <div className="analytics-switch"><span className="active-dot" style={{ background: activeClass.color }} /><div><small>STASIUN AKTIF</small><strong>{activeStation.name} · {activeStation.subtitle}</strong></div><select value={activeId} onChange={(event) => selectStation(event.target.value)} aria-label="Pilih stasiun analitik">{stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}</select></div>
            <div className="analytics-metrics"><article><span>TERKINI</span><strong>{formatNtu(activeStation.ntu)}</strong><small>NTU</small></article><article><span>RATA-RATA</span><strong>{formatNtu(activeHistory.reduce((sum, reading) => sum + reading.ntu, 0) / Math.max(1, activeHistory.length))}</strong><small>NTU</small></article><article><span>MINIMUM</span><strong>{formatNtu(Math.min(...activeHistory.map((reading) => reading.ntu)))}</strong><small>NTU</small></article><article><span>MAKSIMUM</span><strong>{formatNtu(Math.max(...activeHistory.map((reading) => reading.ntu)))}</strong><small>NTU</small></article></div>
            <section className="surface-card chart-card"><div className="card-heading"><div><h2>Tren kekeruhan</h2><p>{activeHistory.length} catatan terbaru untuk {activeStation.name}.</p></div><span className="range-chip">SEMUA DATA</span></div><TrendChart readings={activeHistory} /></section>
            <section className="surface-card history-card"><div className="card-heading"><div><h2>Riwayat pengukuran</h2><p>Terbaru berada di urutan pertama.</p></div></div>{[...activeHistory].reverse().slice(0, 7).map((reading) => { const water = classifyNtu(reading.ntu); return <div className="history-row" key={reading.id}><i style={{ background: water.color }} /><span><strong>{formatTime(reading.timestamp)} WIB</strong><small>{reading.source === "manual" ? "Input manual" : "Simulasi"} · {reading.equipment}</small></span><b>{formatNtu(reading.ntu)} <small>NTU</small></b><em style={{ color: water.color }}>{water.label}</em></div>; })}</section>
          </>}

          {section === "settings" && <>
            <section className="intro"><span className="mode-eyebrow"><Icon name="settings" /> PENGATURAN</span><h1>Kendalikan cara<br />demo bekerja.</h1><p>Pengaturan lokal ini mengelola simulator, catatan browser, dan referensi klasifikasi untuk seluruh website.</p></section>
            <div className="settings-layout"><section className="settings-card"><div className="setting-row"><span className="setting-icon"><Icon name="field" /></span><div><h2>Mode Simulasi</h2><p>{simulation ? "Aktif · nilai baru dibuat setiap 4 detik." : "Dijeda · nilai saat ini tetap dapat ditinjau."}</p></div><button className={`switch ${simulation ? "on" : ""}`} type="button" onClick={() => setSimulation((value) => !value)} role="switch" aria-checked={simulation}><i /></button></div><div className="setting-divider" /><div className="setting-row"><span className="setting-icon"><Icon name="database" /></span><div><h2>Data pada browser</h2><p>{recordCount} catatan tersedia secara lokal. Riwayat tidak dikirim ke server.</p></div></div></section>
              <section className="surface-card thresholds"><div className="card-heading"><div><h2>Kelas kekeruhan</h2><p>Batas NTU dipakai konsisten pada Monitor, Field Mode, dan Analitik.</p></div></div>{[["Sangat Jernih", "≤ 5 NTU", "#2D6A5C"], ["Jernih", "> 5–25 NTU", "#4C8B7A"], ["Keruh", "> 25–50 NTU", "#C4622D"], ["Sangat Keruh", "> 50 NTU", "#8B3A1F"]].map(([label, range, color]) => <div key={label} className="threshold-row"><i style={{ background: color }} /><span>{label}</span><b>{range}</b></div>)}</section></div>
            <button className="reset-button" type="button" onClick={resetDemo}><Icon name="restart" /><span><b>Reset data demo</b><small>Kembalikan nilai stasiun, jumlah catatan, dan riwayat lokal ke kondisi awal.</small></span><strong>→</strong></button>
          </>}
        </section>
      </div>
      {toast && <div className="toast" role="status">✓ {toast}</div>}
      <footer className="app-footer">Jernih Brantas · Next.js + TypeScript · <span>DEMO LOCAL-FIRST</span></footer>
    </main>
  );
}
