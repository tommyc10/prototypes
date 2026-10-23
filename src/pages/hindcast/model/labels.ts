/* Words and small helpers the hindcast and forecast share: cause names, the scope options, dates. */

import { NOW } from '../../../lib/clock';
import type { CauseKey, Horizon, Lookback, Outcome } from './types';

export const DAY = 86_400_000;
export const WEEK = 7 * DAY;

/** The Monday of the week in progress. The history stops the day before; the forecast starts here. */
export const TODAY = (() => {
  const d = new Date(NOW);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.getTime();
})();

export const LOOKBACKS: Lookback[] = [12, 26, 52];
export const HORIZONS: Horizon[] = [4, 8];
export const DEFAULT_LOOKBACK: Lookback = 26;
export const DEFAULT_HORIZON: Horizon = 4;

export const CAUSES: CauseKey[] = ['deploy', 'config', 'capacity', 'hardware', 'dependency', 'network', 'certificate', 'unknown'];

export const CAUSE_LABEL: Record<CauseKey, string> = {
  deploy: 'Bad deploy',
  config: 'Config change',
  capacity: 'Capacity',
  hardware: 'Hardware fault',
  dependency: 'Upstream dependency',
  network: 'Network',
  certificate: 'Expired certificate',
  unknown: 'No cause found',
};

export const OUTCOME_LABEL: Record<Outcome, string> = {
  incident: 'Became an incident',
  worked: 'Worked',
  cancelled: 'Cancelled',
};

export const OUTCOMES: Outcome[] = ['incident', 'worked', 'cancelled'];

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** "28 Sept" */
export const dayMonth = (date: string | number) =>
  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** "Wed 30 Sept" */
export const weekdayDate = (date: string | number) =>
  new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

/** "Sept" */
export const monthName = (date: string | number) => new Date(date).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });

/** Minutes → "45 min", "1h 24m", "2d 3h" */
export function span(mins: number) {
  const m = Math.round(mins);
  if (m < 60) return `${m} min`;
  if (m < 60 * 24) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h`;
}

export const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many);

/** A round step that gives about `parts` intervals, and the axis top it implies. */
export function niceAxis(max: number, parts = 3) {
  const rough = Math.max(1, max / parts);
  const power = 10 ** Math.floor(Math.log10(rough));
  const f = rough / power;
  const step = Math.max(1, (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * power);
  const top = Math.max(step, Math.ceil(max / step) * step);
  return { top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step) };
}

/** Change against a previous figure, as a signed share: 0.12 is up 12%. Null when there's nothing to compare. */
export const change = (now: number, before: number) => (before > 0 ? (now - before) / before : null);
