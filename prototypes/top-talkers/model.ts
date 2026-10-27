/* Throwaway: who the top talkers are. One reading of every service over a lookback, built
 * from the same tickets the hindcast counts and the same rules the Rules page holds, so the
 * figures here agree with both pages. All four variants read this and nothing else.
 *
 *   tickets    every ticket raised against the service in the lookback
 *   incidents  the ones that turned out to be real (someone had to work them as an incident)
 *   rules      every rule written for the service: active, proposed and switched off */

import { SERVICES, TICKETS } from '../../src/pages/hindcast/data/mockData';
import { TODAY, WEEK } from '../../src/pages/hindcast/model/labels';
import type { Rule } from '../../src/pages/rule-management/model/types';

export type Measure = 'tickets' | 'incidents' | 'rules';

export const MEASURES: { key: Measure; label: string; one: string; many: string }[] = [
  { key: 'tickets', label: 'Tickets', one: 'ticket', many: 'tickets' },
  { key: 'incidents', label: 'Incidents', one: 'incident', many: 'incidents' },
  { key: 'rules', label: 'Rules', one: 'rule', many: 'rules' },
];

export const measureOf = (key: Measure) => MEASURES.find((m) => m.key === key)!;

export interface Talker {
  id: string;
  name: string;
  unit: string;
  tickets: number;
  incidents: number;
  /** The same counts over the lookback before this one, for the change. */
  before: { tickets: number; incidents: number };
  /** Tickets in each completed week of the lookback, oldest first. */
  weekly: number[];
  rules: { active: number; proposed: number; inactive: number; total: number };
  ruleList: Rule[];
  /** This service's slice of every ticket raised in the lookback. */
  share: number;
}

export function talkers(rules: Rule[], weeks: number): Talker[] {
  const from = TODAY - weeks * WEEK;
  const prior = from - weeks * WEEK;
  const inLookback = TICKETS.filter((t) => t.at >= from && t.at < TODAY);
  const everyone = inLookback.length;

  return SERVICES.map((s) => {
    const mine = inLookback.filter((t) => t.serviceId === s.id);
    const earlier = TICKETS.filter((t) => t.serviceId === s.id && t.at >= prior && t.at < from);
    const weekly = Array.from({ length: weeks }, (_, i) => mine.filter((t) => Math.floor((t.at - from) / WEEK) === i).length);
    const ruleList = rules.filter((r) => r.groupId === s.id);
    const count = (status: Rule['status']) => ruleList.filter((r) => r.status === status).length;
    return {
      id: s.id,
      name: s.name,
      unit: s.unit,
      tickets: mine.length,
      incidents: mine.filter((t) => t.outcome === 'incident').length,
      before: { tickets: earlier.length, incidents: earlier.filter((t) => t.outcome === 'incident').length },
      weekly,
      rules: { active: count('active'), proposed: count('proposed'), inactive: count('inactive'), total: ruleList.length },
      ruleList,
      share: everyone ? mine.length / everyone : 0,
    };
  });
}

export const valueOf = (t: Talker, m: Measure) => (m === 'rules' ? t.rules.total : t[m]);

/** Loudest first. Ties go to whichever raised more tickets, then by name, so the order never flickers. */
export const ranked = (list: Talker[], m: Measure) =>
  [...list].sort((a, b) => valueOf(b, m) - valueOf(a, m) || b.tickets - a.tickets || a.name.localeCompare(b.name));

/** Change against the lookback before, as a fraction; null when there was nothing before. */
export const changeOf = (now: number, before: number) => (before > 0 ? (now - before) / before : null);

export const words = (n: number, m: Measure) => (n === 1 ? measureOf(m).one : measureOf(m).many);

/** Links into the real app, which runs beside the prototype on the same server. */
export const hrefs = {
  hindcast: (id: string, weeks = 12) => `/#/hindcast/${id}/${weeks}`,
  rules: (id: string) => `/#/rules?group=assignment.${id}`,
  rule: (ruleId: string) => `/#/rules/${ruleId}`,
};
