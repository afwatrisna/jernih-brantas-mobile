"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  EQUIPMENT,
  classifyNtu,
  initialStationStates,
  type Reading,
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
  getConditionCopy,
  getSeverity,
  getStationInsight,
  seedHistory,
} from "@/lib/dashboard-utils";
import { useSupabaseReadings, type SupabaseReading } from "@/hooks/useSupabaseReadings";
import { useFieldModeAccess } from "@/hooks/useFieldModeAccess";
import { createAuthenticatedManualReading } from "@/lib/readings-client";

function toReading(row: SupabaseReading): Reading {
  return {
    id: row.id,
    ntu: Number(row.ntu),
    timestamp: new Date(row.created_at).getTime(),
    source: row.source,
    equipment: row.equipment,
  };
}

export function useHomeDashboard() {
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

  return {
    // navigation
    section,
    setSection,
    // stations & map
    stations,
    insights,
    activeId,
    activeStation,
    selectStation,
    mapFilter,
    setMapFilter,
    openAnalytics,
    // monitor metrics
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
    // field mode
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
    // analytics
    timeRange,
    setTimeRange,
    comparisonIds,
    comparisonStations,
    toggleComparison,
    displayRangeHistory,
    rangeAverage,
    rangeMin,
    rangeMax,
    activeHistory,
    history,
    rangeAnchor,
    exportCsv,
    // settings
    resetDemo,
    // chrome
    toast,
  };
}
