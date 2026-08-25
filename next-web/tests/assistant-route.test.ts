import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/assistant/route";

describe("AI Asisten Jernih route", () => {
  it("rejects malformed assistant requests before any model request", async () => {
    const response = await POST(new Request("http://localhost/api/assistant", {
      method: "POST",
      body: JSON.stringify({ message: "" }),
    }));

    expect(response.status).toBe(400);
  });

  it("requires a verified Supabase session before accessing station context or Gemini", async () => {
    const response = await POST(new Request("http://localhost/api/assistant", {
      method: "POST",
      body: JSON.stringify({
        message: "Ringkas tren NTU.",
        stationId: "malang",
        display: { ntu: 12.5, source: "simulation", simulationEnabled: true, demoDisplayMode: true },
      }),
    }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining("Masuk sebagai petugas") });
  });
});
