/* What the ticket list shows: the replay's tickets narrowed by whatever is picked above (a
 * part of a bar, a rule or window, a gap, an unknown's reason), a lifecycle, a run of weeks
 * and a search. Each pick selects exactly the tickets its own count counted, so a number and
 * the list it opens always agree. */

import { GROUP_OF, isHandClosed, type Replay, type Replayed, type Verdict, type VerdictGroup } from './replay';
import { CAUSE_LABEL, WEEK } from './labels';
import { GROUP, VERDICT, type LifeKey } from './words';
import { serviceName } from '../data/mockData';

export type Focus =
  | { kind: 'group'; group: VerdictGroup }
  | { kind: 'verdict'; verdict: Verdict }
  | { kind: 'source'; id: string }
  | { kind: 'gap'; key: string }
  | { kind: 'unknown'; key: string };

export interface Narrowing {
  focus: Focus | null;
  life: LifeKey | null;
  weeks: [number, number] | null;
  query: string;
}

const lifeOf = (r: Replayed): LifeKey => (r.life.lifecycle === 'closed' ? (r.life.closedBy === 'hand' ? 'closedByHand' : 'closedAuto') : r.life.lifecycle);

function byFocus(focus: Focus): (r: Replayed) => boolean {
  switch (focus.kind) {
    case 'group':
      return (r) => isHandClosed(r.life) && GROUP_OF[r.verdict] === focus.group;
    case 'verdict':
      return (r) => isHandClosed(r.life) && r.verdict === focus.verdict;
    case 'source':
      return (r) => isHandClosed(r.life) && (r.window?.window.id === focus.id || r.checks.some((c) => c.rule.id === focus.id && c.verdict === 'match'));
    case 'gap':
      return (r) => isHandClosed(r.life) && r.verdict === 'none' && `${r.ticket.serviceId}:${r.ticket.ci}:${r.ticket.cause}` === focus.key;
    case 'unknown': {
      const [kind, ...rest] = focus.key.split(':');
      if (kind === 'rule') return (r) => isHandClosed(r.life) && r.verdict === 'unevaluable' && r.checks.some((c) => c.rule.id === rest[0] && c.verdict === 'unevaluable');
      return (r) => isHandClosed(r.life) && r.verdict === 'unavailable' && r.calendar !== 'there' && `${r.calendar.serviceId}:${r.calendar.from}` === rest.join(':');
    }
  }
}

export function narrow(replay: Replay, n: Narrowing): Replayed[] {
  const q = n.query.trim().toLowerCase();
  const from = replay.scope.from;
  const pass = n.focus ? byFocus(n.focus) : () => true;
  return replay.tickets.filter((r) => {
    if (n.life && lifeOf(r) !== n.life) return false;
    if (n.weeks) {
      const w = Math.floor((r.ticket.at - from) / WEEK);
      if (w < n.weeks[0] || w > n.weeks[1]) return false;
    }
    if (q && !`${r.ticket.id} ${r.ticket.ci} ${r.ticket.title}`.toLowerCase().includes(q)) return false;
    return pass(r);
  });
}

/** Counts per lifecycle, for the tabs, after every narrowing but the lifecycle itself. */
export function lifeCounts(replay: Replay, n: Narrowing): Record<LifeKey, number> {
  const counts: Record<LifeKey, number> = { closedByHand: 0, closedAuto: 0, cancelled: 0, open: 0, other: 0 };
  for (const r of narrow(replay, { ...n, life: null })) counts[lifeOf(r)]++;
  return counts;
}

/** The pick above, in words, for the chip over the list. */
export function focusWords(replay: Replay, focus: Focus): string {
  switch (focus.kind) {
    case 'group':
      return `Closed by hand: ${GROUP[focus.group].toLowerCase()}`;
    case 'verdict':
      return `Closed by hand: ${VERDICT[focus.verdict].toLowerCase()}`;
    case 'source': {
      const row = [...replay.sources, ...replay.hypothetical].find((s) => s.id === focus.id);
      const hypo = row?.kind === 'rule' && row.status !== 'active';
      return `Closed by hand that ${focus.id} ${hypo ? 'would match, hypothetically' : 'matches'}`;
    }
    case 'gap': {
      const g = replay.gaps.find((x) => x.key === focus.key);
      return g ? `Nothing explains: ${g.ci}, ${CAUSE_LABEL[g.cause].toLowerCase()}, ${serviceName(g.serviceId)}` : 'A gap';
    }
    case 'unknown': {
      const u = replay.unknowns.find((x) => x.key === focus.key);
      return u ? `Unknown: ${u.title}` : 'Unknown';
    }
  }
}
