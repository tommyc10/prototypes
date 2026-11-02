/* Who the top talkers are. Every figure on the Services page comes from here, so the list,
 * the pane and the sentence can't disagree. */

import { SERVICES, TICKETS } from '../../hindcast/data/mockData';
import { TODAY, WEEK } from '../../hindcast/model/labels';
import type { Lookback as HindcastLookback } from '../../hindcast/model/types';
import type { Rule } from '../../rule-management/model/types';
import type { Lookback, Measure, Talker } from './types';

export const MEASURES: { key: Measure; label: string; one: string; many: string }[] = [
  { key: 'tickets', label: 'Tickets', one: 'ticket', many: 'tickets' },
  { key: 'incidents', label: 'Incidents', one: 'incident', many: 'incidents' },
  { key: 'rules', label: 'Rules', one: 'rule', many: 'rules' },
];

export const LOOKBACKS: Lookback[] = [4, 12, 26];
export const DEFAULT_LOOKBACK: Lookback = 4;

export const measureOf = (key: Measure) => MEASURES.find((m) => m.key === key)!;

/** The measure after this one, for the S key. */
export const nextMeasure = (key: Measure) => MEASURES[(MEASURES.findIndex((m) => m.key === key) + 1) % MEASURES.length]!.key;

export function talkers(rules: Rule[], weeks: Lookback): Talker[] {
  const from = TODAY - weeks * WEEK;
  const prior = from - weeks * WEEK;
  const inLookback = TICKETS.filter((t) => t.at >= from && t.at < TODAY);

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
      share: inLookback.length ? mine.length / inLookback.length : 0,
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

/** "1st", "2nd"… for "2nd loudest". */
export const ordinal = (n: number) => {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
  return `${n}${suffix}`;
};

/** The hindcast only looks back 12, 26 or 52 weeks: open it on the nearest that covers ours. */
const hindcastWeeks = (weeks: Lookback): HindcastLookback => (weeks <= 12 ? 12 : 26);

/** Where each service's other pages are. */
export const hrefs = {
  service: (id: string) => `#/services/${id}`,
  hindcast: (id: string, weeks: Lookback) => `#/hindcast/${id}/${hindcastWeeks(weeks)}`,
  rules: (id: string) => `#/rules?group=assignment.${id}`,
  rule: (ruleId: string) => `#/rules/${ruleId}`,
};
