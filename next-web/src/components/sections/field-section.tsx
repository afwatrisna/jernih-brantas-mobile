"use client";

import type { FormEvent } from "react";
import { EQUIPMENT, formatNtu, formatTime, type StationState } from "@/lib/jernih-data";
import type { FieldModeAccess } from "@/hooks/useFieldModeAccess";

type WaterClass = {
  label: string;
  grade: string;
};

type LastReading = {
  ntu: number;
  timestamp: number;
  source?: string;
};

export type FieldSectionProps = {
  stations: StationState[];
  fieldStation: string;
  fieldNtu: string;
  fieldEquipment: (typeof EQUIPMENT)[number];
  fieldError: string;
  fieldSuccess: string;
  fieldAuthEmail: string;
  fieldAuthMessage: string;
  fieldAuthSubmitting: boolean;
  selectedFieldStation: StationState;
  fieldClass: WaterClass | null;
  fieldAccess: FieldModeAccess | null;
  fieldAccessLoading: boolean;
  fieldAccessIssue: string;
  canWriteFieldMode: boolean;
  fieldLastReading: LastReading | null;
  onFieldStationChange: (id: string) => void;
  onFieldNtuChange: (value: string) => void;
  onFieldEquipmentChange: (value: (typeof EQUIPMENT)[number]) => void;
  onFieldAuthEmailChange: (value: string) => void;
  onRequestAccess: () => void;
  onSignOut: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
};

function relativeTimeId(timestamp: number, now = Date.now()) {
  if (!timestamp) return "belum ada data";
  const diff = Math.max(0, now - timestamp);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

function ntuClientIssue(raw: string): string | null {
  if (!raw.trim()) return null;
  const value = Number.parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(value)) return "Masukkan angka yang valid.";
  if (value < 0 || value > 500) return "Nilai harus antara 0 dan 500 NTU.";
  return null;
}

export function FieldSection({
  stations,
  fieldStation,
  fieldNtu,
  fieldEquipment,
  fieldError,
  fieldSuccess,
  fieldAuthEmail,
  fieldAuthMessage,
  fieldAuthSubmitting,
  selectedFieldStation,
  fieldClass,
  fieldAccess,
  fieldAccessLoading,
  fieldAccessIssue,
  canWriteFieldMode,
  fieldLastReading,
  onFieldStationChange,
  onFieldNtuChange,
  onFieldEquipmentChange,
  onFieldAuthEmailChange,
  onRequestAccess,
  onSignOut,
  onSave,
}: FieldSectionProps) {
  const clientIssue = ntuClientIssue(fieldNtu);
  const ntuInvalid = Boolean(clientIssue);

  return (
    <section className="field-page">
      <section className="intro">
        <h1>Catat Hasil Ukur</h1>
        <p>Catat pembacaan kekeruhan (NTU) dari pengukuran lapangan.</p>
      </section>

      {!fieldAccess && (
        <form
          className="surface-card field-auth"
          onSubmit={(e) => {
            e.preventDefault();
            onRequestAccess();
          }}
        >
          <h2>Masuk Mode Lapangan</h2>
          <p>Gunakan email petugas yang terdaftar untuk menerima tautan masuk.</p>
          <label className="field-label">
            <span className="field-label-text">Email</span>
            <input
              type="email"
              value={fieldAuthEmail}
              onChange={(e) => onFieldAuthEmailChange(e.target.value)}
              required
              placeholder="petugas@contoh.id"
            />
          </label>
          <button type="submit" className="field-primary-btn" disabled={fieldAuthSubmitting}>
            {fieldAuthSubmitting ? "Mengirim…" : "Kirim tautan masuk"}
          </button>
          {fieldAuthMessage && <p className="field-msg">{fieldAuthMessage}</p>}
          {fieldAccessIssue && <p className="field-error">{fieldAccessIssue}</p>}
        </form>
      )}

      {fieldAccess && (
        <>
          <div className="field-session surface-card">
            <div className="field-session-info">
              <span className="field-session-label">Sesi petugas</span>
              <span className="field-session-user">
                Masuk sebagai <b>{fieldAccess.email}</b>
              </span>
              <span className="field-session-role">{fieldAccess.role}</span>
            </div>
            <button type="button" className="field-session-exit" onClick={onSignOut}>
              Keluar
            </button>
          </div>

          {fieldLastReading && (
            <div className="field-context surface-card" aria-live="polite">
              <span className="field-context-label">
                Pembacaan terakhir · {selectedFieldStation.name}
              </span>
              <strong>{formatNtu(fieldLastReading.ntu)} NTU</strong>
              <span className="field-context-meta">
                {relativeTimeId(fieldLastReading.timestamp)}
                {" · "}
                {formatTime(fieldLastReading.timestamp)} WIB
                {fieldLastReading.source ? ` · ${fieldLastReading.source}` : ""}
              </span>
            </div>
          )}

          <form className="surface-card field-form" onSubmit={onSave}>
            <label className="field-label">
              <span className="field-label-text">Stasiun</span>
              <select
                value={fieldStation}
                onChange={(e) => onFieldStationChange(e.target.value)}
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-label">
              <span className="field-label-text">Nilai NTU</span>
              <input
                className={ntuInvalid ? "field-input-invalid" : undefined}
                value={fieldNtu}
                onChange={(e) => onFieldNtuChange(e.target.value)}
                inputMode="decimal"
                placeholder="Contoh: 12.5"
                aria-invalid={ntuInvalid}
                aria-describedby="field-ntu-hint"
              />
            </label>
            <p id="field-ntu-hint" className={`field-hint${ntuInvalid ? " is-error" : ""}`}>
              {clientIssue ?? "Rentang wajar: 0–500 NTU"}
            </p>

            <label className="field-label">
              <span className="field-label-text">Peralatan</span>
              <select
                value={fieldEquipment}
                onChange={(e) =>
                  onFieldEquipmentChange(e.target.value as (typeof EQUIPMENT)[number])
                }
              >
                {EQUIPMENT.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
            </label>

            {fieldClass &&
              Number.isFinite(Number.parseFloat(fieldNtu.replace(",", "."))) &&
              !ntuInvalid && (
                <p className="field-preview">
                  Pratinjau: {fieldClass.label} · Kelas {fieldClass.grade}
                </p>
              )}

            {fieldError && <p className="field-error">{fieldError}</p>}
            {fieldSuccess && <p className="field-success">{fieldSuccess}</p>}

            <button
              type="submit"
              className="field-primary-btn"
              disabled={fieldAccessLoading || !canWriteFieldMode || ntuInvalid}
            >
              Catat Pengukuran
            </button>
            {!canWriteFieldMode && fieldAccess && (
              <p className="field-error">
                Akun ini tidak punya izin untuk {selectedFieldStation.name}.
              </p>
            )}
          </form>
        </>
      )}
    </section>
  );
}
