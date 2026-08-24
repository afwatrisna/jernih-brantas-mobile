import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { GET, POST } from "../src/app/api/readings/route";

describe("Supabase readings endpoint", () => {
  it("accepts the configured ingest key and can read the authorized Jernih project", async () => {
    const ingestKey = process.env.JERNIH_INGEST_API_KEY;
    expect(ingestKey).toBeTruthy();
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeTruthy();

    const request = new NextRequest("http://localhost/api/readings?limit=1", {
      headers: { "x-jernih-ingest-key": ingestKey! },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { readings?: unknown };
    expect(Array.isArray(payload.readings)).toBe(true);
  });

  it("rejects manual data submitted to the trusted sensor-ingestion route", async () => {
    const ingestKey = process.env.JERNIH_INGEST_API_KEY;
    const request = new NextRequest("http://localhost/api/readings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-jernih-ingest-key": ingestKey! },
      body: JSON.stringify({ station_id: "malang", ntu: 11.1, source: "manual" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("does not allow an anonymous browser client to insert manual Field Mode data", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(url).toBeTruthy();
    expect(anonKey).toBeTruthy();

    const supabase = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase.from("readings").insert({
      station_id: "malang",
      ntu: 11.1,
      source: "manual",
      equipment: "RLS rejection verification",
    });

    expect(error).toBeTruthy();
  });
});
