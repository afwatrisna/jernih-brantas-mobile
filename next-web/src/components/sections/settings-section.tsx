import { Icon } from "@/components/ui/icon";

type SettingsSectionProps = {
  simulation: boolean;
  demoDisplayMode: boolean;
  hasRemoteReadings: boolean;
  recordCount: number;
  onToggleSimulation: () => void;
  onToggleDemoDisplayMode: () => void;
  onResetDemo: () => void;
};

export function SettingsSection({
  simulation,
  demoDisplayMode,
  hasRemoteReadings,
  recordCount,
  onToggleSimulation,
  onToggleDemoDisplayMode,
  onResetDemo,
}: SettingsSectionProps) {
  return (
    <>
      <section className="intro">
        <span className="mode-eyebrow">
          <Icon name="settings" /> PENGATURAN
        </span>
        <h1>
          Kendalikan cara
          <br />
          demo bekerja.
        </h1>
        <p>
          Pengaturan mengelola simulator, pilihan tampilan demo, pembacaan
          Supabase yang tersedia, dan referensi klasifikasi untuk seluruh
          website.
        </p>
      </section>

      <div className="settings-layout">
        <section className="settings-card">
          <div className="setting-row">
            <span className="setting-icon">
              <Icon name="field" />
            </span>
            <div>
              <h2>Mode Simulasi</h2>
              <p>
                {simulation
                  ? "Aktif · nilai baru dibuat setiap 4 detik, termasuk contoh kenaikan mendadak untuk demonstrasi alert."
                  : "Dijeda · nilai saat ini tetap dapat ditinjau."}
              </p>
            </div>
            <button
              className={`switch ${simulation ? "on" : ""}`}
              type="button"
              onClick={onToggleSimulation}
              role="switch"
              aria-checked={simulation}
            >
              <i />
            </button>
          </div>

          <div className="setting-divider" />

          <div className="setting-row">
            <span className="setting-icon">
              <Icon name="water" />
            </span>
            <div>
              <h2>Data demo untuk presentasi</h2>
              <p>
                {demoDisplayMode
                  ? "Aktif · Monitor dan Analitik memakai simulasi lokal yang jelas diberi label. Catatan Supabase tetap tersimpan dan tidak dihapus."
                  : "Nonaktif · Monitor dan Analitik menampilkan pembacaan terbaru yang tersedia dari Supabase."}
              </p>
            </div>
            <button
              className={`switch ${demoDisplayMode ? "on" : ""}`}
              type="button"
              onClick={onToggleDemoDisplayMode}
              role="switch"
              aria-checked={demoDisplayMode}
            >
              <i />
            </button>
          </div>

          <div className="setting-divider" />

          <div className="setting-row">
            <span className="setting-icon">
              <Icon name="database" />
            </span>
            <div>
              <h2>
                {hasRemoteReadings ? "Data pada Supabase" : "Data demo lokal"}
              </h2>
              <p>
                {hasRemoteReadings
                  ? `${recordCount} catatan tersedia dari Supabase. ${
                      demoDisplayMode
                        ? "Mode demo sedang menampilkannya sebagai data terpisah."
                        : "Pembacaan manual tetap memerlukan verifikasi."
                    }`
                  : "Riwayat simulasi dipakai sebagai fallback sampai pembacaan Supabase tersedia."}
              </p>
            </div>
          </div>
        </section>

        <section className="surface-card thresholds">
          <div className="card-heading">
            <div>
              <h2>Aturan status</h2>
              <p>
                Alert memakai nilai NTU dan penyimpangan terhadap baseline;
                hasilnya tetap memerlukan verifikasi.
              </p>
            </div>
          </div>
          {(
            [
              ["Normal", "dalam pola", "#2D6A5C"],
              ["Warning", ">25 NTU / deviasi", "#A27719"],
              ["High", "≥50 NTU", "#C4622D"],
              ["Critical", "≥75 NTU", "#8B3A1F"],
            ] as const
          ).map(([label, range, color]) => (
            <div key={label} className="threshold-row">
              <i style={{ background: color }} />
              <span>{label}</span>
              <b>{range}</b>
            </div>
          ))}
        </section>
      </div>

      <button className="reset-button" type="button" onClick={onResetDemo}>
        <Icon name="restart" />
        <span>
          <b>Reset data demo</b>
          <small>
            Kembalikan nilai stasiun, riwayat 90 hari simulasi, dan alert lokal
            ke kondisi awal.
          </small>
        </span>
        <strong>→</strong>
      </button>
    </>
  );
}
