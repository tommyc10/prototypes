/* Reading a window: where it is in its life, how to say when, and what order to list them in. */

import type { ChangeWindow, ListFilter, Range, WindowStatus } from './types';

export const HOUR = 3_600_000;

export const STATUS_LABEL: Record<WindowStatus, string> = {
  active: 'In place',
  overrunning: 'Overrunning',
  upcoming: 'Upcoming',
  ended: 'Ended',
};

export const LIST_TABS: { key: ListFilter; label: string }[] = [
  { key: 'now', label: 'In place' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'ended', label: 'Ended' },
  { key: 'all', label: 'All' },
];

export const RANGES: { hours: Range; label: string }[] = [
  { hours: 24, label: '24h' },
  { hours: 72, label: '3d' },
  { hours: 168, label: '7d' },
];

export function statusOf(w: ChangeWindow, now: number): WindowStatus {
  if (w.closedAt) return 'ended';
  if (w.start > now) return 'upcoming';
  return now > w.plannedEnd ? 'overrunning' : 'active';
}

/** In place right now, on time or not. */
export const inPlace = (w: ChangeWindow, now: number) => ['active', 'overrunning'].includes(statusOf(w, now));

/** When it stops holding alerts back: when it closed, or when it's planned to (or now, if it's overrunning). */
export const endOf = (w: ChangeWindow, now: number) => w.closedAt ?? Math.max(w.plannedEnd, w.start > now ? 0 : now);

export const heldTotal = (w: ChangeWindow) => w.held.reduce((sum, n) => sum + n, 0);

/** A length of time → "40m", "2h 40m", "1d 3h" */
export function howLong(ms: number) {
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return minutes % 60 ? `${hours}h ${minutes % 60}m` : `${hours}h`;
  return hours % 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${Math.floor(hours / 24)}d`;
}

/** The one thing worth saying about its timing, e.g. "2h 40m left" or "over by 1h 20m". */
export function timing(w: ChangeWindow, now: number) {
  switch (statusOf(w, now)) {
    case 'active':
      return `${howLong(w.plannedEnd - now)} left`;
    case 'overrunning':
      return `over by ${howLong(now - w.plannedEnd)}`;
    case 'upcoming':
      return `in ${howLong(w.start - now)}`;
    case 'ended':
      return `ended ${howLong(now - w.closedAt!)} ago`;
  }
}

const day = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '');
const hour = (ms: number) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/** "15:20", or "Tue 29 Sept, 03:00" when it isn't today. */
export const when = (ms: number, now: number) => (day(ms) === day(now) ? hour(ms) : `${day(ms)}, ${hour(ms)}`);

export const dayLabel = day;
export const hourLabel = hour;

/** The order the list uses: what needs watching first. Overrunning, then whatever ends
 *  soonest, then what starts soonest, then what ended most recently. */
export function sortWindows(windows: ChangeWindow[], now: number) {
  const rank: Record<WindowStatus, number> = { overrunning: 0, active: 1, upcoming: 2, ended: 3 };
  return [...windows].sort((a, b) => {
    const [sa, sb] = [statusOf(a, now), statusOf(b, now)];
    if (sa !== sb) return rank[sa] - rank[sb];
    if (sa === 'ended') return b.closedAt! - a.closedAt!;
    return sa === 'upcoming' ? a.start - b.start : a.plannedEnd - b.plannedEnd;
  });
}

export const inFilter = (w: ChangeWindow, filter: ListFilter, now: number) => {
  const status = statusOf(w, now);
  return filter === 'all' || (filter === 'now' ? status === 'active' || status === 'overrunning' : status === filter);
};

/** The stretch of time the schedule shows: a quarter of it behind now, the rest ahead. */
export const rangeOf = (hours: Range, now: number) => ({ from: now - hours * HOUR * 0.25, to: now + hours * HOUR * 0.75 });

/** Other windows for the same group whose time overlaps this one's. */
export const overlapping = (w: ChangeWindow, all: ChangeWindow[], now: number) =>
  all.filter((o) => o.key !== w.key && o.groupId === w.groupId && o.start < endOf(w, now) && endOf(o, now) > w.start);
