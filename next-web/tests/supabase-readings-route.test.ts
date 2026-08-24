import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { GET } from "../src/app/api/readings/route";

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
});
