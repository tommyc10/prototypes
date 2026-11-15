/* What the replay runs over, made up but deterministic. In the real app this file is replaced
 * by the rule engine's matchers, the change calendar and the ticket store's closure fields.
 *
 * The rules are the Rules page's own (same ids, names, and statuses read live from its store);
 * this file only says which of the hindcast's tickets each rule's conditions would catch. The
 * windows are the change calendar's recurring approved windows, run back through the history.
 * The history is shaped so the replay has something true to find: recalibration windows cover
 * the motivator faults on Tuesdays but not the ones the day after, the filter swap explains
 * life support's Sunday sensor alarms, the key rotation window covers certificate tickets that
 * were real incidents, and two fields the rules read were only recorded from a date. */

import type { Rule } from '../../rule-management/model/types';
import { DAY, TODAY, WEEK } from '../model/labels';
import type { Gap, ReplayRule, ReplaySource, ReplayWindow, TicketLife } from '../model/replay';
import type { Ticket } from '../model/types';
import { HISTORY_START, TICKETS } from './mockData';

const HOUR = 3_600_000;

/* ---------- rules: which tickets each one's conditions would catch ---------- */

type Matcher = Omit<ReplayRule, 'name' | 'status'>;

export const MATCHERS: Matcher[] = [
  { id: 'RUL-0412', serviceId: 'tractor', cis: ['tb-*'], causes: ['hardware', 'capacity', 'unknown', 'dependency'], share: 0.55 },
  { id: 'RUL-0419', serviceId: 'reactor', cis: ['core-cell-*'], causes: ['hardware', 'unknown'], share: 0.4 },
  { id: 'RUL-0388', serviceId: 'facilities', cis: ['turbolift-*', 'blast-door-svc'], causes: ['hardware', 'unknown', 'config'], share: 0.6 },
  { id: 'RUL-0430', serviceId: 'facilities', cis: ['blast-door-svc'], causes: ['hardware'], share: 0.5 },
  {
    id: 'RUL-0401',
    serviceId: 'hyperdrive',
    cis: ['motivator-*', 'hd-coolant'],
    causes: ['hardware'],
    share: 0.7,
    needs: { field: 'metric.calibration_drift_pct', since: TODAY - 19 * WEEK + 3 * DAY },
  },
  { id: 'RUL-0433', serviceId: 'hyperdrive', cis: ['hd-nav-comp'], causes: ['config', 'unknown', 'hardware'], share: 0.5 },
  { id: 'RUL-0376', serviceId: 'hangar', cis: ['tie-launch-ctl', 'flight-roster'], causes: ['config', 'unknown', 'dependency'], share: 0.6 },
  { id: 'RUL-0395', serviceId: 'hangar', cis: ['hangar-api'], causes: ['deploy'], share: 0.3 },
  { id: 'RUL-0421', serviceId: 'detention', cis: ['cell-lock-*'], causes: ['hardware', 'unknown'], share: 0.55 },
  { id: 'RUL-0360', serviceId: 'detention', cis: ['det-*'], causes: ['capacity', 'unknown', 'config'], share: 0.6 },
  {
    id: 'RUL-0409',
    serviceId: 'holonet',
    cis: ['comlink-relay-*', 'holonet-gw'],
    causes: ['network', 'dependency'],
    share: 0.65,
    needs: { field: 'metric.packet_loss_pct', since: TODAY - 9 * WEEK + 2 * DAY },
  },
  { id: 'RUL-0426', serviceId: 'holonet', cis: ['comlink-*'], causes: ['certificate', 'network'], share: 0.7 },
  { id: 'RUL-0380', serviceId: 'holonet', cis: ['holonet-gw'], causes: ['dependency'], share: 0.3 },
  { id: 'RUL-0415', serviceId: 'armory', cis: ['inventory-db', 'requisition-q'], causes: ['config', 'unknown', 'capacity'], share: 0.65 },
  { id: 'RUL-0428', serviceId: 'armory', cis: ['armory-portal'], causes: ['config', 'deploy'], share: 0.4 },
  { id: 'RUL-0366', serviceId: 'reactor', cis: ['plasma-loop-*', 'grid-feed-*', 'core-cell-*'], causes: ['capacity', 'unknown'], share: 0.55 },
  { id: 'RUL-0435', serviceId: 'reactor', cis: ['reactor-mgr'], causes: ['deploy', 'config'], share: 0.35 },
  { id: 'RUL-0371', serviceId: 'lifesupport', cis: ['o2-sensor-grid'], causes: ['hardware'], share: 0.4 },
  { id: 'RUL-0424', serviceId: 'lifesupport', cis: ['scrubber-*'], causes: ['capacity', 'unknown'], share: 0.5 },
  { id: 'RUL-0392', serviceId: 'facilities', cis: ['hvac-*'], causes: ['unknown'], share: 0.4 },
];

