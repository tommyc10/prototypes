/* The hindcast is a replay: today's logic run over tickets that have already happened. It
 * answers "if the service's active rules and approved change windows had been in place, which
 * past tickets would they explain?" It is retrospective, never a forecast.
 *
 * Every figure on the page comes from replay() below. Components never add anything up.
 *
 * Three things the shape refuses to blur:
 *   - A ticket's lifecycle (open, closed, cancelled, other) is what happened to it. Closed is
 *     an outcome, not a verdict: nobody knows a closed ticket was noise.
 *   - Each ticket gets one verdict, so the verdicts add up to the total. A ticket a rule and a
 *     window both explain is counted once, as "both". Per-source counts overlap and never add.
 *   - Unknown is not zero. A rule that needs a field the ticket never recorded, or a time with
 *     no change calendar, gives "unknown", never "no match". */

import type { RuleStatus } from '../../rule-management/model/types';
import { DAY, WEEK, iso } from './labels';
import type { CauseKey, Ticket } from './types';

/* ---------- the source: tickets, and the logic to replay over them ---------- */

export type Lifecycle = 'open' | 'closed' | 'cancelled' | 'other';
export type ClosedBy = 'hand' | 'auto';

/** What happened to a ticket, beyond its cause. `other` is merged into another ticket or moved
 *  to another team. */
export type TicketLife =
  | { lifecycle: 'open' | 'cancelled' | 'other' }
  | { lifecycle: 'closed'; closedBy: ClosedBy };

/** A rule, as the replay sees it: which tickets its conditions would catch. */
export interface ReplayRule {
  id: string;
  name: string;
  /** As it stands now (current replay) or stood on the day (an extract). */
  status: RuleStatus;
  serviceId: string;
  cis: string[];
  causes: CauseKey[];
  /** Of the tickets on those CIs with those causes, the share the rule's other conditions catch. */
  share: number;
  /** A field the rule reads that the ticket store only kept from a date. Older tickets can't be evaluated. */
  needs?: { field: string; since: number };
}

/** An approved change window and every time it ran. */
export interface ReplayWindow {
  id: string;
  name: string;
  serviceId: string;
  cis: string[];
  /** In words: "Tuesdays, 02:00 to 04:00". */
  schedule: string;
  /** [start, end) in epoch ms, oldest first. */
  runs: [number, number][];
}

/** A stretch of time when something the replay needs wasn't there. */
export interface Gap {
  /** 'all' or a service id. */
  serviceId: string;
  from: number;
  to: number;
  what: 'change calendar';
  why: string;
}

export interface ReplaySource {
  tickets: Ticket[];
  life: (t: Ticket) => TicketLife;
  rules: ReplayRule[];
  windows: ReplayWindow[];
  gaps: Gap[];
}

export interface ReplayScope {
  serviceId: string; // or 'all'
  from: number;
  to: number;
}

/* ---------- per ticket ---------- */

export type RuleVerdict = 'match' | 'no-match' | 'unevaluable';

/** One verdict per ticket. The groups add up to the total; the kinds inside each group too. */
export type Verdict = 'rule' | 'window' | 'both' | 'hypothetical' | 'none' | 'unevaluable' | 'unavailable';
export type VerdictGroup = 'explained' | 'unexplained' | 'unknown';

export const GROUP_OF: Record<Verdict, VerdictGroup> = {
  rule: 'explained',
  window: 'explained',
  both: 'explained',
  hypothetical: 'unexplained',
  none: 'unexplained',
  unevaluable: 'unknown',
  unavailable: 'unknown',
};

export const VERDICTS: Verdict[] = ['rule', 'both', 'window', 'hypothetical', 'none', 'unevaluable', 'unavailable'];
export const GROUPS: VerdictGroup[] = ['explained', 'unexplained', 'unknown'];

export interface RuleCheck {
  rule: ReplayRule;
  verdict: RuleVerdict;
}

export interface Replayed {
  ticket: Ticket;
  life: TicketLife;
  /** Every rule for the ticket's service, active ones first. */
  checks: RuleCheck[];
  /** The window run that covered it, if one did. */
  window: { window: ReplayWindow; run: [number, number] } | null;
  /** Whether the change calendar was there for the time it arrived. */
  calendar: 'there' | Gap;
  verdict: Verdict;
}

/* ---------- the report ---------- */

export interface SourceRow {
  id: string;
  name: string;
  kind: 'rule' | 'window';
  status?: RuleStatus;
  /** Tickets closed by hand it matches. Overlaps with other rows. */
  matches: number;
  /** Of those, the ones nothing else explains. */
  only: number;
  /** Of those, the ones that became incidents: what softening it would have touched. */
  incidents: number;
  /** For a rule: closed-by-hand tickets it couldn't evaluate. */
  unevaluable: number;
}

/** Tickets closed by hand that nothing explains, gathered where they keep landing. */
export interface GapCluster {
  key: string;
  serviceId: string;
  ci: string;
  cause: CauseKey;
  count: number;
  incidents: number;
  lastAt: number;
  /** Tickets in each of the last 12 weeks of the scope, oldest first. */
  weekly: number[];
}

