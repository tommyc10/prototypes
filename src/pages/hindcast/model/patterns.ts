/* When a pattern gets its chance to happen. The mock data uses this to plant the patterns in
 * the history, and the hindcast uses it to check them, so the two can't disagree. */

import { DAY } from './labels';
import type { Pattern } from './types';

/** Every chance (the start of the day, epoch ms) that falls in [from, to). */
export function chances(pattern: Pattern, from: number, to: number): number[] {
  const out: number[] = [];
  const c = pattern.cadence;
  if (c.kind === 'weekday') {
    const first = new Date(from);
    first.setUTCHours(0, 0, 0, 0);
    const offset = (c.day - ((first.getUTCDay() + 6) % 7) + 7) % 7;
    for (let t = first.getTime() + offset * DAY; t < to; t += 7 * DAY) if (t >= from) out.push(t);
  } else if (c.kind === 'cycle') {
    const anchor = Date.parse(c.anchor);
    const every = c.everyDays * DAY;
    for (let t = anchor + Math.ceil((from - anchor) / every) * every; t < to; t += every) out.push(t);
  } else {
    const d = new Date(from);
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
    for (;;) {
      // The first of next month, less the days before.
      const t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) - c.daysBefore * DAY;
      if (t >= to) break;
      if (t >= from) out.push(t);
      d.setUTCMonth(d.getUTCMonth() + 1);
    }
  }
  return out;
}
