/* The forecast: what the next few weeks should hold, worked out from the same tickets and
 * patterns the hindcast shows.
 *
 * The method is deliberately plain, so the page can say what it did: the level is the mean of
 * the last six weeks, the trend is half the slope of the last twelve, the shape is half of how
 * the same weeks a year ago moved against their own level, and the range is the error the same
 * method made when it was tried on recent weeks, widening with distance. The
 * patterns are projected separately, as dated predictions, at the rate the history shows. */

import { SERVICES } from '../../hindcast/data/mockData';
import { patternsFor } from '../../hindcast/model/hindcast';
import { CAUSES, CAUSE_LABEL, DAY, TODAY, WEEK, iso } from '../../hindcast/model/labels';
import { chances } from '../../hindcast/model/patterns';
import type { Ticket } from '../../hindcast/model/types';
import type { DayRisk, Forecast, ForecastScope, Prediction, ServiceRisk } from './types';

/** The 80% range either side of the expected figure. */
const Z = 1.28;
/** How many recent weeks the method is tried on, to measure its error. */
const BACKTEST = 8;

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function slope(xs: number[]) {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = (n - 1) / 2;
  const my = mean(xs);
  let num = 0;
  let den = 0;
  xs.forEach((y, x) => {
    num += (x - mx) * (y - my);
    den += (x - mx) ** 2;
  });
  return num / den;
}

/** The expected count `h` weeks after the end of `past` (h = 1 is the next week). `year` is the
 *  same series run a year earlier, lined up week for week, for the seasonal shape. */
function project(past: number[], h: number, year: number[]) {
  const level = mean(past.slice(-6));
  const trend = slope(past.slice(-12)) * 0.5;
  const t = past.length;
  const then = mean(year.slice(Math.max(0, t - 6), t));
  const season = then > 0 && year[t + h - 1] !== undefined ? 1 + 0.5 * (year[t + h - 1] / then - 1) : 1;
  return Math.max(0, (level + trend * (2.5 + h)) * season);
}

function weeklyCounts(tickets: Ticket[], from: number, weeks: number) {
  const counts = Array<number>(weeks).fill(0);
  for (const t of tickets) {
    const w = Math.floor((t.at - from) / WEEK);
    if (w >= 0 && w < weeks) counts[w]++;
  }
  return counts;
}

/** Try the method on the last few weeks: what it would have said, and how wrong it was. */
function backtest(counts: number[], year: number[]) {
  const predicted: (number | null)[] = counts.map(() => null);
  const errors: number[] = [];
  const shares: number[] = [];
  for (let t = Math.max(6, counts.length - BACKTEST); t < counts.length; t++) {
    const p = project(counts.slice(0, t), 1, year);
    predicted[t] = p;
    errors.push(counts[t] - p);
    if (counts[t] > 0) shares.push(Math.abs(counts[t] - p) / counts[t]);
  }
  const sd = Math.sqrt(mean(errors.map((e) => e * e))) || Math.sqrt(mean(counts)) || 1;
  return { predicted, sd, accuracy: Math.max(0, 1 - mean(shares)) };
}

/** Expected, low and high over a horizon, for one weekly series. */
function outlook(counts: number[], year: number[], horizon: number) {
  const { sd } = backtest(counts, year);
  const expected = Array.from({ length: horizon }, (_, i) => project(counts, i + 1, year)).reduce((a, b) => a + b, 0);
  const spread = Z * sd * Math.sqrt(horizon);
  return { expected, low: Math.max(0, expected - spread), high: expected + spread };
}

