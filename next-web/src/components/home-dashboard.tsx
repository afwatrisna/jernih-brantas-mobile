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
  return (
    <main className="app-shell">
      <header className="topbar">
        <span className="brand"><span className="brand-mark">◒</span><span><b>Jernih</b><small>BRANTAS · NEXT</small></span></span>
        <span className="demo-badge"><i /> REFACTOR IN PROGRESS</span>
      </header>
      <div className="workspace" style={{ padding: 24 }}>
        <h1>Dashboard sedang di-refactor</h1>
        <p>
          Modul UI (Icon, NavButton, StatusBadge, DataTrust, TrendChart, AlertPanel, SettingsSection)
          dan helper (dashboard-types, dashboard-utils) sudah di-extract.
          Salin file <code>home-dashboard.tsx</code> lengkap dari branch artifacts/zip untuk mengaktifkan UI penuh.
        </p>
        <p>Branch: <code>refactor/page-tsx-split</code></p>
      </div>
      <footer className="app-footer">Jernih Brantas · Next.js + TypeScript · <span>REFACTOR</span></footer>
    </main>
  );
}
