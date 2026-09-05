"use client";

import dynamic from "next/dynamic";
import {
  EQUIPMENT,
  NTU_PLAIN_EXPLANATION,
  WATER_CLASS_PLAIN_LABEL,
  classifyNtu,
  formatNtu,
} from "@/lib/jernih-data";
import {
  RANGE_MS,
  SEVERITY_META,
  formatDateTime,
  formatPercent,
  getSeverity,
} from "@/lib/dashboard-utils";
import { Icon } from "@/components/ui/icon";
import { NavButton } from "@/components/ui/nav-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTrust } from "@/components/ui/data-trust";
import { TrendChart } from "@/components/trend-chart";
import { AlertPanel } from "@/components/alert-panel";
import { SettingsSection } from "@/components/sections/settings-section";
import { useHomeDashboard } from "@/hooks/useHomeDashboard";

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
  const {
    section,
    setSection,
    stations,
    insights,
    activeId,
    activeStation,
    selectStation,
    mapFilter,
    setMapFilter,
    openAnalytics,
    simulation,
    setSimulation,
    demoDisplayMode,
    setDemoDisplayMode,
    average,
    compliant,
    activeAlerts,
    recordCount,
    hasRemoteReadings,
    activeClass,
    activeInsight,
    activeCondition,
    activeSource,
    updatedAt,
    latest,
    fieldStation,
    setFieldStation,
    fieldNtu,
    setFieldNtu,
    fieldEquipment,
    setFieldEquipment,
    fieldError,
    fieldAuthEmail,
    setFieldAuthEmail,
    fieldAuthMessage,
    fieldAuthSubmitting,
    selectedFieldStation,
    fieldValue,
    fieldClass,
    fieldAccess,
    fieldAccessLoading,
    fieldAccessIssue,
    canWriteFieldMode,
    requestFieldModeAccess,
    signOutFieldMode,
    saveMeasurement,
    timeRange,
    setTimeRange,
    comparisonIds,
    comparisonStations,
    toggleComparison,
    displayRangeHistory,
    rangeAverage,
    rangeMin,
    rangeMax,
    history,
    rangeAnchor,
    exportCsv,
    resetDemo,
    toast,
  } = useHomeDashboard();

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

          {section === "monitor" && (
            <section className="monitor-page">
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
            </section>
          )}

          {section === "field" && (
            <section className="field-page">
              <section className="intro"><h1>Catat Hasil Ukur</h1><p>Input manual petugas lapangan ke Supabase.</p></section>
              {!fieldAccess && (
                <form className="surface-card field-auth" onSubmit={(e) => { e.preventDefault(); void requestFieldModeAccess(); }}>
                  <h2>Masuk Field Mode</h2>
                  <p>Gunakan email petugas yang terdaftar untuk menerima tautan masuk.</p>
                  <label>Email<input type="email" value={fieldAuthEmail} onChange={(e) => setFieldAuthEmail(e.target.value)} required placeholder="petugas@contoh.id" /></label>
                  <button type="submit" disabled={fieldAuthSubmitting}>{fieldAuthSubmitting ? "Mengirim…" : "Kirim tautan masuk"}</button>
                  {fieldAuthMessage && <p className="field-msg">{fieldAuthMessage}</p>}
                  {fieldAccessIssue && <p className="field-error">{fieldAccessIssue}</p>}
                </form>
              )}
              {fieldAccess && (
                <>
                  <div className="field-session surface-card"><span>Masuk sebagai <b>{fieldAccess.email}</b> · {fieldAccess.role}</span><button type="button" onClick={() => void signOutFieldMode()}>Keluar</button></div>
                  <form className="surface-card field-form" onSubmit={saveMeasurement}>
                    <label>Stasiun<select value={fieldStation} onChange={(e) => setFieldStation(e.target.value)}>{stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
                    <label>Nilai NTU<input value={fieldNtu} onChange={(e) => setFieldNtu(e.target.value)} inputMode="decimal" placeholder="contoh 12.5" /></label>
                    <label>Peralatan<select value={fieldEquipment} onChange={(e) => setFieldEquipment(e.target.value as typeof fieldEquipment)}>{EQUIPMENT.map((eq) => <option key={eq} value={eq}>{eq}</option>)}</select></label>
                    {fieldClass && <p className="field-preview">Pratinjau: {fieldClass.label} · Kelas {fieldClass.grade}</p>}
                    {fieldError && <p className="field-error">{fieldError}</p>}
                    <button type="submit" disabled={fieldAccessLoading || !canWriteFieldMode}>Simpan ke Supabase</button>
                    {!canWriteFieldMode && fieldAccess && <p className="field-error">Akun ini tidak punya izin untuk {selectedFieldStation.name}.</p>}
                  </form>
                </>
              )}
            </section>
          )}

          {section === "analytics" && (
            <>
              <section className="intro"><h1>Analitik</h1><p>Tren, perbandingan, dan ekspor data stasiun aktif.</p></section>
              <div className="analytics-toolbar">
                <div className="range-pills">{(["24H", "7D", "30D", "90D"] as const).map((r) => <button key={r} type="button" className={timeRange === r ? "selected" : ""} onClick={() => setTimeRange(r)}>{r}</button>)}</div>
                <button type="button" className="export-btn" onClick={exportCsv}>Ekspor CSV</button>
              </div>
              <section className="surface-card"><div className="card-heading"><h2>{activeStation.name}</h2><StatusBadge insight={activeInsight} /></div><TrendChart history={displayRangeHistory} baseline={activeStation.baseline} /><div className="range-stats"><span>Rata-rata {formatNtu(rangeAverage)}</span><span>Min {formatNtu(rangeMin)}</span><span>Max {formatNtu(rangeMax)}</span></div></section>
              <section className="surface-card"><div className="card-heading"><h2>Perbandingan stasiun</h2></div><div className="comparison-chips">{stations.map((station) => <button type="button" key={station.id} className={comparisonIds.includes(station.id) ? "selected" : ""} onClick={() => toggleComparison(station.id)}><i style={{ background: insights[station.id].color }} />{station.name}</button>)}</div><div className="comparison-table">{comparisonStations.map((station) => { const stationHistory = (history[station.id] ?? []).filter((reading) => reading.timestamp >= rangeAnchor - RANGE_MS[timeRange]); const values = stationHistory.length ? stationHistory.map((reading) => reading.ntu) : [station.ntu]; const stationAverage = values.reduce((sum, value) => sum + value, 0) / values.length; return <article key={station.id}><div><span>{station.name}</span><StatusBadge insight={insights[station.id]} compact /></div><strong>{formatNtu(station.ntu)} <small>NTU</small></strong><p>Rata-rata {formatNtu(stationAverage)} · {formatPercent(insights[station.id].deviation)} vs baseline</p></article>; })}</div></section>
              <section className="surface-card history-card"><div className="card-heading"><div><h2>Riwayat pengukuran</h2><p>Terbaru berada di urutan pertama. Alert aktif atau resolved berasal dari pola pembacaan yang tersedia.</p></div></div>{[...displayRangeHistory].reverse().slice(0, 10).map((reading) => { const water = classifyNtu(reading.ntu); const severity = getSeverity(reading.ntu, activeStation.baseline); return <div className="history-row" key={reading.id}><i style={{ background: SEVERITY_META[severity].color }} /><span><strong>{formatDateTime(reading.timestamp)}</strong><small>{reading.source === "manual" ? "Input manual" : "Simulasi"} · {reading.equipment}</small></span><b>{formatNtu(reading.ntu)} <small>NTU</small></b><em style={{ color: water.color }}>{severity === "high" || severity === "critical" ? `${SEVERITY_META[severity].label} · ${severity === getSeverity(activeStation.ntu, activeStation.baseline) ? "Aktif" : "Resolved"}` : water.label}</em></div>; })}</section>
            </>
          )}

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
