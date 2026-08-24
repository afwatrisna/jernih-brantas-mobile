"use client";

import { getSupabaseClient } from "@/lib/supabase-client";

export type ReadingSource = "sensor" | "manual" | "simulation";

export type CreateReadingInput = {
  station_id: string;
  ntu: number;
  source: ReadingSource;
  equipment?: string;
};

/**
 * Inserts a manual Field Mode reading using the signed-in user's public client.
 * RLS independently verifies the user's role, station membership, source, and
 * recorded_by value; the browser never receives the sensor-ingestion secret.
 */
export async function createAuthenticatedManualReading(input: Omit<CreateReadingInput, "source">) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Konfigurasi Supabase browser belum tersedia.");

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Masuk sebagai petugas sebelum menyimpan pengukuran.");

  const { data, error } = await supabase
    .from("readings")
    .insert({
      station_id: input.station_id,
      ntu: Math.round(input.ntu * 10) / 10,
      source: "manual",
      equipment: input.equipment ?? "Turbidimeter lapangan",
      recorded_by: userData.user.id,
    })
    .select("id, station_id, ntu, source, equipment, created_at, recorded_by")
    .single();

  if (error) throw new Error(error.message);
  return data;
}
