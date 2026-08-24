"use client";

export type ReadingSource = "sensor" | "manual" | "simulation";

export type CreateReadingInput = {
  station_id: string;
  ntu: number;
  source: ReadingSource;
  equipment?: string;
};

/**
 * Sends a clearly identified development test reading without exposing the
 * server ingestion key in browser code. Production Field Mode stays read-only
 * until Supabase Auth and role-based write policies are implemented.
 */
export async function createDevelopmentReading(input: CreateReadingInput) {
  const response = await fetch("/api/readings/client-ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error ?? `Gagal menyimpan pembacaan (status ${response.status})`);
  }

  return response.json();
}
