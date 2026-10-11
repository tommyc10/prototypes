/* What the home page says, worked out from the other pages' data: the queue of things
 * waiting on a person, and how each assignment group's hour has gone. Nothing here is
 * stored. It's the same alerts, rules and change windows the other pages show, read for
 * "how is the station, and what should I look at first?" */

import { num } from '../../../lib/format';
import { MINUTE, WINDOW_MINUTES } from '../../alerts/data/mockData';
import type { RuleAtWork, StreamAlert, Tally } from '../../alerts/model/types';
import type { ChangeWindow } from '../../change-windows/model/types';
import { howLong, inPlace, statusOf } from '../../change-windows/model/windows';
import { GROUPS } from '../../rule-management/data/mockData';
import { isLowConfidence } from '../../rule-management/model/policy';
import type { AssignmentGroup, Rule } from '../../rule-management/model/types';

export const plural = (n: number, one: string, many = `${one}s`) => `${num(n)} ${n === 1 ? one : many}`;

/** One thing waiting on a person. */
export interface Need {
  key: string;
  kind: 'Change window' | 'Proposed rule';
  /** bad: acting on it as it stands would hurt. warn: it needs a look. plain: it's waiting. */
  tone: 'bad' | 'warn' | 'plain';
  title: string;
  why: string;
  href: string;
  groupId: string;
}

/** The queue, most pressing first: windows past their end, then proposed rules, the risky ones first. */
export function needs(windows: ChangeWindow[], now: number, rules: Rule[], atWork: RuleAtWork[]): Need[] {
  const fits = new Map(atWork.map((row) => [row.rule.id, row]));

  const late: Need[] = windows
    .filter((w) => statusOf(w, now) === 'overrunning')
    .map((w) => ({
      key: w.key,
      kind: 'Change window',
      tone: 'warn',
      title: w.name,
      why: `Past its planned end by ${howLong(now - w.plannedEnd)}, and still holding alerts back.`,
      href: `#/changes/${w.id}`,
      groupId: w.groupId,
    }));

  const waiting = rules
    .filter((r) => r.status === 'proposed')
    .map((rule) => {
      const row = fits.get(rule.id);
      const paged = row?.paged ?? 0;
      const count = row?.count ?? 0;
      const low = isLowConfidence(rule);
      const need: Need = {
        key: rule.id,
        kind: 'Proposed rule',
        tone: paged > 0 ? 'bad' : low ? 'warn' : 'plain',
        title: rule.name,
        why:
          paged > 0
            ? `Fits ${plural(count, 'alert')} this hour. ${plural(paged, 'was a real page', 'were real pages')} it would have hidden.`
            : low
              ? `Below the confidence floor. Fits ${plural(count, 'alert')} this hour, none of them a page.`
              : count > 0
                ? `Fits ${plural(count, 'alert')} this hour, and none of them reached a person.`
                : 'Nothing has fitted it in the last hour.',
        href: `#/rules/${rule.id}`,
        groupId: rule.groupId,
      };
      return { need, rank: paged * 1000 + (low ? 500 : 0) + count };
    })
    .sort((a, b) => b.rank - a.rank)
    .map((row) => row.need);

  return [...late, ...waiting];
}

export interface GroupReading {
  group: AssignmentGroup;
  /** Alerts from this group in the last hour, and what became of them. */
  total: number;
  paged: number;
  hidden: number;
  /** Pages a proposed rule would have hidden. */
  risky: number;
  /** The hour in twelve five-minute stretches, oldest first. */
  buckets: { total: number; paged: number }[];
  /** Change windows in place for the group, and how many of those are past their end. */
  windows: number;
  late: number;
  /** Rules for this group waiting on a decision. */
  proposed: number;
}

/** Every group, the one that paged people most first. */
export function groupReadings(alerts: StreamAlert[], now: number, windows: ChangeWindow[], windowsNow: number, rules: Rule[]): GroupReading[] {
  const start = now - WINDOW_MINUTES * MINUTE;
  return GROUPS.map((group) => {
    const buckets = Array.from({ length: 12 }, () => ({ total: 0, paged: 0 }));
    const reading = { total: 0, paged: 0, hidden: 0, risky: 0 };
    for (const alert of alerts) {
      if (alert.groupId !== group.id) continue;
      const bucket = buckets[Math.min(11, Math.max(0, Math.floor((alert.at - start) / (5 * MINUTE))))];
      reading.total++;
      bucket.total++;
      if (alert.outcome === 'hidden') reading.hidden++;
      if (alert.outcome === 'paged') {
        reading.paged++;
        bucket.paged++;
        if (alert.wouldHide) reading.risky++;
      }
    }
    const live = windows.filter((w) => w.groupId === group.id && inPlace(w, windowsNow));
    return {
      group,
      ...reading,
      buckets,
      windows: live.length,
      late: live.filter((w) => statusOf(w, windowsNow) === 'overrunning').length,
      proposed: rules.filter((r) => r.groupId === group.id && r.status === 'proposed').length,
    };
  }).sort((a, b) => b.paged - a.paged || b.total - a.total);
}

export const clockFace = (ms: number, seconds = false) =>
  new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: seconds ? '2-digit' : undefined });

export const dayFace = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');

/** The tone a status dot takes: red would hurt, orange needs a look, amber is waiting. */
export const TONE_COLOR = { bad: 'var(--red)', warn: 'var(--orange)', plain: 'var(--amber)' } as const;

/** The tone a group takes, by the most pressing thing of its that is waiting. */
export const toneOf = (g: GroupReading) => (g.risky > 0 ? 'bad' : g.late > 0 ? 'warn' : g.proposed > 0 ? 'plain' : null);

/** Everything the page shows. */
export interface Station {
  /** The stream's time. It moves when an alert arrives. */
  now: number;
  alerts: StreamAlert[];
  counts: Tally;
  queue: Need[];
  groups: GroupReading[];
}