export function forecast(all: Ticket[], scope: ForecastScope): Forecast {
  const { weeks, horizon } = scope;
  const from = TODAY - weeks * WEEK;
  const lookback = all.filter((t) => t.at >= from && t.at < TODAY);
  const scoped = lookback.filter((t) => scope.serviceId === 'all' || t.serviceId === scope.serviceId);
  const inService = (t: Ticket) => scope.serviceId === 'all' || t.serviceId === scope.serviceId;
  const counts = weeklyCounts(scoped, from, weeks);
  // A year earlier, running on past today by the horizon, for the seasonal shape.
  const yearAgo = (ts: Ticket[]) => weeklyCounts(ts, from - 52 * WEEK, weeks + horizon);
  const year = yearAgo(all.filter(inService));
  const tried = backtest(counts, year);

  const history = counts.map((actual, i) => ({
    start: iso(from + i * WEEK),
    actual,
    predicted: tried.predicted[i] === null ? null : Math.round(tried.predicted[i]!),
  }));

  const ahead = Array.from({ length: horizon }, (_, i) => {
    const expected = project(counts, i + 1, year);
    const spread = Z * tried.sd * Math.sqrt(i + 1);
    return { start: iso(TODAY + i * WEEK), expected: Math.round(expected), low: Math.round(Math.max(0, expected - spread)), high: Math.round(expected + spread) };
  });

  const total = outlook(counts, year, horizon);
  const incidentShare = scoped.length ? scoped.filter((t) => t.outcome === 'incident').length / scoped.length : 0;
  const recent = scoped.filter((t) => t.at >= TODAY - horizon * WEEK);

  const services: ServiceRisk[] = SERVICES.map((s) => {
    const theirs = lookback.filter((t) => t.serviceId === s.id);
    const o = outlook(weeklyCounts(theirs, from, weeks), yearAgo(all.filter((t) => t.serviceId === s.id)), horizon);
    return {
      id: s.id,
      name: s.name,
      expected: Math.round(o.expected),
      low: Math.round(o.low),
      high: Math.round(o.high),
      previous: theirs.filter((t) => t.at >= TODAY - horizon * WEEK).length,
    };
  }).sort((a, b) => b.expected - a.expected);

  // The patterns, projected: every day each is due inside the horizon.
  const end = TODAY + horizon * WEEK;
  const predictions: Prediction[] = patternsFor(all, scope.serviceId, null, from, TODAY)
    .map((ev) => {
      const dates = chances(ev.pattern, TODAY, end).map(iso);
      return {
        id: `PRD-${ev.pattern.id.slice(4)}`,
        evidence: ev,
        next: dates[0] ?? ev.next,
        dates,
        likelihood: ev.confidence,
        expectedTickets: Math.round(dates.length * ev.confidence * ev.ticketsPerHit),
        likelyIncident: ev.incidentShare >= 0.3,
      };
    })
    .filter((p) => p.dates.length > 0)
    .sort((a, b) => a.next.localeCompare(b.next));

  // Each weekday's share of the week, from the lookback, spreads the weekly figure over days.
  const weekday = Array<number>(7).fill(0);
  for (const t of scoped) weekday[(new Date(t.at).getUTCDay() + 6) % 7]++;
  const weekdayShare = weekday.map((n) => n / Math.max(1, scoped.length));
  const raw = Array.from({ length: horizon * 7 }, (_, i) => {
    const date = iso(TODAY + i * DAY);
    return {
      date,
      expected: ahead[Math.floor(i / 7)].expected * weekdayShare[i % 7],
      predictions: predictions.filter((p) => p.dates.includes(date)).map((p) => p.id),
    };
  });
  const sorted = raw.map((d) => d.expected).sort((a, b) => a - b);
  const levelOf = (x: number) => Math.min(4, Math.floor((sorted.findIndex((y) => y >= x) / sorted.length) * 5));
  const days: DayRisk[] = raw.map((d) => ({ ...d, expected: Math.round(d.expected), level: levelOf(d.expected) }));
  const peak = days.reduce((best, d) => (d.expected > best.expected ? d : best), days[0]);

  const causes = CAUSES.map((key) => {
    const theirs = scoped.filter((t) => t.cause === key);
    return {
      key,
      label: CAUSE_LABEL[key],
      last: recent.filter((t) => t.cause === key).length,
      next: Math.round(total.expected * (theirs.length / Math.max(1, scoped.length))),
    };
  })
    .filter((c) => c.last > 0 || c.next > 0)
    .sort((a, b) => b.next - a.next);

  return {
    scope,
    history,
    ahead,
    accuracy: tried.accuracy,
    totals: {
      expected: Math.round(total.expected),
      low: Math.round(total.low),
      high: Math.round(total.high),
      incidents: Math.round(total.expected * incidentShare),
      previous: recent.length,
      previousIncidents: recent.filter((t) => t.outcome === 'incident').length,
    },
    services,
    days,
    peak,
    predictions,
    causes,
  };
}
