/* What the chapters and the ticket dock read off a replay, beyond replay() itself: the
 * verdict in plain words, the path every ticket takes (the method, drawn with this run's own
 * figures), and the dock's groups. Pure functions; components only draw what they return. */

import { serviceName } from '../data/mockData';
import { CAUSE_LABEL, WEEK, dayMonth } from './labels';
import { GROUP_OF, type Replay, type Replayed, type Verdict, type VerdictGroup } from './replay';
import { LIFECYCLE, LIFE_KEYS, LIFE_TONE, VERDICT, VERDICT_TONE, type LifeKey } from './words';

/* ---------- the chapters ---------- */

export type ChapterId = 'verdict' | 'sources' | 'caught' | 'tune' | 'method';
export const CHAPTERS: { id: ChapterId; name: string; key: string }[] = [
  { id: 'verdict', name: 'Verdict', key: '1' },
  { id: 'sources', name: 'Sources', key: '2' },
  { id: 'caught', name: 'Caught by', key: '3' },
  { id: 'tune', name: 'Tune next', key: '4' },
  { id: 'method', name: 'Method', key: '5' },
];

/* ---------- a share, the way a person says it ---------- */

const DENOMINATORS = [2, 3, 4, 5, 10];

/** 0.75 → "3 in 4", 0.18 → "1 in 5", 0.85 → "85%", 0.003 → "Fewer than 1 in 20". */
export function inWords(share: number): string {
  if (share <= 0) return 'None';
  if (share >= 0.995) return 'All';
  if (share < 0.05) return 'Fewer than 1 in 20';
  for (const d of DENOMINATORS) {
    const n = Math.round(share * d);
    if (n > 0 && n < d && Math.abs(n / d - share) < 0.026) return `${n} in ${d}`;
  }
  return `${Math.round(share * 100)}%`;
}

/* ---------- the method: the path every ticket closed by hand takes ---------- */

export interface MethodStep {
  /** The question asked at this step, short. */
  ask: string;
  /** The verdicts that leave the path here. */
  exits: Verdict[];
  group: VerdictGroup;
  count: number;
  /** Still on the path before this step. */
  before: number;
}

/** In the order judge() asks, so each step only sees what the ones before let through. */
const PATH: { ask: string; exits: Verdict[] }[] = [
  { ask: 'Does an active rule match it?', exits: ['rule', 'both'] },
  { ask: 'Was an approved window running?', exits: ['window'] },
  { ask: 'Could every rule read its fields?', exits: ['unevaluable'] },
  { ask: 'Was the change calendar there?', exits: ['unavailable'] },
  { ask: 'Would a proposed rule match?', exits: ['hypothetical'] },
  { ask: 'Nothing left to ask', exits: ['none'] },
];

export function methodSteps(r: Replay): MethodStep[] {
  let left = r.population.closedByHand;
  return PATH.map((p) => {
    const count = p.exits.reduce((n, v) => n + r.verdicts[v], 0);
    const step = { ...p, group: GROUP_OF[p.exits[0]], count, before: left };
    left -= count;
    return step;
  });
}

/* ---------- the dock's groups ---------- */

export type GroupBy = 'flat' | 'verdict' | 'life' | 'ci' | 'week';
export const GROUP_BYS: { id: GroupBy; name: string }[] = [
  { id: 'flat', name: 'Flat' },
  { id: 'verdict', name: 'Verdict' },
  { id: 'life', name: 'Outcome' },
  { id: 'ci', name: 'CI' },
  { id: 'week', name: 'Week' },
];

export interface TicketGroup {
  key: string;
  label: string;
  /** A second, quieter label: the service of a CI, the dates of a week. */
  sub?: string;
  tone?: string;
  rows: Replayed[];
  incidents: number;
}

export const lifeOf = (r: Replayed): LifeKey => (r.life.lifecycle === 'closed' ? (r.life.closedBy === 'hand' ? 'closedByHand' : 'closedAuto') : r.life.lifecycle);

const VERDICT_ORDER: Verdict[] = ['none', 'hypothetical', 'rule', 'both', 'window', 'unevaluable', 'unavailable'];

/** Groups keep the list's own order (newest first) inside them. Empty groups are left out. */
export function groupTickets(rows: Replayed[], by: GroupBy, from: number): TicketGroup[] {
  if (by === 'flat') return [{ key: 'all', label: 'All', rows, incidents: count(rows) }];
  const buckets = new Map<string, Replayed[]>();
  const keyOf = (r: Replayed) => {
    if (by === 'verdict') return r.verdict;
    if (by === 'life') return lifeOf(r);
    if (by === 'ci') return `${r.ticket.serviceId}:${r.ticket.ci}`;
    return String(Math.floor((r.ticket.at - from) / WEEK));
  };
  for (const r of rows) {
    const k = keyOf(r);
    const b = buckets.get(k);
    if (b) b.push(r);
    else buckets.set(k, [r]);
  }
  const make = (key: string, list: Replayed[]): TicketGroup => {
    if (by === 'verdict') return { key, label: VERDICT[key as Verdict], tone: VERDICT_TONE[key as Verdict], rows: list, incidents: count(list) };
    if (by === 'life') return { key, label: LIFECYCLE[key as LifeKey], tone: LIFE_TONE[key as LifeKey], rows: list, incidents: count(list) };
    if (by === 'ci') {
      const t = list[0].ticket;
      const causes = new Set(list.map((r) => r.ticket.cause));
      return { key, label: t.ci, sub: `${serviceName(t.serviceId)}${causes.size === 1 ? ` · ${CAUSE_LABEL[t.cause]}` : ''}`, rows: list, incidents: count(list) };
    }
    const start = from + Number(key) * WEEK;
    return { key, label: `Week of ${dayMonth(start)}`, sub: `to ${dayMonth(start + WEEK - 1)}`, rows: list, incidents: count(list) };
  };
  const groups = [...buckets].map(([k, list]) => make(k, list));
  if (by === 'verdict') return groups.sort((a, b) => VERDICT_ORDER.indexOf(a.key as Verdict) - VERDICT_ORDER.indexOf(b.key as Verdict));
  if (by === 'life') return groups.sort((a, b) => LIFE_KEYS.indexOf(a.key as LifeKey) - LIFE_KEYS.indexOf(b.key as LifeKey));
  if (by === 'ci') return groups.sort((a, b) => b.rows.length - a.rows.length || a.key.localeCompare(b.key));
  return groups.sort((a, b) => Number(b.key) - Number(a.key));
}

const count = (rows: Replayed[]) => rows.reduce((n, r) => n + (r.ticket.outcome === 'incident' ? 1 : 0), 0);

/** Which groups show their tickets: the reader's own choice, or, before they've made one,
 *  all of them when the list is short or there's only one. */
export function isOpen(group: TicketGroup, groups: TicketGroup[], total: number, chosen: Record<string, boolean>) {
  if (group.key in chosen) return chosen[group.key];
  return groups.length === 1 || total <= 40;
}

/** The tickets showing, in order, for J and K. */
export function visibleRows(groups: TicketGroup[], total: number, chosen: Record<string, boolean>): Replayed[] {
  return groups.flatMap((g) => (isOpen(g, groups, total, chosen) ? g.rows : []));
}
