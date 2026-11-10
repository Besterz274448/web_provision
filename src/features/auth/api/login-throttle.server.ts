// Slows password guessing per username. State is in this process's memory, so a restart clears it
// and each instance counts on its own. That is enough for one internal server behind a VPN.

export const MAX_FAILURES = 5;
export const LOCK_MINUTES = 15;

const LOCK_MS = LOCK_MINUTES * 60_000;

type Failures = { count: number; resetAt: number };

const failures = new Map<string, Failures>();

export function isLocked(username: string, now = Date.now()) {
  const entry = failures.get(username);
  if (!entry) return false;
  if (entry.resetAt <= now) {
    failures.delete(username);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

export function recordFailure(username: string, now = Date.now()) {
  // Guessed usernames also land here, so expired entries must not pile up.
  for (const [key, entry] of failures) {
    if (entry.resetAt <= now) failures.delete(key);
  }
  const entry = failures.get(username);
  failures.set(username, {
    count: (entry?.count ?? 0) + 1,
    resetAt: entry?.resetAt ?? now + LOCK_MS
  });
}

export function clearFailures(username: string) {
  failures.delete(username);
}
