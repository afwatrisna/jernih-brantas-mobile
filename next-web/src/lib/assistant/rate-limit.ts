export type AssistantRole = "viewer" | "field_operator" | "admin";

type RateWindow = { startedAt: number; count: number };

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_BY_ROLE: Record<AssistantRole, number> = {
  viewer: 5,
  field_operator: 10,
  admin: 10,
};
const windows = new Map<string, RateWindow>();

/**
 * Lightweight per-instance protection for the initial pilot. A durable
 * database-backed limiter should replace this before multi-instance scale.
 */
export function consumeAssistantRequest(userId: string, role: AssistantRole, now = Date.now()) {
  const maxRequests = MAX_REQUESTS_BY_ROLE[role];
  const key = `${role}:${userId}`;
  const current = windows.get(key);

  if (!current || now - current.startedAt >= WINDOW_MS) {
    windows.set(key, { startedAt: now, count: 1 });
    return { allowed: true, remaining: maxRequests - 1, limit: maxRequests };
  }

  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0, limit: maxRequests };
  }

  current.count += 1;
  return { allowed: true, remaining: maxRequests - current.count, limit: maxRequests };
}
