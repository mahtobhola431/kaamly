import { formatRelativeTime } from '@rokdajob/shared';

/**
 * Demo data is anchored to a fixed instant rather than `Date.now()`.
 *
 * Two reasons: the server and the client render identical strings (no hydration
 * mismatch on "2h ago"), and the dataset keeps looking freshly posted no matter when
 * someone opens it. Every relative timestamp in the demo is measured against this.
 */
export const DEMO_NOW = new Date('2026-08-28T09:30:00.000+05:30');

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function minutesAgo(minutes: number): string {
  return new Date(DEMO_NOW.getTime() - minutes * 60 * 1000).toISOString();
}

export function hoursAgo(hours: number): string {
  return new Date(DEMO_NOW.getTime() - hours * HOUR).toISOString();
}

export function daysAgo(days: number): string {
  return new Date(DEMO_NOW.getTime() - days * DAY).toISOString();
}

export function daysAhead(days: number): string {
  return new Date(DEMO_NOW.getTime() + days * DAY).toISOString();
}

/** Relative time measured against the demo clock, so output is deterministic. */
export function demoAgo(iso: string): string {
  return formatRelativeTime(iso, DEMO_NOW);
}

/** `28 Aug 2026` — the date format used across the product. */
export function demoDate(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(iso));
}

/** `Tomorrow`, `Today`, or a short date — used for job start dates. */
export function demoDay(iso: string): string {
  const target = new Date(iso);
  const diffDays = Math.round((target.getTime() - DEMO_NOW.getTime()) / DAY);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(target);
}

/** `9:30 AM` in IST. */
export function demoTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(new Date(iso));
}
