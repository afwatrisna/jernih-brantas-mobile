import { describe, expect, it } from "vitest";

const MODEL_ID = "gemini-3.1-flash-lite";

describe("Gemini credential", () => {
  it("can read the selected Gemini model metadata", async () => {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    expect(apiKey, "GOOGLE_GENERATIVE_AI_API_KEY must be configured for AI Asisten Jernih").toBeTruthy();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}?key=${encodeURIComponent(apiKey ?? "")}`);
    const body = await response.text();

    expect(response.ok, body).toBe(true);
    expect(JSON.parse(body)).toMatchObject({ name: `models/${MODEL_ID}` });
  }, 20_000);
});
