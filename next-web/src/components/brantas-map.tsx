"use client";

import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import {
  GeoJSON,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import type { FeatureCollection, GeoJsonObject } from "geojson";

import { formatNtu, type StationState } from "@/lib/jernih-data";

export type BrantasMapFilter = "all" | "normal" | "warning" | "alert" | "anomaly";

export type BrantasMapInsight = {
  severity: "normal" | "warning" | "high" | "critical";
  label: string;
  color: string;
  deviation: number;
  anomaly: string | null;
  alertState: "active" | "resolved" | "none";
};

type BrantasMapProps = {
  stations: StationState[];
  insights: Record<string, BrantasMapInsight>;
  activeId: string;
  filter: BrantasMapFilter;
  onFilter: (filter: BrantasMapFilter) => void;
  onSelect: (id: string) => void;
  onOpenAnalytics: () => void;
};

const MAP_CENTER: [number, number] = [-7.64, 112.37];
const MAP_BOUNDS: [[number, number], [number, number]] = [
  [-8.32, 111.72],
  [-7.02, 113.12],
];

const FILTERS: Array<{ id: BrantasMapFilter; label: string }> = [
  { id: "all", label: "Semua" },
  { id: "normal", label: "Normal" },
  { id: "warning", label: "Warning" },
  { id: "alert", label: "Alert" },
  { id: "anomaly", label: "Anomali" },
];

function filterGeoJson(data: FeatureCollection): GeoJsonObject {
  const features = data.features.filter((feature) => {
    const name = feature.properties?.name;
    return (feature.geometry?.type === "LineString" || feature.geometry?.type === "MultiLineString") && typeof name === "string" && name.toLowerCase().includes("brantas");
  });
  return { ...data, features } as GeoJsonObject;
}

function MarkerIcon({
  severity,
  selected,
  anomaly,
  extreme = false,
}: {
  severity: BrantasMapInsight["severity"];
  selected: boolean;
  anomaly: boolean;
  extreme?: boolean;
}) {
  const sonar = selected
    ? `<i class="marker-sonar" aria-hidden="true"></i><i class="marker-sonar delay" aria-hidden="true"></i>`
    : "";
  return L.divIcon({
    className: "brantas-marker-icon",
    html: `<span class="brantas-marker-dot severity-${severity}${selected ? " selected" : ""}${anomaly ? " has-anomaly" : ""}${extreme ? " is-extreme" : ""}">${sonar}</span>`,
    iconSize: selected ? [32, 32] : [22, 22],
    iconAnchor: selected ? [16, 16] : [11, 11],
    popupAnchor: [0, -12],
  });
}

export function BrantasMap({
  stations,
  insights,
  activeId,
  filter,
  onFilter,
  onSelect,
  onOpenAnalytics,
}: BrantasMapProps) {
  const [geoJson, setGeoJson] = useState<GeoJsonObject | null>(null);
  const [geoJsonError, setGeoJsonError] = useState("");
  const [showLabels, setShowLabels] = useState(true);
  const selected = stations.find((station) => station.id === activeId) ?? stations[0];
  const selectedInsight = selected ? insights[selected.id] : undefined;

  useEffect(() => {
    let cancelled = false;
    fetch("/data/brantas-river.geojson")
      .then(async (response) => {
        if (!response.ok) throw new Error("GeoJSON tidak dapat dimuat.");
        return (await response.json()) as FeatureCollection;
      })
      .then((data) => {
        if (!cancelled) setGeoJson(filterGeoJson(data));
      })
      .catch((error: unknown) => {
        if (!cancelled) setGeoJsonError(error instanceof Error ? error.message : "GeoJSON tidak dapat dimuat.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleStations = useMemo(() => stations.filter((station) => {
    const insight = insights[station.id];
    if (filter === "normal") return insight.severity === "normal";
    if (filter === "warning") return insight.severity === "warning";
    if (filter === "alert") return insight.alertState === "active";
    if (filter === "anomaly") return Boolean(insight.anomaly);
    return true;
  }), [filter, insights, stations]);

  const lineStyle = useMemo(() => ({
    color: "#0C447C",
    weight: 4,
    opacity: 0.88,
    lineCap: "round" as const,
    lineJoin: "round" as const,
  }), []);

  if (!selected || !selectedInsight) return null;

  return (
    <section className="surface-card map-card">
      <div className="card-heading">
        <div>
          <h2>Aliran & titik pantau</h2>
          <p>Gunakan peta untuk melihat posisi stasiun dan status pembacaan.</p>
        </div>
        <span className="map-card-icon" aria-hidden="true">⌖</span>
      </div>

      <div className="map-controls">
        <div className="map-filter" aria-label="Filter status peta">
          {FILTERS.map((item) => (
            <button key={item.id} type="button" className={filter === item.id ? "active" : ""} onClick={() => onFilter(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <label className="map-label-toggle">
          <input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} />
          <span>Tampilkan nama stasiun aktif di peta</span>
        </label>
      </div>

      <div className="leaflet-map-frame">
        <MapContainer
          id="brantas-leaflet-map"
          center={MAP_CENTER}
          zoom={9}
          minZoom={8}
          maxZoom={14}
          maxBounds={MAP_BOUNDS}
          maxBoundsViscosity={1}
          scrollWheelZoom
          className="leaflet-map-canvas"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {geoJson && <GeoJSON data={geoJson} style={lineStyle} />}
          {visibleStations.map((station) => {
            const insight = insights[station.id];
            const isSelected = station.id === activeId;
            return (
              <Marker
                key={`${station.id}-${isSelected ? "on" : "off"}`}
                position={[station.lat, station.lng]}
                icon={MarkerIcon({ severity: insight.severity, selected: isSelected, anomaly: Boolean(insight.anomaly), extreme: insight.label.includes("Ekstrem") })}
                eventHandlers={{ click: () => onSelect(station.id) }}
              >
                {showLabels && station.id === activeId && <Tooltip permanent direction="top" offset={[0, -12]}>{station.name}</Tooltip>}
                <Popup>
                  <div className="leaflet-popup-content">
                    <strong>{station.name}</strong>
                    <span>{station.subtitle}</span>
                    <b>{formatNtu(station.ntu)} NTU</b>
                    <em className={`leaflet-popup-status severity-${insight.severity}`}>{insight.label}</em>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          {visibleStations.length === 0 && <div className="leaflet-empty-overlay">Tidak ada stasiun pada filter ini.</div>}
        </MapContainer>
        {geoJsonError && <p className="map-data-error">{geoJsonError}</p>}
        {!geoJson && !geoJsonError && <p className="map-loading">Memuat aliran Sungai Brantas…</p>}
      </div>

      <div className="map-legend" aria-label="Legenda peta">
        <span className="map-legend-item"><i className="map-legend-dot normal" aria-hidden="true" />Normal</span>
        <span className="map-legend-item"><i className="map-legend-dot warning" aria-hidden="true" />Waspada</span>
        <span className="map-legend-item"><i className="map-legend-dot review" aria-hidden="true" />Perlu ditinjau</span>
        <span className="map-legend-item"><i className="map-legend-line" aria-hidden="true" />Aliran sungai</span>
      </div>

      <div key={activeId} className="map-selection map-selection-enter">
        <div className="map-tooltip-heading">
          <div>
            <span>STASIUN DIPILIH</span>
            <strong>{selected.name}</strong>
          </div>
          <span className={`status-badge compact severity-${selectedInsight.severity}${selectedInsight.label.includes("Ekstrem") ? " is-extreme" : ""}`}><i />{selectedInsight.label}</span>
        </div>
        <p className="map-selection-meta">{selected.subtitle}{selectedInsight.anomaly ? ` · ${selectedInsight.anomaly}` : ""}</p>
        <button type="button" onClick={onOpenAnalytics}>Lihat analitik →</button>
      </div>
    </section>
  );
}
