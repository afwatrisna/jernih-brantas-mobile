import type { ReadingSource } from "@/lib/jernih-data";
import { describeAssistantSource } from "@/lib/assistant/policy";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export type AssistantDisplayContext = {
  ntu: number;
  source: ReadingSource;
  simulationEnabled: boolean;
  demoDisplayMode: boolean;
};

export type AssistantContext = {
  selectedStation: {
    id: string;
    name: string;
    subtitle: string;
    baseline: number;
    currentNtu: number | null;
    source: ReadingSource | null;
    equipment: string | null;
    latestAt: string | null;
    trend24h: "naik" | "turun" | "stabil" | "belum-cukup-data";
    readingCount24h: number;
    average24h: number | null;
  };
  dataStatus: ReturnType<typeof describeAssistantSource>;
  scope: "admin" | "field_operator" | "viewer";
};

export class AssistantAccessError extends Error {}

function normaliseSource(source: string | null | undefined): ReadingSource | null {
  return source === "simulation" || source === "manual" || source === "sensor" ? source : null;
}

function calculateTrend(values: number[]): AssistantContext["selectedStation"]["trend24h"] {
  if (values.length < 2) return "belum-cukup-data";
  const difference = values.at(-1)! - values[0];
  if (difference > 2) return "naik";
  if (difference < -2) return "turun";
  return "stabil";
}

export async function buildAssistantContext(input: {
  userId: string;
  role: AssistantContext["scope"];
  stationId: string;
  display: AssistantDisplayContext;
}): Promise<AssistantContext> {
  const supabase = createServerSupabaseClient();
  const { userId, role, stationId, display } = input;

  if (role === "field_operator") {
    const { data: membership, error: membershipError } = await supabase
      .from("station_memberships")
      .select("id")
      .eq("user_id", userId)
      .eq("station_id", stationId)
      .maybeSingle();

    if (membershipError || !membership) {
      throw new AssistantAccessError("Akun petugas tidak memiliki akses ke stasiun tersebut.");
    }
  }

  const { data: station, error: stationError } = await supabase
    .from("stations")
    .select("id, name, subtitle, baseline")
    .eq("id", stationId)
    .maybeSingle();

  if (stationError || !station) {
    throw new AssistantAccessError("Stasiun yang dipilih tidak tersedia.");
  }

  if (display.source === "simulation") {
    return {
      selectedStation: {
        id: station.id,
        name: station.name,
        subtitle: station.subtitle,
        baseline: Number(station.baseline),
        currentNtu: display.ntu,
        source: "simulation",
        equipment: "NTU-Logger demo",
        latestAt: null,
        trend24h: "belum-cukup-data",
        readingCount24h: 0,
        average24h: null,
      },
      dataStatus: describeAssistantSource("simulation"),
      scope: role,
    };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: readings, error: readingsError } = await supabase
    .from("readings")
    .select("ntu, source, equipment, created_at")
    .eq("station_id", stationId)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(96);

  if (readingsError) throw new AssistantAccessError("Data stasiun tidak dapat disiapkan untuk asisten.");

  const values = (readings ?? []).map((reading) => Number(reading.ntu));
  const latest = readings?.at(-1);
  const source = normaliseSource(latest?.source);

  return {
    selectedStation: {
      id: station.id,
      name: station.name,
      subtitle: station.subtitle,
      baseline: Number(station.baseline),
      currentNtu: latest ? Number(latest.ntu) : null,
      source,
      equipment: latest?.equipment ?? null,
      latestAt: latest?.created_at ?? null,
      trend24h: calculateTrend(values),
      readingCount24h: values.length,
      average24h: values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null,
    },
    dataStatus: describeAssistantSource(source),
    scope: role,
  };
}