/** The replay's rules, named and statused from the Rules page's store. A rule the store no
 *  longer has isn't replayed. */
export function rulesFrom(store: Pick<Rule, 'id' | 'name' | 'status'>[], statusOverride?: Record<string, Rule['status']>): ReplayRule[] {
  const byId = new Map(store.map((r) => [r.id, r]));
  return MATCHERS.flatMap((m) => {
    const rule = byId.get(m.id);
    return rule ? [{ ...m, name: rule.name, status: statusOverride?.[m.id] ?? rule.status }] : [];
  });
}

/* ---------- approved change windows, run back through the history ---------- */

/** Every [start, end) from `from` to TODAY at the given hours on matching days. */
function runs(test: (day: Date, index: number) => boolean, startHour: number, hours: number, from = HISTORY_START): [number, number][] {
  const out: [number, number][] = [];
  for (let t = from, i = 0; t < TODAY; t += DAY, i++) {
    if (!test(new Date(t), i)) continue;
    const start = t + startHour * HOUR;
    out.push([start, start + hours * HOUR]);
  }
  return out;
}

const weekday = (d: Date) => (d.getUTCDay() + 6) % 7; // 0 = Monday
const FILTER_ANCHOR = Date.parse('2025-10-05');

export const WINDOWS: ReplayWindow[] = [
  {
    id: 'CHG-2304',
    name: 'Motivator recalibration',
    serviceId: 'hyperdrive',
    cis: ['motivator-*'],
    schedule: 'Tuesdays, 01:00 to 07:00',
    runs: runs((d) => weekday(d) === 1, 1, 6),
  },
  {
    id: 'CHG-2356',
    name: 'Atmosphere recycler filter swap',
    serviceId: 'lifesupport',
    cis: ['atmo-recycler-*', 'scrubber-*', 'o2-sensor-grid'],
    schedule: 'Every fourth Sunday, 00:00 to 06:00',
    runs: runs((d) => Math.round((d.getTime() - FILTER_ANCHOR) / DAY) % 28 === 0, 0, 6),
  },
  {
    id: 'CHG-2317',
    name: 'Squadron cold-start drills',
    serviceId: 'hangar',
    cis: ['tie-launch-ctl'],
    schedule: 'Mondays and Thursdays, 05:00 to 07:00',
    runs: runs((d) => weekday(d) === 0 || weekday(d) === 3, 5, 2),
  },
  {
    id: 'CHG-2362',
    name: 'Hangar release train',
    serviceId: 'hangar',
    cis: ['hangar-api', 'flight-roster', 'tie-launch-ctl'],
    schedule: 'Tuesday to Thursday, 13:00 to 18:00',
    runs: runs((d) => weekday(d) >= 1 && weekday(d) <= 3, 13, 5),
  },
  {
    id: 'CHG-2280',
    name: 'Comlink key rotation',
    serviceId: 'holonet',
    cis: ['comlink-*'],
    schedule: 'Daily, 00:00 to 00:20',
    // The window is twenty minutes; alarms from it run on for about an hour after.
    runs: runs(() => true, 0, 1.2),
  },
  {
    id: 'CHG-2291',
    name: 'Reactor load rebalance',
    serviceId: 'reactor',
    cis: ['grid-feed-*', 'plasma-loop-*'],
    schedule: 'Every shift change, 30 min',
    runs: [6, 14, 22].flatMap((h) => runs(() => true, h, 0.5)).sort((a, b) => a[0] - b[0]),
  },
  {
    id: 'CHG-2373',
    name: 'Evening load shed, reactor grid',
    serviceId: 'reactor',
    cis: ['grid-feed-*', 'core-cell-*'],
    schedule: 'Daily, 18:00 to 21:00',
    runs: runs(() => true, 18, 3),
  },
  {
    id: 'CHG-2190',
    name: 'Spring platform migration, HoloNet',
    serviceId: 'holonet',
    cis: ['holonet-gw', 'isb-mail'],
    schedule: 'One-off, nightly for five weeks',
    runs: runs((d) => d.getTime() >= HISTORY_START + 80 * WEEK && d.getTime() < HISTORY_START + 85 * WEEK, 20, 8),
  },
  {
    id: 'CHG-2345',
    name: 'Armory portal release',
    serviceId: 'armory',
    cis: ['armory-portal', 'requisition-q'],
    schedule: 'Every other Wednesday, 18:00 to 20:00',
    runs: runs((d, i) => weekday(d) === 2 && Math.floor(i / 7) % 2 === 0, 18, 2),
  },
];