export interface UnknownReason {
  key: string;
  verdict: 'unevaluable' | 'unavailable';
  /** "RUL-0401 reads metric.calibration_drift_pct" */
  title: string;
  /** "Not recorded before 12 May" */
  detail: string;
  count: number;
}

export interface WeekVerdicts {
  start: string;
  explained: number;
  unexplained: number;
  unknown: number;
  total: number;
}

export interface Replay {
  scope: ReplayScope;
  /** Everything in the scope, newest first, with its replay. */
  tickets: Replayed[];
  population: Record<Lifecycle, number> & { closedByHand: number; closedAuto: number; total: number };
  /** Closed by hand only: each ticket once. */
  verdicts: Record<Verdict, number>;
  groups: Record<VerdictGroup, number>;
  activeRules: number;
  windows: number;
  sources: SourceRow[];
  /** Proposed and inactive rules: what they would match, hypothetically. */
  hypothetical: SourceRow[];
  gaps: GapCluster[];
  unknowns: UnknownReason[];
  weeks: WeekVerdicts[];
}

/* ---------- the replay ---------- */

/** "superlaser-*" style patterns, the way rules and windows write CIs. */
export const ciMatches = (patterns: string[], ci: string) =>
  patterns.some((p) => (p.endsWith('*') ? ci.startsWith(p.slice(0, -1)) : ci === p));

