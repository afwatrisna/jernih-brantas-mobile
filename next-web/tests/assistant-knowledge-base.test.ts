import { describe, expect, it } from "vitest";

import { JERNIH_KNOWLEDGE_BASE } from "@/lib/assistant/knowledge-base";

describe("AI Asisten Jernih KB-01", () => {
  it("preserves the supplied knowledge-base identity and core topics", () => {
    expect(JERNIH_KNOWLEDGE_BASE.id).toBe("KB-01");
    expect(JERNIH_KNOWLEDGE_BASE.title).toBe("Dasar-Dasar Kualitas Air");
    expect(JERNIH_KNOWLEDGE_BASE.content).toContain("Satu parameter tidak cukup");
    expect(JERNIH_KNOWLEDGE_BASE.content).toContain("Water quality berbeda dari data quality");
    expect(JERNIH_KNOWLEDGE_BASE.content).toContain("Upstream dan downstream");
    expect(JERNIH_KNOWLEDGE_BASE.content).toContain("AI tidak boleh menebak threshold");
  });
});
