import { describe, expect, it } from "vitest";

import { consumeAssistantRequest } from "@/lib/assistant/rate-limit";

describe("AI Asisten Jernih role-based rate limit", () => {
  it("allows five Viewer questions and blocks the sixth in one hour", () => {
    const userId = `viewer-test-${crypto.randomUUID()}`;
    const now = 1_800_000_000_000;

    for (let index = 0; index < 5; index += 1) {
      expect(consumeAssistantRequest(userId, "viewer", now + index)).toMatchObject({
        allowed: true,
        limit: 5,
      });
    }

    expect(consumeAssistantRequest(userId, "viewer", now + 6)).toMatchObject({
      allowed: false,
      remaining: 0,
      limit: 5,
    });
  });

  it("resets a Viewer window after one hour", () => {
    const userId = `viewer-reset-${crypto.randomUUID()}`;
    const now = 1_800_000_100_000;

    for (let index = 0; index < 5; index += 1) consumeAssistantRequest(userId, "viewer", now + index);

    expect(consumeAssistantRequest(userId, "viewer", now + 60 * 60 * 1000)).toMatchObject({
      allowed: true,
      remaining: 4,
      limit: 5,
    });
  });

  it("retains ten questions per hour for Field Operator and Admin", () => {
    for (const role of ["field_operator", "admin"] as const) {
      const userId = `${role}-test-${crypto.randomUUID()}`;
      const now = 1_800_000_200_000;
      for (let index = 0; index < 10; index += 1) consumeAssistantRequest(userId, role, now + index);
      expect(consumeAssistantRequest(userId, role, now + 11)).toMatchObject({
        allowed: false,
        remaining: 0,
        limit: 10,
      });
    }
  });
});
