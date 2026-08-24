import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase-server";

type ReadingSource = "sensor" | "simulation";

type CreateReadingBody = {
  station_id: string;
  ntu: number;
  source: ReadingSource;
  equipment?: string;
};

const VALID_SOURCES: ReadingSource[] = ["sensor", "simulation"];

function hasValidIngestKey(request: NextRequest) {
  const expected = process.env.JERNIH_INGEST_API_KEY;
  return Boolean(expected && request.headers.get("x-jernih-ingest-key") === expected);
}

/**
 * Server-side history endpoint. Public dashboards should prefer the RLS-limited
 * browser client; this endpoint exists for trusted services and diagnostics.
 */
export async function GET(request: NextRequest) {
  if (!hasValidIngestKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get("station_id");
  const requestedLimit = Number(searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 50;

  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("readings")
    .select("id, station_id, ntu, source, equipment, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (stationId) query = query.eq("station_id", stationId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ readings: data });
}

/**
 * Protected ingestion endpoint for a future ESP32 gateway or trusted service.
 * Manual Field Mode writes use Supabase Auth and database RLS directly.
 */
export async function POST(request: NextRequest) {
  if (!hasValidIngestKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateReadingBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { station_id, ntu, source, equipment } = body;
  if (!station_id || typeof station_id !== "string") {
    return NextResponse.json({ error: "station_id wajib diisi" }, { status: 400 });
  }
  if (typeof ntu !== "number" || !Number.isFinite(ntu) || ntu < 0 || ntu > 500) {
    return NextResponse.json({ error: "ntu harus berupa angka antara 0-500" }, { status: 400 });
  }
  if (!source || !VALID_SOURCES.includes(source)) {
    return NextResponse.json({ error: "source tidak valid" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("readings")
    .insert({
      station_id,
      ntu: Math.round(ntu * 10) / 10,
      source,
      equipment: equipment ?? (source === "sensor" ? "ESP32 Sensor" : "NTU-Logger demo"),
    })
    .select("id, station_id, ntu, source, equipment, created_at")
    .single();

  if (error) {
    if (error.code === "23503") {
      return NextResponse.json({ error: `station_id \"${station_id}\" tidak ditemukan` }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reading: data }, { status: 201 });
}
