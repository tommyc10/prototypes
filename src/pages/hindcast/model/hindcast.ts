/* The hindcast: every figure the look back shows, worked out from the tickets and a scope.
 * The cause filter narrows everything except the cause list itself, which always shows every
 * cause so another can be picked. */

import { PATTERNS } from '../data/mockData';
import { CAUSES, CAUSE_LABEL, DAY, TODAY, WEEK, iso } from './labels';
import { chances } from './patterns';
import type { CauseRow, Hindcast, HindcastScope, Kpi, Pattern, PatternEvidence, Ticket, WeekRow } from './types';

export function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const share = (part: number, whole: number) => (whole > 0 ? part / whole : 0);

/** Minutes to resolve, counting only tickets someone worked: a cancellation isn't a fix. */
const resolveTimes = (tickets: Ticket[]) => tickets.filter((t) => t.outcome !== 'cancelled').map((t) => t.resolveMins);

const inScope = (serviceId: string) => (t: Ticket) => serviceId === 'all' || t.serviceId === serviceId;

/** The tickets in [from, to). */
const between = (tickets: Ticket[], from: number, to: number) => tickets.filter((t) => t.at >= from && t.at < to);

/** Bucket tickets into the weeks starting at `from`. */
function byWeek(tickets: Ticket[], from: number, weeks: number): Ticket[][] {
  const buckets: Ticket[][] = Array.from({ length: weeks }, () => []);
  for (const t of tickets) {
    const w = Math.floor((t.at - from) / WEEK);
    if (w >= 0 && w < weeks) buckets[w].push(t);
  }
  return buckets;
}

/** How a pattern did over [from, to), checked against every ticket with its service and cause. */
export function evidence(pattern: Pattern, tickets: Ticket[], from: number, to: number): PatternEvidence {
  const matching = tickets.filter((t) => t.serviceId === pattern.serviceId && t.cause === pattern.cause);
  const hitTickets: Ticket[] = [];
  const strip = chances(pattern, from, to).map((chance) => {
    const end = chance + pattern.windowDays * DAY;
    const found = matching.filter((t) => t.at >= chance && t.at < end);
    hitTickets.push(...found);
    return found.length > 0;
  });
  const hits = strip.filter(Boolean).length;
  const next = chances(pattern, TODAY, TODAY + 400 * DAY)[0];
  return {
    pattern,
    chances: strip.length,
    hits,
    confidence: share(hits, strip.length),
    strip: strip.slice(-16),
    incidentShare: share(hitTickets.filter((t) => t.outcome === 'incident').length, hitTickets.length),
    ticketsPerHit: hits > 0 ? hitTickets.length / hits : 1,
    next: iso(next),
  };
}

/** The patterns for a scope: the service's own, or every one, narrowed to a cause if one is picked. Strongest first. */
export function patternsFor(tickets: Ticket[], serviceId: string, cause: string | null, from: number, to: number) {
  return PATTERNS.filter((p) => (serviceId === 'all' || p.serviceId === serviceId) && (!cause || p.cause === cause))
    .map((p) => evidence(p, tickets, from, to))
    .sort((a, b) => b.confidence - a.confidence);
}

export function hindcast(all: Ticket[], scope: HindcastScope): Hindcast {
  const from = TODAY - scope.weeks * WEEK;
  const before = from - scope.weeks * WEEK;
  const service = all.filter(inScope(scope.serviceId));
  const current = between(service, from, TODAY);
  const previous = between(service, before, from);
  const narrow = (ts: Ticket[]) => (scope.cause ? ts.filter((t) => t.cause === scope.cause) : ts);
  const now = narrow(current);
  const then = narrow(previous);

  const buckets = byWeek(now, from, scope.weeks);
  const weeks: WeekRow[] = buckets.map((ts, i) => {
    const row = { incident: 0, worked: 0, cancelled: 0 };
    for (const t of ts) row[t.outcome]++;
    const times = resolveTimes(ts);
    return { start: iso(from + i * WEEK), ...row, total: ts.length, medianMins: times.length ? median(times) : null };
  });

  const kpi = (pick: (ts: Ticket[]) => number): Kpi => ({ value: pick(now), previous: pick(then), series: buckets.map(pick) });
  const incidents = (ts: Ticket[]) => ts.filter((t) => t.outcome === 'incident').length;

  const causes: CauseRow[] = CAUSES.map((key) => {
    const ts = current.filter((t) => t.cause === key);
    return {
      key,
      label: CAUSE_LABEL[key],
      count: ts.length,
      share: share(ts.length, current.length),
      incidents: incidents(ts),
      medianMins: median(resolveTimes(ts)),
      previous: previous.filter((t) => t.cause === key).length,
    };
  }).sort((a, b) => b.count - a.count);

  const heat = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  for (const t of now) {
    const d = new Date(t.at);
    heat[(d.getUTCDay() + 6) % 7][d.getUTCHours()]++;
  }

  return {
    scope,
    from: iso(from),
    to: iso(TODAY - DAY),
    weeks,
    kpis: {
      tickets: kpi((ts) => ts.length),
      incidents: kpi(incidents),
      medianMins: kpi((ts) => median(resolveTimes(ts))),
      repeatShare: kpi((ts) => share(ts.filter((t) => t.repeat).length, ts.length)),
      foundShare: kpi((ts) => share(ts.filter((t) => t.cause !== 'unknown').length, ts.length)),
    },
    causes,
    heat,
    heatMax: Math.max(1, ...heat.flat()),
    tickets: [...now].reverse(),
    patterns: patternsFor(all, scope.serviceId, scope.cause, from, TODAY),
  };
}
