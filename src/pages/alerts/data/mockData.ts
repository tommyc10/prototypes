/* Mock data: a stream of alerts, made up the same way every time. Any minute of the stream
 * can be asked for, past or future, and always comes back the same, which is what lets the
 * page run live and still be rewound. This is the file the real backend replaces (a
 * websocket for the live end, a query for the history). Nothing else knows the data is fake.
 *
 * The alerts are modelled on the rules: each rule's sample incidents give the titles and CIs
 * of the alerts that fit it, and its incident count says how often they arrive. A few alerts
 * fit no rule at all. Those are the real faults. */

import { RULES } from '../../rule-management/data/mockData';
import type { Alert, Severity } from '../model/types';

export const MINUTE = 60_000;
/** How much of the stream the page shows. */
export const WINDOW_MINUTES = 60;
export const WINDOW = WINDOW_MINUTES * MINUTE;

const SOURCE_BY_GROUP: Record<string, string> = {
  reactor: 'Reactor telemetry',
  tractor: 'Reactor telemetry',
  facilities: 'Droid patrol',
  detention: 'Security net',
  lifesupport: 'Environmental sensors',
  hyperdrive: 'Fleet diagnostics',
  hangar: 'Flight deck sensors',
  holonet: 'HoloNet monitor',
  armory: 'Security net',
};

interface Template {
  ruleId?: string;
  titles: string[];
  ci: string;
  groupId: string;
  severity: Severity;
  /** How often it arrives, against the others. */
  weight: number;
  /** When nothing hides it: the share that opens a new incident (the rest fold into one). */
  pagedShare: number;
}

/** Alerts that fit a rule: noise, mostly. A rule with low purity matches real faults too. */
const FROM_RULES: Template[] = RULES.map((rule) => {
  const sample = rule.related.filter((i) => i.resolution !== 'escalated');
  return {
    ruleId: rule.id,
    titles: [...new Set(sample.map((i) => i.title))],
    ci: sample[0].ci,
    groupId: rule.groupId,
    severity: 'info',
    weight: rule.incidentCount,
    pagedShare: Math.max(0.1, 1 - rule.purity),
  };
});

const RULE_WEIGHT = FROM_RULES.reduce((sum, t) => sum + t.weight, 0);

/** Alerts no rule fits: the real faults. Together, about one alert in seven. */
const UNMATCHED: Template[] = (
  [
    ['Reactor containment field fluctuating', 'reactor-core-main', 'reactor', 'critical'],
    ['Detention level AA-23 security door forced', 'aa23-blast-door-1', 'detention', 'critical'],
    ['Life support pressure dropping, deck 14', 'executor-deck14-air', 'lifesupport', 'critical'],
    ['Hangar bay 327 magnetic seal fault', 'hangar-327-magseal', 'hangar', 'warning'],
    ['Hyperdrive coolant leak, ISD Devastator', 'motivator-isd-devastator', 'hyperdrive', 'warning'],
    ['HoloNet relay unreachable, Scarif', 'holonet-relay-scarif', 'holonet', 'warning'],
    ['Tractor beam generator 2 offline', 'tb-generator-02', 'tractor', 'warning'],
    ['Armory deck 5 door held open', 'armory-deck-5-door', 'armory', 'warning'],
  ] as const
).map(([title, ci, groupId, severity]) => ({
  titles: [title],
  ci,
  groupId,
  severity,
  weight: (RULE_WEIGHT * 0.16) / 8,
  pagedShare: 0.45,
}));

const TEMPLATES = [...FROM_RULES, ...UNMATCHED];
const TOTAL_WEIGHT = TEMPLATES.reduce((sum, t) => sum + t.weight, 0);

/** A random-number generator that gives the same numbers for the same seed. */
function rng(seed: number) {
  let h = seed >>> 0;
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(r: () => number) {
  let at = r() * TOTAL_WEIGHT;
  for (const template of TEMPLATES) {
    at -= template.weight;
    if (at <= 0) return template;
  }
  return TEMPLATES[0];
}

const cache = new Map<number, Alert[]>();

/** Every alert that arrives in one minute (counted from 1970), oldest first. */
function minuteOfAlerts(minute: number): Alert[] {
  const cached = cache.get(minute);
  if (cached) return cached;

  const r = rng(Math.imul(minute, 2654435761));
  // A steady trickle, and now and then a storm: one monitor flapping for a couple of minutes.
  const storming = minute % 17 === 5 || minute % 17 === 6;
  const storm = FROM_RULES[(Math.floor(minute / 17) * 7) % FROM_RULES.length];
  const count = 7 + Math.floor(r() * 8) + (storming ? 12 : 0);

  const alerts = Array.from({ length: count }, (_, i): Alert => {
    const template = storming && i >= count - 12 ? storm : pick(r);
    const index = TEMPLATES.indexOf(template);
    const paged = r() < template.pagedShare;
    const serial = (minute * 40 + i) % 900_000;
    return {
      id: `ALT-${100_000 + serial}`,
      at: minute * MINUTE + Math.floor(r() * MINUTE),
      title: template.titles[Math.floor(r() * template.titles.length)],
      ci: template.ci,
      source: SOURCE_BY_GROUP[template.groupId],
      severity: paged && template.severity === 'info' ? 'warning' : template.severity,
      groupId: template.groupId,
      ruleId: template.ruleId,
      fallback: paged ? 'paged' : 'folded',
      // Folded alerts share an incident with the others like them from the same 20 minutes.
      incidentId: paged ? `INC-${60_000 + (serial % 9_000)}` : `INC-${50_000 + ((index * 97 + Math.floor(minute / 20) * 13) % 9_000)}`,
    };
  }).sort((a, b) => a.at - b.at);

  cache.set(minute, alerts);
  if (cache.size > 400) cache.delete(cache.keys().next().value!);
  return alerts;
}

/** Every alert that arrived after `from` and up to `to`, oldest first. */
export function alertsBetween(from: number, to: number): Alert[] {
  const out: Alert[] = [];
  for (let minute = Math.floor(from / MINUTE); minute <= Math.floor(to / MINUTE); minute++) {
    for (const alert of minuteOfAlerts(minute)) if (alert.at > from && alert.at <= to) out.push(alert);
  }
  return out;
}
