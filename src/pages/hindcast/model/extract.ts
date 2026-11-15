/* A historical extract: a replay someone ran in the past, kept as it was. Its aggregate is the
 * same replay() over its own dates, with the rules as they stood on the day it ran and the
 * windows approved then. Its diagnostics say how much of that run can be trusted: what the
 * ticket store gave it, which fields the rules read were there, and when the calendar wasn't. */

import { type Extract, WINDOWS, rulesFrom, source } from '../data/replayData';
import type { Rule } from '../../rule-management/model/types';
import { type Gap, type Replay, ciMatches, replay } from './replay';

export interface FieldCoverage {
  ruleId: string;
  field: string;
  /** Tickets the rule reads (its service, CIs and causes). */
  read: number;
  /** Of those, the ones that had the field. */
  recorded: number;
  since: number;
}

export interface RuleChange {
  id: string;
  name: string;
  then: Rule['status'];
  now: Rule['status'];
}

export interface Diagnostics {
  rows: { read: number; duplicates: number; noCi: number; kept: number };
  fields: FieldCoverage[];
  /** Gaps inside the extract's dates, clipped to them. */
  gaps: Gap[];
  /** Share of the extract's time the change calendar was there, 0 to 1. */
  calendarShare: number;
  /** Rules whose status has moved since the extract ran. */
  changed: RuleChange[];
  /** Windows approved since, which the extract doesn't know about. */
  newWindows: { id: string; name: string }[];
}

export interface ExtractReport {
  extract: Extract;
  replay: Replay;
  diagnostics: Diagnostics;
}

export function runExtract(extract: Extract, store: Pick<Rule, 'id' | 'name' | 'status'>[]): ExtractReport {
  const rules = rulesFrom(store, extract.statusThen);
  const windows = WINDOWS.filter((w) => extract.windowIds.includes(w.id));
  const src = source(rules, windows, extract.gaps);
  const result = replay(src, { serviceId: extract.serviceId, from: extract.from, to: extract.to });

  const inScope = result.tickets.map((r) => r.ticket);
  const fields: FieldCoverage[] = rules
    .filter((r) => r.needs)
    .filter((r) => extract.serviceId === 'all' || r.serviceId === extract.serviceId)
    .map((r) => {
      const read = inScope.filter((t) => t.serviceId === r.serviceId && ciMatches(r.cis, t.ci) && r.causes.includes(t.cause));
      return { ruleId: r.id, field: r.needs!.field, read: read.length, recorded: read.filter((t) => t.at >= r.needs!.since).length, since: r.needs!.since };
    });

  const span = extract.to - extract.from;
  const gaps = extract.gaps
    .filter((g) => g.to > extract.from && g.from < extract.to && (extract.serviceId === 'all' || g.serviceId === 'all' || g.serviceId === extract.serviceId))
    .map((g) => ({ ...g, from: Math.max(g.from, extract.from), to: Math.min(g.to, extract.to) }));
  // Only gaps that cover every service count against the whole calendar.
  const missing = gaps.filter((g) => g.serviceId === 'all' || g.serviceId === extract.serviceId).reduce((n, g) => n + (g.to - g.from), 0);

  const changed = rules
    .filter((r) => extract.statusThen[r.id])
    .map((r) => ({ id: r.id, name: r.name, then: extract.statusThen[r.id]!, now: store.find((s) => s.id === r.id)?.status ?? r.status }))
    .filter((c) => c.then !== c.now);

  const newWindows = WINDOWS.filter((w) => !extract.windowIds.includes(w.id) && (extract.serviceId === 'all' || w.serviceId === extract.serviceId)).map((w) => ({ id: w.id, name: w.name }));

  const kept = inScope.length;
  return {
    extract,
    replay: result,
    diagnostics: {
      rows: { read: kept + extract.dropped.duplicates + extract.dropped.noCi, ...extract.dropped, kept },
      fields,
      gaps,
      calendarShare: span > 0 ? 1 - missing / span : 1,
      changed,
      newWindows,
    },
  };
}
