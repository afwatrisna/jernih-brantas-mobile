import type { StationInsight, StationState } from "@/lib/dashboard-types";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";

type AlertPanelProps = {
  stations: StationState[];
  insights: Record<string, StationInsight>;
  onSelect: (id: string) => void;
  onAnalytics: (id?: string) => void;
};

export function AlertPanel({
  stations,
  insights,
  onSelect,
  onAnalytics,
}: AlertPanelProps) {
  const activeAlerts = stations.filter(
    (station) => insights[station.id].alertState === "active",
  );
  const resolvedAlerts = stations.filter(
    (station) => insights[station.id].alertState === "resolved",
  );
  const anomalyStations = stations.filter(
    (station) => insights[station.id].anomaly,
  );
  const priority = activeAlerts[0] ?? anomalyStations[0];
  const priorityInsight = priority ? insights[priority.id] : null;
  const anomalyCopy =
    priorityInsight?.anomaly === "Kenaikan cepat"
      ? "Kenaikan cepat terdeteksi, tetapi belum melewati ambang."
      : priorityInsight?.anomaly === "Abnormal berlanjut"
        ? "Nilai tinggi berlanjut dalam beberapa pembacaan terakhir."
        : priorityInsight?.anomaly
          ? "Nilai menyimpang dari baseline dan perlu dipantau."
          : "";
  const mainStatus =
    priorityInsight?.severity === "critical"
      ? "Critical"
      : priorityInsight?.severity === "high"
        ? "Perlu ditinjau"
        : priorityInsight?.severity === "warning"
          ? "Waspada"
          : "Aman";

  return (
    <div className="insight-grid">
      <section
        className={`alert-card ${priorityInsight ? `severity-${priorityInsight.severity}` : "normal"}`}
      >
        <div className="alert-heading">
          <span>
            <Icon name="alert" /> PERINGATAN DINI
          </span>
          {priorityInsight ? (
            <StatusBadge insight={priorityInsight} compact />
          ) : (
            <span className="quiet-label">Tidak ada indikasi aktif</span>
          )}
        </div>
        {priority && priorityInsight ? (
          <>
            <h2>
              {mainStatus}
              {priorityInsight.severity !== "normal" ? " · turbidity meningkat" : ""}
            </h2>
            <strong>
              {priorityInsight.severity === "normal"
                ? "Kondisi sesuai baseline stasiun."
                : priorityInsight.severity === "warning"
                  ? "Nilai mendekati ambang perhatian."
                  : "Nilai melewati ambang dan perlu ditinjau."}
            </strong>
            {priorityInsight.anomaly && (
              <div className="alert-anomaly-secondary">
                <div className="alert-divider" />
                <strong>Indikasi pola tidak biasa</strong>
                <p>{anomalyCopy}</p>
              </div>
            )}
            <div className="alert-actions">
              <button type="button" onClick={() => onSelect(priority.id)}>
                Lihat stasiun
              </button>
              <button type="button" onClick={() => onAnalytics(priority.id)}>
                Riwayat →
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Aman</h2>
            <strong>Kondisi sesuai baseline stasiun.</strong>
            <p>
              Belum ada indikasi yang memerlukan perhatian khusus dari pembacaan
              saat ini.
            </p>
          </>
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
