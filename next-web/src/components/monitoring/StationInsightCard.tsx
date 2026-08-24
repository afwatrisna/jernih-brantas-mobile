"use client";

import type { CSSProperties } from "react";
import type { Reading, StationState } from "../../lib/monitoring";
import { getStationInsight } from "../../lib/monitoring";

export function StationInsightCard({ station, readings }: { station: StationState; readings: Reading[] }) {
  const insight = getStationInsight(station, readings);
  const style = { "--accent": insight.color, "--accent-soft": insight.softColor } as CSSProperties;

  return (
    <article className="station-insight-card" style={style}>
      <div>
        <strong>{station.name}</strong>
        <span>{insight.label}</span>
      </div>
      <div>
        <b>{station.ntu.toFixed(1)} NTU</b>
        {insight.anomaly && <small>{insight.anomaly}</small>}
      </div>
    </article>
  );
}