/* ---------- when the change calendar wasn't there ---------- */

export const GAPS: Gap[] = [
  {
    serviceId: 'all',
    from: TODAY - 11 * WEEK + DAY,
    to: TODAY - 11 * WEEK + 6 * DAY,
    what: 'change calendar',
    why: 'The calendar export failed and was never backfilled.',
  },
  {
    serviceId: 'hangar',
    from: TODAY - 31 * WEEK,
    to: TODAY - 29 * WEEK - 3 * DAY,
    what: 'change calendar',
    why: 'Hangar Ops kept its windows in a spreadsheet then.',
  },
];

/* ---------- what happened to each ticket ---------- */

function stable(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

const lives = new Map<string, TicketLife>();

/** A ticket's lifecycle. It never changes the ticket itself, so the forecast reads the same history. */
export function lifeOf(t: Ticket): TicketLife {
  const known = lives.get(t.id);
  if (known) return known;
  const u = stable(t.id);
  const v = stable(`${t.id}:closed`);
  const age = TODAY - t.at;
  const stillOpen = age < 5 * DAY ? 0.45 : age < 21 * DAY ? 0.08 : 0.006;
  const life: TicketLife =
    u < stillOpen
      ? { lifecycle: 'open' }
      : t.outcome === 'cancelled'
        ? { lifecycle: 'cancelled' }
        : u > 0.935
          ? { lifecycle: 'other' }
          : { lifecycle: 'closed', closedBy: t.outcome === 'incident' || v > (t.cause === 'unknown' ? 0.45 : 0.2) ? 'hand' : 'auto' };
  lives.set(t.id, life);
  return life;
}

export const source = (rules: ReplayRule[], windows = WINDOWS, gaps = GAPS): ReplaySource => ({ tickets: TICKETS, life: lifeOf, rules, windows, gaps });

/* ---------- historical extracts: past runs, frozen ---------- */

export interface Extract {
  id: string;
  /** What it was for, in a few words. */
  title: string;
  ranAt: number;
  by: string;
  serviceId: string;
  from: number;
  to: number;
  /** Rule statuses on the day it ran, where they differ from today's. */
  statusThen: Record<string, Rule['status']>;
  /** Windows approved on the day it ran. */
  windowIds: string[];
  gaps: Gap[];
  /** Rows the ticket store gave it before it dropped any. */
  dropped: { duplicates: number; noCi: number };
}

const ALL_WINDOWS = WINDOWS.map((w) => w.id);
const at = (date: string) => Date.parse(`${date}T00:00:00Z`);

export const EXTRACTS: Extract[] = [
  {
    id: 'EXT-0031',
    title: 'Summer quarter, every service',
    ranAt: at('2026-09-01') + 7 * HOUR,
    by: 'Lieutenant Tanbris',
    serviceId: 'all',
    from: at('2026-06-01'),
    to: at('2026-08-31'),
    statusThen: { 'RUL-0401': 'proposed', 'RUL-0409': 'inactive' },
    windowIds: ALL_WINDOWS.filter((id) => id !== 'CHG-2345'),
    gaps: GAPS,
    dropped: { duplicates: 31, noCi: 12 },
  },
  {
    id: 'EXT-0027',
    title: 'Spring quarter, every service',
    ranAt: at('2026-06-02') + 9 * HOUR,
    by: 'Commander Praji',
    serviceId: 'all',
    from: at('2026-03-02'),
    to: at('2026-06-01'),
    statusThen: { 'RUL-0401': 'proposed', 'RUL-0409': 'inactive', 'RUL-0376': 'proposed' },
    windowIds: ALL_WINDOWS.filter((id) => id !== 'CHG-2345'),
    gaps: GAPS,
    dropped: { duplicates: 44, noCi: 19 },
  },
  {
    id: 'EXT-0024',
    title: 'HoloNet, first quarter',
    ranAt: at('2026-04-01') + 14 * HOUR,
    by: 'Admiral Piett',
    serviceId: 'holonet',
    from: at('2026-01-05'),
    to: at('2026-03-30'),
    statusThen: { 'RUL-0409': 'inactive', 'RUL-0426': 'proposed' },
    windowIds: ['CHG-2280', 'CHG-2190'],
    gaps: [
      {
        serviceId: 'holonet',
        from: at('2026-01-05'),
        to: at('2026-01-19'),
        what: 'change calendar',
        why: 'The calendar moved systems; its first fortnight of the year never came across.',
      },
    ],
    dropped: { duplicates: 9, noCi: 27 },
  },
];

export const extractById = (id?: string) => EXTRACTS.find((e) => e.id === id);
