"use client";

import { useCallback, useEffect, useState } from "react";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

import { getSupabaseClient } from "@/lib/supabase-client";
import type { Database } from "@/lib/supabase-types";

export type ReadingSource = "sensor" | "manual" | "simulation";

export type SupabaseReading = {
  id: string;
  station_id: string;
  ntu: number;
  source: ReadingSource;
  equipment: string;
  created_at: string;
};

/**
 * Loads public monitoring history and subscribes to permitted new readings.
 * Local simulation remains an explicit fallback for stations without cloud data.
 */
export function useSupabaseReadings() {
  const [readings, setReadings] = useState<SupabaseReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInitial = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Konfigurasi Supabase belum tersedia.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error: fetchError } = await supabase
      .from("readings")
      .select("id, station_id, ntu, source, equipment, created_at")
      .gte("created_at", ninetyDaysAgo)
      .order("created_at", { ascending: true })
      .limit(2000);

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setReadings((data ?? []) as SupabaseReading[]);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const initialFetchTimer = window.setTimeout(() => {
      void fetchInitial();
    }, 0);
    if (!supabase) return;

    const channel = supabase
      .channel("jernih-readings-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "readings" }, (payload: RealtimePostgresInsertPayload<Database["public"]["Tables"]["readings"]["Row"]>) => {
        setReadings((current) => [...current, payload.new as SupabaseReading]);
      })
      .subscribe();

    return () => {
      window.clearTimeout(initialFetchTimer);
      void supabase.removeChannel(channel);
    };
  }, [fetchInitial]);

  return { readings, loading, error, refetch: fetchInitial };
}
