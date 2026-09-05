"use client";

import type { FormEvent } from "react";
import { EQUIPMENT, type StationState } from "@/lib/jernih-data";
import type { FieldModeAccess } from "@/hooks/useFieldModeAccess";

type WaterClass = {
  label: string;
  grade: string;
};

export type FieldSectionProps = {
  stations: StationState[];
  fieldStation: string;
  fieldNtu: string;
  fieldEquipment: (typeof EQUIPMENT)[number];
  fieldError: string;
  fieldAuthEmail: string;
  fieldAuthMessage: string;
  fieldAuthSubmitting: boolean;
  selectedFieldStation: StationState;
  fieldClass: WaterClass | null;
  fieldAccess: FieldModeAccess | null;
  fieldAccessLoading: boolean;
  fieldAccessIssue: string;
  canWriteFieldMode: boolean;
  onFieldStationChange: (id: string) => void;
  onFieldNtuChange: (value: string) => void;
  onFieldEquipmentChange: (value: (typeof EQUIPMENT)[number]) => void;
  onFieldAuthEmailChange: (value: string) => void;
  onRequestAccess: () => void;
  onSignOut: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
};

export function FieldSection({
  stations,
  fieldStation,
  fieldNtu,
  fieldEquipment,
  fieldError,
  fieldAuthEmail,
  fieldAuthMessage,
  fieldAuthSubmitting,
  selectedFieldStation,
  fieldClass,
  fieldAccess,
  fieldAccessLoading,
  fieldAccessIssue,
  canWriteFieldMode,
  onFieldStationChange,
  onFieldNtuChange,
  onFieldEquipmentChange,
  onFieldAuthEmailChange,
  onRequestAccess,
  onSignOut,
  onSave,
}: FieldSectionProps) {
  return (
    <section className="field-page">
      <section className="intro">
        <h1>Catat Hasil Ukur</h1>
        <p>Input manual petugas lapangan ke Supabase.</p>
      </section>
      {!fieldAccess && (
        <form
          className="surface-card field-auth"
          onSubmit={(e) => {
            e.preventDefault();
            onRequestAccess();
          }}
        >
          <h2>Masuk Field Mode</h2>
          <p>Gunakan email petugas yang terdaftar untuk menerima tautan masuk.</p>
          <label>
            Email
            <input
              type="email"
              value={fieldAuthEmail}
              onChange={(e) => onFieldAuthEmailChange(e.target.value)}
              required
              placeholder="petugas@contoh.id"
            />
          </label>
          <button type="submit" disabled={fieldAuthSubmitting}>
            {fieldAuthSubmitting ? "Mengirim…" : "Kirim tautan masuk"}
          </button>
          {fieldAuthMessage && <p className="field-msg">{fieldAuthMessage}</p>}
          {fieldAccessIssue && <p className="field-error">{fieldAccessIssue}</p>}
        </form>
      )}
      {fieldAccess && (
        <>
          <div className="field-session surface-card">
            <span>
              Masuk sebagai <b>{fieldAccess.email}</b> · {fieldAccess.role}
            </span>
            <button type="button" onClick={onSignOut}>
              Keluar
            </button>
          </div>
          <form className="surface-card field-form" onSubmit={onSave}>
            <label>
              Stasiun
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
            <label>
              Nilai NTU
              <input
                value={fieldNtu}
                onChange={(e) => onFieldNtuChange(e.target.value)}
                inputMode="decimal"
                placeholder="contoh 12.5"
              />
            </label>
            <label>
              Peralatan
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
            {fieldClass && (
              <p className="field-preview">
                Pratinjau: {fieldClass.label} · Kelas {fieldClass.grade}
              </p>
            )}
            {fieldError && <p className="field-error">{fieldError}</p>}
            <button type="submit" disabled={fieldAccessLoading || !canWriteFieldMode}>
              Simpan ke Supabase
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
