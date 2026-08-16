# Jernih Brantas: Field Mode + Data Trust HTML/CSS Draft

This update is designed for the supplied `jernih-brantas-fixed.html` React-in-HTML prototype. It keeps the existing visual language while separating **Monitor Mode** from a safer, more focused **Field Mode**.

## 1. Add these components before `function JernihApp()`

```jsx
function DataTrustStrip({ reading, simActive }) {
  const isManual = reading?.sumber === 'manual';
  const source = !reading
    ? 'BELUM ADA DATA'
    : isManual
      ? 'INPUT MANUAL'
      : simActive
        ? 'SIMULASI'
        : 'SENSOR';

  const sourceTone = !reading
    ? 'is-muted'
    : isManual
      ? 'is-warning'
      : simActive
        ? 'is-info'
        : 'is-good';

  return (
    <section className="data-trust" aria-label="Status kepercayaan data" aria-live="polite">
      <div className="trust-heading">
        <span className="trust-kicker">DATA TRUST</span>
        <span className={`trust-source ${sourceTone}`}>
          <span className="trust-source-dot" aria-hidden="true" />
          {source}
        </span>
      </div>

      <div className="trust-grid">
        <div className="trust-item">
          <span className="trust-label">PEMBARUAN</span>
          <strong>{reading ? `${reading.waktu} WIB` : 'Menunggu pembacaan'}</strong>
        </div>
        <div className="trust-item">
          <span className="trust-label">SUMBER</span>
          <strong>{reading ? reading.alat : 'Belum terhubung'}</strong>
        </div>
        <div className="trust-item">
          <span className="trust-label">VALIDASI</span>
          <strong className={isManual || simActive ? 'trust-warning' : 'trust-good'}>
            {isManual || simActive ? 'Perlu verifikasi' : 'Siap ditinjau'}
          </strong>
        </div>
        <div className="trust-item">
          <span className="trust-label">PENYIMPANAN</span>
          <strong>Lokal di perangkat</strong>
        </div>
      </div>

      {(isManual || simActive) && (
        <p className="trust-notice">
          {simActive
            ? 'Nilai simulasi hanya untuk demonstrasi dan tidak boleh dipakai sebagai data lingkungan resmi.'
            : 'Pembacaan manual perlu dibandingkan dengan alat referensi atau prosedur kalibrasi sebelum dipublikasikan.'}
        </p>
      )}
    </section>
  );
}

function FieldMode({
  aktif,
  formStasiun,
  setFormStasiun,
  formNtu,
  setFormNtu,
  formAlat,
  setFormAlat,
  handleSubmit,
  saving,
}) {
  const selectedStation = STASIUN_AWAL.find(s => s.id === formStasiun) || aktif;
  const previewNtu = Number.parseFloat(formNtu);
  const previewClass = Number.isFinite(previewNtu) ? klasifikasi(previewNtu) : null;

  return (
    <section className="field-mode" aria-labelledby="field-mode-title">
      <header className="field-mode-header">
        <div>
          <span className="eyebrow">FIELD MODE</span>
          <h1 id="field-mode-title">Catat pembacaan lapangan.</h1>
          <p>Lengkapi tiga langkah berikut untuk menyimpan pengukuran lokal.</p>
        </div>
        <div className="field-location" aria-label={`Stasiun saat ini ${selectedStation.nama}`}>
          <span className="field-location-label">STASIUN DIPILIH</span>
          <strong>{selectedStation.nama}</strong>
          <span>{selectedStation.sub}</span>
        </div>
      </header>

      <ol className="field-steps" aria-label="Tahapan pengukuran">
        <li className="field-step is-current"><span>1</span>Pilih titik</li>
        <li className="field-step"><span>2</span>Masukkan NTU</li>
        <li className="field-step"><span>3</span>Tinjau & simpan</li>
      </ol>

      <form className="field-form" onSubmit={handleSubmit}>
        <div className="field-form-grid">
          <label className="field-control">
            <span>STASIUN</span>
            <select value={formStasiun} onChange={e => setFormStasiun(e.target.value)}>
              {STASIUN_AWAL.map(s => <option key={s.id} value={s.id}>{s.nama} — {s.sub}</option>)}
            </select>
          </label>

          <label className="field-control">
            <span>ALAT</span>
            <select value={formAlat} onChange={e => setFormAlat(e.target.value)}>
              {ALAT.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
        </div>

        <label className="field-control field-ntu-control">
          <span>KEKERUHAN TERBACA</span>
          <div className="field-ntu-input">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max="500"
              placeholder="18.4"
              value={formNtu}
              onChange={e => setFormNtu(e.target.value)}
              required
              aria-describedby="ntu-help"
            />
            <b>NTU</b>
          </div>
          <small id="ntu-help">Masukkan 0–500 NTU. Gunakan satu angka desimal bila diperlukan.</small>
        </label>

        <div className={`field-review ${previewClass ? 'has-value' : ''}`}>
          <div>
            <span className="review-label">TINJAU KLASIFIKASI</span>
            {previewClass ? (
              <strong style={{ color: previewClass.color }}>
                {previewNtu.toFixed(1)} NTU · {previewClass.label} · Kelas {previewClass.kelas}
              </strong>
            ) : (
              <strong>Masukkan nilai NTU untuk melihat klasifikasi.</strong>
            )}
          </div>
          <span className="review-note">Status akhir tetap perlu mengikuti prosedur verifikasi lapangan.</span>
        </div>

        <button className="field-save" type="submit" disabled={saving}>
          {saving ? 'Menyimpan pengukuran…' : 'Simpan pengukuran lokal'}
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <footer className="field-footnote">
        <span aria-hidden="true">◌</span>
        Data tersimpan di perangkat ini. Sinkronisasi ke server dapat ditambahkan setelah backend tersedia.
      </footer>
    </section>
  );
}
```

