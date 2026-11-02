/* Throwaway: a rule's conditions in plain words. Every variant runs on this; only the way
 * it's drawn differs. A condition is stored as `field op value` (metric.coupling_temp_c < 72);
 * a person reads "Coupling temperature below 72°C".
 *
 * The real version needs this same dictionary, one label per field, with this fallback for
 * any field nobody has named yet: the last part of the field, its unit read off its suffix. */

import type { Condition, Rule } from '../../src/pages/rule-management/model/types';

const LABEL: Record<string, string> = {
  ci: 'CI',
  'ci.class': 'CI class',
  'ci.region': 'Region',
  'alert.type': 'Alert type',
  'alert.code': 'Alert code',
  'alert.state': 'Alert state',
  'alert.duration': 'Alert lasts',
  'alert.object_size_m': 'Object size',
  priority: 'Priority',
  short_description: 'Description',
  'dedupe.window': 'Repeats within',
  'dedupe.gap': 'Gap between repeats',
  'metric.coupling_temp_c': 'Coupling temperature',
  'metric.hydraulic_bar': 'Hydraulic pressure',
  'metric.calibration_drift_pct': 'Calibration drift',
  'metric.co2_ppm': 'CO₂',
  'metric.packet_loss_pct': 'Packet loss',
  'metric.flow_variance': 'Flow variance',
  'hangar.temp_c': 'Hangar temperature',
  'reactor.output_pct': 'Reactor output',
  'retry.result': 'Retry',
  'next_attempt.result': 'Next attempt',
  'nav.state': 'Navigation',
  'guard.rotation': 'Guard rotation',
  'crew.shift_change': 'Shift change',
  'drill.active': 'Drill',
  'location.system': 'System',
  location: 'Location',
  fleet: 'Fleet',
  check: 'Check',
  job: 'Job',
  attempt: 'Attempt',
  item: 'Item',
  variance: 'Variance',
  caller: 'Caller',
  sequence: 'Sequence',
};

/** Identifiers stay in mono: names of things, not words. */
const MONO = new Set(['ci', 'ci.class', 'alert.code', 'job', 'location']);

/** Durations read "under", not "below". */
const TIMED = new Set(['alert.duration', 'dedupe.window', 'dedupe.gap']);

const UNIT: [string, string][] = [
  ['_pct', '%'],
  ['_c', '°C'],
  ['_bar', ' bar'],
  ['_ppm', ' ppm'],
  ['_m', ' m'],
];

const unitOf = (field: string) => UNIT.find(([suffix]) => field.endsWith(suffix))?.[1] ?? '';

/** Any field nobody has named: its last part, tidied. */
function fallback(field: string) {
  let last = field.split('.').pop()!;
  for (const [suffix] of UNIT) if (last.endsWith(suffix)) last = last.slice(0, -suffix.length);
  const words = last.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export interface Plain {
  /** "Coupling temperature" */
  label: string;
  /** "below" */
  op: string;
  /** "72°C". Several for "is one of". */
  values: string[];
  mono: boolean;
  /** The condition as stored, for anyone who wants it exactly. */
  raw: string;
  /** "the coupling temperature is below", for a sentence: the values follow it. */
  lead: string;
  /** "the coupling temperature is below 72°C" */
  phrase: string;
}

export function plain(c: Condition): Plain {
  const label = LABEL[c.field] ?? fallback(c.field);
  const mono = MONO.has(c.field);
  const unit = unitOf(c.field);
  const withUnit = (v: string) => (unit && /\d$/.test(v) ? `${v}${unit}` : v);
  // snake_case values read as words: pressure_warning → pressure warning.
  const tidy = (v: string) => (mono ? v : v.replace(/_/g, ' '));
  let op: string;
  let values = [tidy(withUnit(c.value))];

  switch (c.op) {
    case 'matches': {
      const stars = (c.value.match(/\*/g) ?? []).length;
      if (stars === 1 && c.value.endsWith('*')) {
        op = 'starts with';
        values = [c.value.slice(0, -1)];
      } else op = 'looks like';
      break;
    }
    case '<':
      op = TIMED.has(c.field) ? 'under' : 'below';
      break;
    case '<=':
      op = 'at most';
      break;
    case '>':
      op = 'above';
      break;
    case '>=':
      op = c.field === 'priority' ? 'is' : 'at least';
      if (c.field === 'priority') values = [`${c.value} or lower`];
      break;
    case 'between':
      op = 'between';
      break;
    case 'in':
      values = c.value.split(',').map((v) => tidy(v.trim()));
      op = values.length > 1 ? 'is one of' : 'is';
      break;
    case 'contains':
      op = 'mentions';
      values = [`“${c.value}”`];
      break;
    default:
      op = c.field === 'dedupe.window' ? 'within' : 'is';
      if (c.field === 'dedupe.window') values = [c.value];
  }

  if (c.value === 'true') {
    op = 'is';
    values = ['under way'];
  }

  const said = values.length > 1 ? `${values.slice(0, -1).join(', ')} or ${values[values.length - 1]}` : values[0];
  const lower = /^[A-Z]{2}/.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1);
  // "below 72°C" needs a verb in a sentence: the temperature *is* below it.
  const verb = /^(is|starts|looks|mentions)/.test(op) ? op : `is ${op}`;
  const lead = c.field === 'dedupe.window' ? 'it repeats within' : c.field === 'alert.duration' ? `the alert lasts ${op}` : `the ${lower} ${verb}`;

  return { label: c.field === 'dedupe.window' ? 'Repeats' : label, op, values, mono, raw: `${c.field} ${c.op} ${c.value}`, lead, phrase: `${lead} ${said}` };
}

/** "Rolling 90 days" → "the last 90 days", for a sentence. */
export const span = (rule: Rule) => rule.evidence.window.replace(/^rolling\s+/i, 'the last ').replace(/^Last/, 'the last');

/* ---------- made-up counts, for the variants that show what each condition does ---------- */

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** How many of the group's incidents are left after each condition, in order: the group's
 *  whole count first, the rule's own count last. A real version gets these from the rule
 *  engine (a count per prefix of the conditions); here they're made up, steadily narrowing. */
export function narrowing(rule: Rule): number[] {
  const r = rng(rule.id);
  const end = rule.incidentCount;
  const start = Math.round((end * (9 + r() * 14)) / 10) * 10;
  const n = rule.evidence.conditions.length;
  const counts = [start];
  for (let i = 1; i < n; i++) {
    // Each step keeps a share of what's left, so the last lands on the rule's own count.
    const ideal = start * Math.pow(end / start, i / n);
    counts.push(Math.max(end + 1, Math.round(ideal * (0.8 + r() * 0.4))));
  }
  counts.push(end);
  return counts;
}

/** How many incidents the rule would match without each condition: what each one keeps out. */
export function without(rule: Rule): number[] {
  const r = rng(rule.id + 'without');
  const counts = narrowing(rule);
  return rule.evidence.conditions.map((_, i) => {
    // Dropping an early, broad condition lets in more than dropping a late, narrow one.
    const share = counts[i] / counts[0];
    return Math.max(rule.incidentCount + 1, Math.round(rule.incidentCount * (1.4 + r() * 3 + share * 6)));
  });
}
