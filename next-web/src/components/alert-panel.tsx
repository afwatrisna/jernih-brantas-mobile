import type { StationInsight, StationState } from "@/lib/dashboard-types";
import { formatNtu } from "@/lib/jernih-data";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";

type AlertPanelProps = {
  stations: StationState[];
  insights: Record<string, StationInsight>;
  /** Stasiun yang sedang dipilih di Monitor — sumber utama kartu Peringatan Dini */
  activeId: string;
  onSelect: (id: string) => void;
  onAnalytics: (id?: string) => void;
};

export function AlertPanel({
  stations,
  insights,
  activeId,
  onSelect,
  onAnalytics,
}: AlertPanelProps) {
  const activeStation =
    stations.find((station) => station.id === activeId) ?? stations[0];
  const activeInsight = insights[activeStation.id];
  const otherAttention = stations.filter(
    (station) =>
      station.id !== activeStation.id &&
      (insights[station.id].severity === "warning" ||
        insights[station.id].severity === "high" ||
        insights[station.id].severity === "critical" ||
        Boolean(insights[station.id].anomaly)),
  );
  const resolvedAlerts = stations.filter(
    (station) => insights[station.id].alertState === "resolved",
  );

  const mainStatus =
    activeInsight.severity === "critical"
      ? activeInsight.label.includes("Ekstrem")
        ? "Ekstrem"
        : "Kritis"
      : activeInsight.severity === "high"
        ? "Keruh"
        : activeInsight.severity === "warning"
          ? "Waspada"
          : "Aman";

  const isElevated = activeInsight.severity !== "normal";

  const anomalyCopy =
    activeInsight.anomaly === "Kenaikan cepat"
      ? "Kenaikan cepat terdeteksi pada beberapa pembacaan terakhir."
      : activeInsight.anomaly === "Abnormal berlanjut"
        ? "Nilai tinggi berlanjut dalam beberapa pembacaan terakhir."
        : activeInsight.anomaly === "Kekeruhan ekstrem"
          ? "Kategori ekstrem (>150 NTU) pada skala pemantauan sungai."
          : activeInsight.anomaly
            ? "Nilai menyimpang dari baseline stasiun dan perlu dipantau."
            : "";

  return (
    <div className="insight-grid">
      <section
        className={`alert-card severity-${activeInsight.severity}${
          activeInsight.label.includes("Ekstrem") ? " is-extreme" : ""
        }`}
      >
        <div className="alert-heading">
          <span>
            <Icon name="alert" /> PERINGATAN DINI
          </span>
          <StatusBadge insight={activeInsight} compact />
        </div>
        <p className="alert-station-context">
          Stasiun aktif · <b>{activeStation.name}</b> · {formatNtu(activeStation.ntu)} NTU
        </p>
        <h2>
          {mainStatus}
          {isElevated ? " · kekeruhan meningkat" : ""}
        </h2>
        <strong>
          {!isElevated
            ? "Kondisi sesuai rentang normal pemantauan untuk stasiun ini."
            : activeInsight.severity === "warning"
              ? "Nilai memasuki rentang waspada (15–30 NTU)."
              : activeInsight.severity === "high"
                ? "Nilai memasuki rentang keruh (30–60 NTU)."
                : "Nilai di rentang kritis — verifikasi lapangan disarankan."}
        </strong>
        {activeInsight.anomaly && (
          <div className="alert-anomaly-secondary">
            <div className="alert-divider" />
            <strong>Indikasi pola tidak biasa</strong>
            <p>{anomalyCopy}</p>
          </div>
        )}
        <div className="alert-actions">
          <button type="button" onClick={() => onSelect(activeStation.id)}>
            Fokus stasiun
          </button>
          <button type="button" onClick={() => onAnalytics(activeStation.id)}>
            Riwayat →
          </button>
        </div>
        {otherAttention.length > 0 && (
          <small className="resolved-note">
            {otherAttention.length} stasiun lain juga berstatus waspada atau lebih tinggi.
          </small>
        )}
        {resolvedAlerts.length > 0 && (
          <small className="resolved-note">
            {resolvedAlerts.length} alert sebelumnya berstatus Resolved setelah
            pembacaan kembali normal.
          </small>
        )}
      </section>
    </div>
  );
}
