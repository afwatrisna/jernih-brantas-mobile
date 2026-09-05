import type { ReadingSource } from "@/lib/jernih-data";
import { formatTime } from "@/lib/jernih-data";
import { trustCopy } from "@/lib/dashboard-utils";
import { Icon } from "./icon";

type DataTrustProps = {
  source: ReadingSource;
  simulation: boolean;
  updatedAt: number;
  equipment: string;
};

export function DataTrust({
  source,
  simulation,
  updatedAt,
  equipment,
}: DataTrustProps) {
  const trust = trustCopy(source, simulation);
  const isManual = source === "manual";

  return (
    <details className="trust-strip" aria-label="Status kepercayaan data">
      <summary className="trust-summary">
        <span className="trust-title">
          <Icon name="shield" /> DETAIL SUMBER DATA
        </span>
        <span className="trust-summary-action">
          Lihat detail <b>+</b>
        </span>
      </summary>
      <div className="trust-details" aria-live="polite">
        <div className="trust-heading">
          <span className="trust-title">
            <Icon name="shield" /> DATA TRUST
          </span>
          <span className={`source-pill ${isManual ? "manual" : "simulation"}`}>
            <i />
            {trust.label}
          </span>
        </div>
        <div className="trust-grid">
          <div>
            <span>PEMBARUAN</span>
            <strong>{formatTime(updatedAt)} WIB</strong>
          </div>
          <div>
            <span>SUMBER</span>
            <strong>{equipment}</strong>
          </div>
          <div>
            <span>VALIDASI</span>
            <strong className={isManual || source === "simulation" ? "warning" : "good"}>
              {trust.detail}
            </strong>
          </div>
          <div>
            <span>PENYIMPANAN</span>
            <strong>Supabase + demo lokal</strong>
          </div>
        </div>
        <p>{trust.note}</p>
      </div>
    </details>
  );
}
