type RateWindow = { startedAt: number; count: number };

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const windows = new Map<string, RateWindow>();

/**
 * Lightweight per-instance protection for the initial pilot. A durable
 * database-backed limiter should replace this before multi-instance scale.
 */
export function consumeAssistantRequest(userId: string, now = Date.now()) {
  const current = windows.get(userId);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    windows.set(userId, { startedAt: now, count: 1 });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  current.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - current.count };
}
