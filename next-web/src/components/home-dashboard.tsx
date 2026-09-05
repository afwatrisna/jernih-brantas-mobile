"use client";

import { NavButton } from "@/components/ui/nav-button";
import { SettingsSection } from "@/components/sections/settings-section";
import { MonitorSection } from "@/components/sections/monitor-section";
import { FieldSection } from "@/components/sections/field-section";
import { AnalyticsSection } from "@/components/sections/analytics-section";
import { useHomeDashboard } from "@/hooks/useHomeDashboard";

export default function Home() {
  const d = useHomeDashboard();

  return (
    <main className="app-shell">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => d.setSection("monitor")}
          aria-label="Beranda Jernih"
        >
          <span className="brand-mark">◒</span>
          <span>
            <b>Jernih</b>
            <small>BRANTAS · NEXT</small>
          </span>
        </button>
        <span className="demo-badge">
          <i /> NEXT.JS DEMO
        </span>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <button
            className="sidebar-brand"
            onClick={() => d.setSection("monitor")}
            aria-label="Beranda Jernih"
          >
            <span className="brand-mark">◒</span>
            <span>
              <b>Jernih</b>
              <small>BRANTAS · NEXT</small>
            </span>
          </button>
          <span className="sidebar-label">RUANG KERJA</span>
          <div className="sidebar-nav">
            <NavButton
              active={d.section === "monitor"}
              icon="grid"
              label="Monitor"
              onClick={() => d.setSection("monitor")}
            />
            <NavButton
              active={d.section === "field"}
              icon="field"
              label="Catat Hasil Ukur"
              onClick={() => d.setSection("field")}
            />
            <NavButton
              active={d.section === "analytics"}
              icon="chart"
              label="Analitik"
              onClick={() => d.setSection("analytics")}
            />
            <NavButton
              active={d.section === "settings"}
              icon="settings"
              label="Pengaturan"
              onClick={() => d.setSection("settings")}
            />
          </div>
        </aside>

        <section className="content">
          <div className="mobile-nav">
            <NavButton
              active={d.section === "monitor"}
              icon="grid"
              label="Monitor"
              onClick={() => d.setSection("monitor")}
            />
            <NavButton
              active={d.section === "field"}
              icon="field"
              label="Catat"
              onClick={() => d.setSection("field")}
            />
            <NavButton
              active={d.section === "analytics"}
              icon="chart"
              label="Analitik"
              onClick={() => d.setSection("analytics")}
            />
            <NavButton
              active={d.section === "settings"}
              icon="settings"
              label="Atur"
              onClick={() => d.setSection("settings")}
            />
          </div>

          {d.section === "monitor" && (
            <MonitorSection
              stations={d.stations}
              insights={d.insights}
              activeId={d.activeId}
              activeStation={d.activeStation}
              mapFilter={d.mapFilter}
              simulation={d.simulation}
              demoDisplayMode={d.demoDisplayMode}
              average={d.average}
              compliant={d.compliant}
              activeAlerts={d.activeAlerts}
              recordCount={d.recordCount}
              hasRemoteReadings={d.hasRemoteReadings}
              activeClass={d.activeClass}
              activeInsight={d.activeInsight}
              activeCondition={d.activeCondition}
              activeSource={d.activeSource}
              updatedAt={d.updatedAt}
              latestEquipment={d.latest?.equipment}
              onSelectStation={d.selectStation}
              onMapFilter={d.setMapFilter}
              onOpenAnalytics={d.openAnalytics}
              onOpenField={() => d.setSection("field")}
            />
          )}

          {d.section === "field" && (
            <FieldSection
              stations={d.stations}
              fieldStation={d.fieldStation}
              fieldNtu={d.fieldNtu}
              fieldEquipment={d.fieldEquipment}
              fieldError={d.fieldError}
              fieldAuthEmail={d.fieldAuthEmail}
              fieldAuthMessage={d.fieldAuthMessage}
              fieldAuthSubmitting={d.fieldAuthSubmitting}
              selectedFieldStation={d.selectedFieldStation}
              fieldClass={d.fieldClass}
              fieldAccess={d.fieldAccess}
              fieldAccessLoading={d.fieldAccessLoading}
              fieldAccessIssue={d.fieldAccessIssue}
              canWriteFieldMode={d.canWriteFieldMode}
              onFieldStationChange={d.setFieldStation}
              onFieldNtuChange={d.setFieldNtu}
              onFieldEquipmentChange={d.setFieldEquipment}
              onFieldAuthEmailChange={d.setFieldAuthEmail}
              onRequestAccess={() => void d.requestFieldModeAccess()}
              onSignOut={() => void d.signOutFieldMode()}
              onSave={d.saveMeasurement}
            />
          )}

          {d.section === "analytics" && (
            <AnalyticsSection
              stations={d.stations}
              insights={d.insights}
              activeStation={d.activeStation}
              activeInsight={d.activeInsight}
              timeRange={d.timeRange}
              comparisonIds={d.comparisonIds}
              comparisonStations={d.comparisonStations}
              displayRangeHistory={d.displayRangeHistory}
              rangeAverage={d.rangeAverage}
              rangeMin={d.rangeMin}
              rangeMax={d.rangeMax}
              history={d.history}
              rangeAnchor={d.rangeAnchor}
              onTimeRangeChange={d.setTimeRange}
              onToggleComparison={d.toggleComparison}
              onExportCsv={d.exportCsv}
            />
          )}

          {d.section === "settings" && (
            <SettingsSection
              simulation={d.simulation}
              demoDisplayMode={d.demoDisplayMode}
              hasRemoteReadings={d.hasRemoteReadings}
              recordCount={d.recordCount}
              onToggleSimulation={() => d.setSimulation((value) => !value)}
              onToggleDemoDisplayMode={() => d.setDemoDisplayMode((value) => !value)}
              onResetDemo={d.resetDemo}
            />
          )}
        </section>
      </div>
      {d.toast && (
        <div className="toast" role="status">
          ✓ {d.toast}
        </div>
      )}
      <footer className="app-footer">
        Jernih Brantas · Next.js + TypeScript · <span>SUPABASE + DEMO</span>
      </footer>
    </main>
  );
}
