import { useSyncExternalStore } from 'react';

// A fixed zone, so the server and the browser render the same text and everyone reads Thai time.
const TIME_ZONE = 'Asia/Bangkok';

const dateTimeFormat = new Intl.DateTimeFormat('th-TH', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

const clockFormat = new Intl.DateTimeFormat('th-TH', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

export function formatDateTime(iso: string) {
  return dateTimeFormat.format(new Date(iso));
}

export function formatClock(time: number) {
  return clockFormat.format(new Date(time));
}

export function formatDuration(ms: number) {
  if (ms < 1000) return `${Math.max(ms, 0)} ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} วิ`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return seconds % 60 ? `${minutes} นาที ${seconds % 60} วิ` : `${minutes} นาที`;
  const hours = Math.floor(minutes / 60);
  return minutes % 60 ? `${hours} ชม. ${minutes % 60} นาที` : `${hours} ชม.`;
}

function spanText(ms: number) {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return 'ไม่ถึงนาที';
  if (minutes < 60) return `${minutes} นาที`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ชม.`;
  return `${Math.round(hours / 24)} วัน`;
}

export function timeAgo(iso: string, now: number) {
  return `${spanText(now - new Date(iso).getTime())}ที่แล้ว`;
}

export function timeUntil(iso: string, now: number) {
  const ms = new Date(iso).getTime() - now;
  return ms <= 0 ? 'ถึงเวลาแล้ว รอ sweep รอบถัดไป' : `อีก ${spanText(ms)}`;
}

const TICK_MS = 15_000;

// One timer for every relative time on the page, however many rows there are.
const clock = {
  now: Date.now(),
  listeners: new Set<() => void>(),
  timer: undefined as ReturnType<typeof setInterval> | undefined
};

function subscribeToClock(listener: () => void) {
  if (clock.listeners.size === 0) {
    clock.now = Date.now();
    clock.timer = setInterval(() => {
      clock.now = Date.now();
      clock.listeners.forEach((notify) => notify());
    }, TICK_MS);
  }
  clock.listeners.add(listener);
  return () => {
    clock.listeners.delete(listener);
    if (clock.listeners.size === 0) clearInterval(clock.timer);
  };
}

/** The current time, or null during server rendering so relative text cannot break hydration. */
export function useNow() {
  return useSyncExternalStore(
    subscribeToClock,
    () => clock.now,
    () => null
  );
}