/** A number in [0, 1) that's the same for the same ticket and rule every time. */
function stable(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

export const isHandClosed = (life: TicketLife) => life.lifecycle === 'closed' && life.closedBy === 'hand';

function check(rule: ReplayRule, t: Ticket): RuleVerdict {
  if (rule.serviceId !== t.serviceId || !ciMatches(rule.cis, t.ci) || !rule.causes.includes(t.cause)) return 'no-match';
  if (rule.needs && t.at < rule.needs.since) return 'unevaluable';
  return stable(`${t.id}:${rule.id}`) < rule.share ? 'match' : 'no-match';
}

/** Rules that the service runs today. Proposed and inactive ones are replayed apart, as hypotheses. */
export const isLive = (r: ReplayRule) => r.status === 'active';

function judge(checks: RuleCheck[], covered: boolean, calendar: Replayed['calendar']): Verdict {
  const live = checks.filter((c) => isLive(c.rule));
  const ruled = live.some((c) => c.verdict === 'match');
  if (ruled && covered) return 'both';
  if (ruled) return 'rule';
  if (covered) return 'window';
  // Nothing known explains it. Before calling it a miss, make sure nothing was unknown.
  if (live.some((c) => c.verdict === 'unevaluable')) return 'unevaluable';
  if (calendar !== 'there') return 'unavailable';
  if (checks.some((c) => !isLive(c.rule) && c.verdict === 'match')) return 'hypothetical';
  return 'none';
}

export function replayTicket(source: ReplaySource, t: Ticket): Replayed {
  const checks = source.rules
    .filter((r) => r.serviceId === t.serviceId)
    .sort((a, b) => Number(isLive(b)) - Number(isLive(a)))
    .map((rule) => ({ rule, verdict: check(rule, t) }));
  const gap = source.gaps.find((g) => (g.serviceId === 'all' || g.serviceId === t.serviceId) && t.at >= g.from && t.at < g.to);
  let window: Replayed['window'] = null;
  if (!gap) {
    for (const w of source.windows) {
      if (w.serviceId !== t.serviceId || !ciMatches(w.cis, t.ci)) continue;
      const run = w.runs.find(([s, e]) => t.at >= s && t.at < e);
      if (run) {
        window = { window: w, run };
        break;
      }
    }
  }
  const calendar = gap ?? 'there';
  return { ticket: t, life: source.life(t), checks, window, calendar, verdict: judge(checks, window !== null, calendar) };
}

const zeros = <K extends string>(keys: readonly K[]) => Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;

export function replay(source: ReplaySource, scope: ReplayScope): Replay {
  const inScope = source.tickets.filter(
    (t) => t.at >= scope.from && t.at < scope.to && (scope.serviceId === 'all' || t.serviceId === scope.serviceId),
  );
  const rules = source.rules.filter((r) => scope.serviceId === 'all' || r.serviceId === scope.serviceId);
  const windows = source.windows.filter((w) => scope.serviceId === 'all' || w.serviceId === scope.serviceId);
  const replayed = inScope.map((t) => replayTicket(source, t));
  const hand = replayed.filter((r) => isHandClosed(r.life));

  const population = { ...zeros(['open', 'closed', 'cancelled', 'other'] as const), closedByHand: 0, closedAuto: 0, total: replayed.length };
  for (const r of replayed) {
    population[r.life.lifecycle]++;
    if (r.life.lifecycle === 'closed') population[r.life.closedBy === 'hand' ? 'closedByHand' : 'closedAuto']++;
  }

  const verdicts = zeros(VERDICTS);
  const groups = zeros(GROUPS);
  for (const r of hand) {
    verdicts[r.verdict]++;
    groups[GROUP_OF[r.verdict]]++;
  }

  const ruleRow = (rule: ReplayRule): SourceRow => {
    const row: SourceRow = { id: rule.id, name: rule.name, kind: 'rule', status: rule.status, matches: 0, only: 0, incidents: 0, unevaluable: 0 };
    for (const r of hand) {
      const mine = r.checks.find((c) => c.rule.id === rule.id);
      if (!mine) continue;
      if (mine.verdict === 'unevaluable') row.unevaluable++;
      if (mine.verdict !== 'match') continue;
      row.matches++;
      if (r.ticket.outcome === 'incident') row.incidents++;
      const others = r.checks.some((c) => c.rule.id !== rule.id && isLive(c.rule) && c.verdict === 'match') || r.window !== null;
      if (!others) row.only++;
    }
    return row;
  };

  const windowRow = (w: ReplayWindow): SourceRow => {
    const row: SourceRow = { id: w.id, name: w.name, kind: 'window', matches: 0, only: 0, incidents: 0, unevaluable: 0 };
    for (const r of hand) {
      if (r.window?.window.id !== w.id) continue;
      row.matches++;
      if (r.ticket.outcome === 'incident') row.incidents++;
      if (r.verdict === 'window') row.only++;
    }
    return row;
  };

  const byMatches = (a: SourceRow, b: SourceRow) => b.matches - a.matches || a.id.localeCompare(b.id);
  const sources = [...rules.filter(isLive).map(ruleRow), ...windows.map(windowRow)].sort(byMatches);
  const hypothetical = rules
    .filter((r) => !isLive(r))
    .map(ruleRow)
    .map((row) => ({ ...row, only: hand.filter((r) => r.verdict === 'hypothetical' && r.checks.some((c) => c.rule.id === row.id && c.verdict === 'match')).length }))
    .sort(byMatches);

  // Where the gaps keep landing: same CI, same cause.
  const lastWeeks = 12;
  const weeksFrom = scope.to - lastWeeks * WEEK;
  const clusters = new Map<string, GapCluster>();
  for (const r of hand) {
    if (r.verdict !== 'none') continue;
    const t = r.ticket;
    const key = `${t.serviceId}:${t.ci}:${t.cause}`;
    const c = clusters.get(key) ?? { key, serviceId: t.serviceId, ci: t.ci, cause: t.cause, count: 0, incidents: 0, lastAt: 0, weekly: Array<number>(lastWeeks).fill(0) };
    c.count++;
    if (t.outcome === 'incident') c.incidents++;
    c.lastAt = Math.max(c.lastAt, t.at);
    const w = Math.floor((t.at - weeksFrom) / WEEK);
    if (w >= 0 && w < lastWeeks) c.weekly[w]++;
    clusters.set(key, c);
  }
  const gaps = [...clusters.values()].sort((a, b) => b.count - a.count).slice(0, 8);

  // Why the unknowns are unknown.
  const reasons = new Map<string, UnknownReason>();
  for (const r of hand) {
    if (r.verdict === 'unevaluable') {
      for (const c of r.checks) {
        if (!isLive(c.rule) || c.verdict !== 'unevaluable' || !c.rule.needs) continue;
        const key = `rule:${c.rule.id}`;
        const reason = reasons.get(key) ?? {
          key,
          verdict: 'unevaluable' as const,
          title: `${c.rule.id} reads ${c.rule.needs.field}`,
          detail: `Not recorded before ${dayMonthYear(c.rule.needs.since)}`,
          count: 0,
        };
        reason.count++;
        reasons.set(key, reason);
      }
    } else if (r.verdict === 'unavailable' && r.calendar !== 'there') {
      const g = r.calendar;
      const key = `gap:${g.serviceId}:${g.from}`;
      const reason = reasons.get(key) ?? { key, verdict: 'unavailable' as const, title: `No change calendar, ${dayMonth(g.from)} to ${dayMonth(g.to - 1)}`, detail: g.why, count: 0 };
      reason.count++;
      reasons.set(key, reason);
    }
  }
  const unknowns = [...reasons.values()].sort((a, b) => b.count - a.count);

  const weekCount = Math.round((scope.to - scope.from) / WEEK);
  const weeks: WeekVerdicts[] = Array.from({ length: weekCount }, (_, i) => ({ start: iso(scope.from + i * WEEK), explained: 0, unexplained: 0, unknown: 0, total: 0 }));
  for (const r of hand) {
    const w = weeks[Math.floor((r.ticket.at - scope.from) / WEEK)];
    if (!w) continue;
    w[GROUP_OF[r.verdict]]++;
    w.total++;
  }

  return {
    scope,
    tickets: replayed.reverse(),
    population,
    verdicts,
    groups,
    activeRules: rules.filter(isLive).length,
    windows: windows.length,
    sources,
    hypothetical,
    gaps,
    unknowns,
    weeks,
  };
}

const dayMonth = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const dayMonthYear = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** The day before `to`, for "to 27 Sept" when `to` is exclusive. */
export const lastDay = (to: number) => to - DAY;
