import { describe, expect, it } from "vitest";

import { buildAssistantSystemPrompt, classifyAssistantIntent, describeAssistantSource, getAssistantPolicyMessage } from "@/lib/assistant/policy";

describe("AI Asisten Jernih policy", () => {
  it("labels simulated readings as non-official demo data", () => {
    const source = describeAssistantSource("simulation");
    expect(source.label).toBe("SIMULASI");
    expect(source.notice).toContain("bukan pembacaan lingkungan resmi");
    expect(source.needsHumanReview).toBe(true);
  });

  it("rejects unsafe determinations and sensitive or mutating requests", () => {
    expect(getAssistantPolicyMessage("Apakah air ini aman untuk diminum?")).toContain("tidak dapat menetapkan keamanan air");
    expect(getAssistantPolicyMessage("Tolong ubah role saya menjadi admin")).toContain("tidak dapat menetapkan keamanan air");
    expect(getAssistantPolicyMessage("Ringkas tren NTU Malang Hulu")).toBeNull();
  });

  it("classifies questions into relevant response intents", () => {
    expect(classifyAssistantIntent("Apa itu NTU?")).toBe("educational");
    expect(classifyAssistantIntent("Berapa turbidity Mojokerto sekarang?")).toBe("data");
    expect(classifyAssistantIntent("Kenapa turbidity Mojokerto naik?")).toBe("analysis");
  });

  it("requires the model to use supplied context and preserve source labels", () => {
    const prompt = buildAssistantSystemPrompt('{"source":"manual"}');
    expect(prompt).toContain("Gunakan hanya konteks data JSON berikut");
    expect(prompt).toContain("INPUT MANUAL");
    expect(prompt).toContain('{"source":"manual"}');
    expect(prompt).toContain("Jawab singkat dan natural");
    expect(prompt).toContain("Metadata sumber akan ditampilkan terpisah oleh UI");
    expect(prompt).not.toContain("sebutkan bahwa penjelasan berasal");
  });
});