## 2. Add state and derived values in `JernihApp()`

Place the first line immediately after the existing `simActive` state. Place `entriTerakhirAktif` below the existing `riwayatAktif` declaration.

```jsx
const [mode, setMode] = useState('monitor');

const entriTerakhirAktif = (riwayat[aktifId] || []).slice(-1)[0] || null;
```

## 3. Insert this workspace switcher and Data Trust strip at the top of `<main>`

Insert it immediately after the opening `<main ...>` element at the existing line where the dashboard begins.

```jsx
<div className="workspace-toolbar">
  <div className="mode-tabs" role="tablist" aria-label="Mode ruang kerja">
    <button
      type="button"
      role="tab"
      aria-selected={mode === 'monitor'}
      className={mode === 'monitor' ? 'is-active' : ''}
      onClick={() => setMode('monitor')}
    >
      Monitor
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={mode === 'field'}
      className={mode === 'field' ? 'is-active' : ''}
      onClick={() => setMode('field')}
    >
      Field Mode
    </button>
  </div>
  <span className="workspace-context">
    {mode === 'field' ? 'Fokus pengukuran manual' : 'Ringkasan kondisi stasiun'}
  </span>
</div>

<DataTrustStrip reading={entriTerakhirAktif} simActive={simActive} />

{mode === 'field' ? (
  <FieldMode
    aktif={aktif}
    formStasiun={formStasiun}
    setFormStasiun={setFormStasiun}
    formNtu={formNtu}
    setFormNtu={setFormNtu}
    formAlat={formAlat}
    setFormAlat={setFormAlat}
    handleSubmit={handleSubmit}
    saving={saving}
  />
) : (
  <>
    {/* Keep the existing Gauge Card, classification legend, chart, map, and log here. */}
  </>
)}
```

Move the current monitor-only markup—from the **Gauge Card** through the **Log Data** block—inside the `<>...</>` fragment. Remove the existing **Input Manual** form from the monitor grid; Field Mode becomes the single, deliberate manual-recording flow.

Add this monitor-side call to action where the old form card was located:

```jsx
<section className="field-cta" aria-labelledby="field-cta-title">
  <span className="eyebrow">PENGUKURAN LAPANGAN</span>
  <h2 id="field-cta-title">Siap mencatat hasil turbidimeter?</h2>
  <p>Gunakan Field Mode agar stasiun, alat, nilai NTU, dan status verifikasi tercatat secara konsisten.</p>
  <button type="button" onClick={() => setMode('field')}>
    Buka Field Mode <span aria-hidden="true">→</span>
  </button>
</section>
```

