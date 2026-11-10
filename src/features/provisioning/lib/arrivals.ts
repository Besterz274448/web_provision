import { useSyncExternalStore } from 'react';

/**
 * Ids that were not seen before. Nothing counts as new on the first look (seen is null),
 * so opening the console does not announce every request already waiting.
 */
export function newArrivals(seen: ReadonlySet<string> | null, ids: readonly string[]): string[] {
  if (seen === null) return [];
  return ids.filter((id) => !seen.has(id));
}

const COUNT_PREFIX = /^\(\d+\) /;

/** The page title with "(n) " in front while n requests wait, so a background tab shows it. */
export function titleWithCount(title: string, count: number): string {
  const base = title.replace(COUNT_PREFIX, '');
  return count > 0 ? `(${count}) ${base}` : base;
}

// Rows that came in while the console was open keep a "ใหม่" mark for a while.
const MARK_MS = 10 * 60_000;
const marked = new Map<string, number>();
const listeners = new Set<() => void>();
let version = 0;

function notify() {
  version += 1;
  for (const listener of listeners) listener();
}

export function markArrivals(ids: readonly string[]) {
  if (ids.length === 0) return;
  const until = Date.now() + MARK_MS;
  for (const id of ids) marked.set(id, until);
  notify();
  setTimeout(() => {
    const now = Date.now();
    for (const [id, end] of marked) if (end <= now) marked.delete(id);
    notify();
  }, MARK_MS);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useIsNewArrival(id: string) {
  useSyncExternalStore(
    subscribe,
    () => version,
    () => 0
  );
  // The timer in markArrivals drops an id once its time is up.
  return marked.has(id);
}
