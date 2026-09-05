"use client";

import dynamic from "next/dynamic";
import {
  NTU_PLAIN_EXPLANATION,
  WATER_CLASS_PLAIN_LABEL,
  formatNtu,
  type ReadingSource,
  type StationState,
} from "@/lib/jernih-data";
import type { MapFilter, StationInsight } from "@/lib/dashboard-types";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTrust } from "@/components/ui/data-trust";
import { AlertPanel } from "@/components/alert-panel";

const BrantasMap = dynamic(
  () => import("@/components/brantas-map").then((module) => module.BrantasMap),
  {
    ssr: false,
    loading: () => (
      <div className="leaflet-map-placeholder">Memuat peta interaktif…</div>
    ),
  },
);

type WaterClass = {
  label: string;
  grade: string;
  color?: string;
};

type ConditionCopy = {
  title: string;
  detail: string;
};

export type MonitorSectionProps = {
  stations: StationState[];
  insights: Record<string, StationInsight>;
  activeId: string;
  activeStation: StationState;
  mapFilter: MapFilter;
  simulation: boolean;
  demoDisplayMode: boolean;
  average: number;
  compliant: number;
  activeAlerts: number;
  recordCount: number;
  hasRemoteReadings: boolean;
  activeClass: WaterClass;
  activeInsight: StationInsight;
  activeCondition: ConditionCopy;
  activeSource: ReadingSource;
  updatedAt: number;
  latestEquipment?: string;
  onSelectStation: (id: string) => void;
  onMapFilter: (filter: MapFilter) => void;
  onOpenAnalytics: (id?: string) => void;
  onOpenField: () => void;
};

export function MonitorSection({
  stations,
  insights,
  activeId,
  activeStation,
  mapFilter,
  simulation,
  demoDisplayMode,
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
  latestEquipment,
  onSelectStation,
  onMapFilter,
  onOpenAnalytics,
  onOpenField,
}: MonitorSectionProps) {
  return (
    <section className="monitor-page">
      <section className="intro monitor-intro">
        <h1>Monitor</h1>
        <p>Kondisi sungai secara langsung, per titik pantau.</p>
      </section>
      <div className="monitor-station-chips" aria-label="Pilih stasiun monitor">
        {stations.map((station) => (
          <button
            type="button"
            key={station.id}
            onClick={() => onSelectStation(station.id)}
            className={station.id === activeId ? "selected" : ""}
          >
            <i style={{ background: insights[station.id].color }} />
            <span>{station.name}</span>
          </button>
        ))}
      </div>
      <div className="mobile-stations">
        {stations.map((station) => (
          <button
            key={station.id}
            onClick={() => onSelectStation(station.id)}
            className={station.id === activeId ? "selected" : ""}
          >
            <b>{station.name}</b>
            <span>{formatNtu(station.ntu)} NTU</span>
            <i style={{ background: insights[station.id].color }} />
          </button>
        ))}
      </div>
      <div className="monitor-explore">
        <BrantasMap
          stations={stations}
          insights={insights}
          activeId={activeId}
          filter={mapFilter}
          onFilter={onMapFilter}
          onSelect={onSelectStation}
          onOpenAnalytics={() => onOpenAnalytics()}
        />
      </div>
      <section className={`hero-card severity-${activeInsight.severity}`}>
        <div className="hero-heading">
          <span className="hero-river">
            SUNGAI BRANTAS · {activeStation.subtitle.toUpperCase()}
          </span>
          <h2>{activeStation.name}</h2>
          <StatusBadge insight={activeInsight} compact />
        </div>
        <span className={`live-status ${simulation ? "live" : "paused"}`}>
          <i />
          {simulation ? "SIMULASI AKTIF" : "SIMULASI DIJEDA"}
        </span>
        <div className="hero-value">
          <strong key={activeStation.ntu}>{formatNtu(activeStation.ntu)}</strong>
          <span>NTU</span>
        </div>
        <div className="hero-condition">
          <div>
            <strong>{activeCondition.title}</strong>
            <span>
              {activeCondition.detail} {activeClass.label} · Kelas {activeClass.grade}.
            </span>
          </div>
        </div>
        <div className="gauge">
          <div className="gauge-track">
            <i
              style={{
                height: `${Math.min(100, Math.max(4, activeStation.ntu))}%`,
              }}
            />
          </div>
          <span>100</span>
          <span>50</span>
          <span>0</span>
        </div>
      </section>
      <p className="hero-plain-explainer">
        {NTU_PLAIN_EXPLANATION} Kelas {activeClass.grade}:{" "}
        {WATER_CLASS_PLAIN_LABEL[activeClass.grade as keyof typeof WATER_CLASS_PLAIN_LABEL]}.
      </p>
      <div className="metric-grid">
        <article>
          <Icon name="water" />
          <strong>{formatNtu(average)}</strong>
          <span>Rata-rata sungai</span>
        </article>
        <article
          className={
            compliant >= 4 ? "positive" : compliant >= 3 ? "attention" : "critical"
          }
        >
          <Icon name="check" />
          <strong>{compliant} / 5</strong>
          <span>Sesuai Kelas II</span>
        </article>
        <article className={activeAlerts > 0 ? "attention" : ""}>
          <Icon name="alert" />
          <strong>{activeAlerts}</strong>
          <span>Alert aktif</span>
        </article>
        <article>
          <Icon name="database" />
          <strong>{recordCount}</strong>
          <span>
            {demoDisplayMode
              ? "Catatan demo aktif"
              : hasRemoteReadings
                ? "Catatan Supabase"
                : "Catatan demo"}
          </span>
        </article>
      </div>
      <section className="monitor-priority" aria-labelledby="monitor-priority-title">
        <div className="monitor-section-heading">
          <span>PRIORITAS HARI INI</span>
          <h2 id="monitor-priority-title">Tinjau sebelum mengambil tindakan.</h2>
          <p>
            Alert dan pola tidak biasa ditampilkan lebih dahulu; keduanya tetap
            memerlukan verifikasi lapangan.
          </p>
        </div>
        <AlertPanel
          stations={stations}
          insights={insights}
          onSelect={onSelectStation}
          onAnalytics={onOpenAnalytics}
        />
      </section>
      <div className="monitor-action-bar" aria-label="Tindakan monitor">
        <button type="button" className="monitor-action-primary" onClick={onOpenField}>
          <span>
            <Icon name="field" /> Catat hasil ukur
          </span>
          <b>→</b>
        </button>
        <button
          type="button"
          className="monitor-action-secondary"
          onClick={() => onOpenAnalytics()}
        >
          <span>
            <Icon name="chart" /> Lihat analitik
          </span>
          <b>→</b>
        </button>
      </div>
      <DataTrust
        source={activeSource}
        simulation={simulation}
        updatedAt={updatedAt}
        equipment={demoDisplayMode ? "NTU-Logger demo" : latestEquipment ?? "NTU-Logger demo"}
      />
    </section>
  );
}