## 4. Add the following CSS inside the existing `<style>` block

```css
:root {
  --ink: #0F1E1C;
  --river: #2D6A5C;
  --river-mid: #4C8B7A;
  --sand: #F5F1E8;
  --paper: #FFFDF8;
  --line: rgba(15, 30, 28, 0.12);
  --muted: #68756D;
  --warning: #C4622D;
  --danger: #8B3A1F;
}

.workspace-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.mode-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #EAE4D4;
}

.mode-tabs button {
  min-height: 38px;
  padding: 0 14px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--muted);
  font: 700 12px 'Inter', sans-serif;
  cursor: pointer;
}

.mode-tabs button.is-active {
  background: var(--paper);
  color: var(--ink);
  box-shadow: 0 2px 8px rgba(15, 30, 28, 0.10);
}

.mode-tabs button:focus-visible,
.field-cta button:focus-visible,
.field-save:focus-visible,
.field-control select:focus-visible,
.field-ntu-input input:focus-visible {
  outline: 3px solid rgba(76, 139, 122, 0.38);
  outline-offset: 2px;
}

.workspace-context {
  color: var(--muted);
  font: 500 12px 'IBM Plex Mono', monospace;
}

.data-trust {
  border: 1px solid #CFE1D7;
  border-radius: 18px;
  padding: 16px;
  background: #F2F7F3;
}

.trust-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.trust-kicker,
.trust-label,
.review-label,
.field-control > span,
.field-location-label {
  color: #527565;
  font: 700 10px 'IBM Plex Mono', monospace;
  letter-spacing: 0.08em;
}

.trust-source {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 9px;
  border-radius: 999px;
  font: 700 10px 'IBM Plex Mono', monospace;
}

.trust-source-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.trust-source.is-good { color: #216450; background: rgba(45, 106, 92, 0.12); }
.trust-source.is-info { color: #2D6A5C; background: rgba(76, 139, 122, 0.14); }
.trust-source.is-warning { color: #A84D22; background: rgba(196, 98, 45, 0.14); }
.trust-source.is-muted { color: #68756D; background: rgba(104, 117, 109, 0.12); }

.trust-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.trust-item {
  min-height: 68px;
  padding: 11px;
  border: 1px solid rgba(45, 106, 92, 0.14);
  border-radius: 12px;
  background: rgba(255, 253, 248, 0.72);
}

.trust-item strong {
  display: block;
  margin-top: 6px;
  color: var(--ink);
  font-size: 12px;
  line-height: 1.35;
}

.trust-warning { color: #A84D22 !important; }
.trust-good { color: #216450 !important; }

.trust-notice {
  margin-top: 12px;
  color: #6F523D;
  font-size: 12px;
  line-height: 1.45;
}

.field-mode {
  overflow: hidden;
  border: 1px solid rgba(15, 30, 28, 0.16);
  border-radius: 24px;
  background: var(--paper);
  box-shadow: 0 24px 48px -32px rgba(15, 30, 28, 0.34);
}

.field-mode-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  color: var(--paper);
  background: var(--ink);
}

.eyebrow { color: #8FD9B8; font: 700 10px 'IBM Plex Mono', monospace; letter-spacing: 0.1em; }
.field-mode h1 { margin-top: 8px; font: 700 30px/1.1 'Fraunces', serif; }
.field-mode-header p { max-width: 560px; margin-top: 8px; color: rgba(245, 241, 232, 0.68); font-size: 13px; line-height: 1.55; }

.field-location {
  min-width: 180px;
  padding: 14px;
  border: 1px solid rgba(245, 241, 232, 0.16);
  border-radius: 14px;
  background: rgba(245, 241, 232, 0.06);
}

.field-location-label { display: block; color: rgba(245, 241, 232, 0.56); }
.field-location strong { display: block; margin-top: 7px; font-size: 14px; }
.field-location > span:last-child { display: block; margin-top: 3px; color: rgba(245, 241, 232, 0.58); font-size: 11px; }

.field-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 0;
  padding: 18px 28px;
  list-style: none;
  border-bottom: 1px solid var(--line);
  background: #F8F5ED;
}

.field-step {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

.field-step span {
  display: grid;
  width: 23px;
  height: 23px;
  place-items: center;
  border: 1px solid #CFC7B5;
  border-radius: 50%;
  color: #68756D;
  font: 700 11px 'IBM Plex Mono', monospace;
}

.field-step.is-current { color: var(--ink); }
.field-step.is-current span { border-color: var(--river); color: var(--paper); background: var(--river); }

.field-form { padding: 28px; }
.field-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.field-control { display: block; }
.field-control > span { display: block; margin-bottom: 7px; }

.field-control select {
  width: 100%;
  min-height: 48px;
  padding: 0 12px;
  border: 1px solid #CEC7B8;
  border-radius: 11px;
  background: #FFFDF8;
  color: var(--ink);
  font: 600 13px 'Inter', sans-serif;
}

.field-ntu-control { margin-top: 18px; }
.field-ntu-input {
  display: flex;
  align-items: center;
  min-height: 76px;
  padding: 0 16px;
  border: 1.5px solid #3D7C68;
  border-radius: 14px;
  background: #F7FBF8;
}

.field-ntu-input input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
  font: 700 36px 'Fraunces', serif;
}

.field-ntu-input b { color: var(--river); font: 700 13px 'IBM Plex Mono', monospace; }
.field-control small { display: block; margin-top: 7px; color: var(--muted); font-size: 11px; }

.field-review {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-top: 18px;
  padding: 15px;
  border: 1px dashed #CFC7B5;
  border-radius: 14px;
  background: #F8F5ED;
}

.field-review.has-value { border-color: #8DB5A3; background: #EDF6F0; }
.field-review strong { display: block; margin-top: 6px; color: #68756D; font-size: 13px; }
.review-note { max-width: 280px; color: var(--muted); font-size: 11px; line-height: 1.45; }

.field-save {
  display: flex;
  width: 100%;
  min-height: 53px;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding: 0 17px;
  border: 0;
  border-radius: 13px;
  background: var(--river);
  color: var(--paper);
  font: 700 14px 'Inter', sans-serif;
  cursor: pointer;
}

.field-save:hover:not(:disabled),
.field-cta button:hover { background: #1F594A; }
.field-save:disabled { cursor: wait; opacity: 0.65; }
.field-save span { font-size: 20px; }

.field-footnote {
  padding: 16px 28px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  background: #F8F5ED;
  font-size: 11px;
  line-height: 1.45;
}
.field-footnote span { color: var(--river); font-weight: 700; }

.field-cta {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  justify-content: center;
  padding: 24px;
  border-radius: 20px;
  color: var(--paper);
  background: #17302B;
}
.field-cta h2 { margin-top: 9px; font: 700 23px/1.15 'Fraunces', serif; }
.field-cta p { margin-top: 9px; color: rgba(245, 241, 232, 0.65); font-size: 12px; line-height: 1.5; }
.field-cta button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 46px;
  margin-top: 20px;
  padding: 0 13px;
  border: 0;
  border-radius: 11px;
  color: var(--ink);
  background: #A9CBBE;
  font: 700 13px 'Inter', sans-serif;
  cursor: pointer;
}

@media (max-width: 760px) {
  .workspace-toolbar,
  .field-mode-header,
  .field-review { align-items: stretch; flex-direction: column; }
  .workspace-context { display: none; }
  .trust-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .field-mode-header, .field-form { padding: 21px; }
  .field-steps { padding: 15px 21px; }
  .field-form-grid { grid-template-columns: 1fr; }
  .field-location { min-width: 0; }
  .field-mode h1 { font-size: 26px; }
  .review-note { max-width: none; }
}

@media (max-width: 430px) {
  .trust-grid { grid-template-columns: 1fr; }
  .field-steps { grid-template-columns: 1fr; }
}
```

## What this update deliberately does not do

The draft does not introduce user accounts, cloud synchronization, sensor pairing, camera capture, or a final calibration workflow. It presents their future state honestly in the interface, but keeps the current prototype local-first and clearly labels simulated or manual data.
