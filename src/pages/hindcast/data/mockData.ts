/* Mock data: 26 weeks of hand-cancelled tickets across the nine services, generated the
 * same way every time, and the replay that turns them into a HindcastReport.
 *
 * This is the file the real backend replaces, with one endpoint that takes a scope and
 * returns a HindcastReport. Nothing else on the page knows the data is fake.
 *
 * It works the way the real replay does: every ticket remembers which rule's conditions it
 * matches and which change window it was raised inside, and `buildReport` decides what
 * would have caught it from the rules that are active *now*. Approve a proposed rule on the
 * Rules page and this page's numbers move.
 *
 * The services are the Rules page's assignment groups, and the rules are its rules: the
 * two pages describe the same Empire. */

import { NOW } from '../../../lib/clock';
import { GROUPS, RULES, groupById } from '../../rule-management/data/mockData';
import { LOW_CONFIDENCE, wasRejected } from '../../rule-management/model/policy';
import type { Rule } from '../../rule-management/model/types';
import { CATEGORY_LABEL, REASON_LABEL, caught, share } from '../model/labels';
import { findings, headline, leadClaim } from '../model/narrative';
import type {
  BreakdownRow,
  CancelledTicket,
  CategoryKey,
  HindcastReport,
  Outcome,
  ProposalVerdict,
  ProposedValidation,
  ReasonKey,
  RuleContribution,
  Scope,
  ServiceRow,
  Split,
  TuningAction,
  WindowContribution,
} from '../model/types';

/* ---------- time: completed weeks only ---------- */

const DAY = 86_400_000;
const WEEK = 7 * DAY;

/** How much history there is to replay. The longest lookback uses all of it. */
const HISTORY_WEEKS = 26;

/** 00:00 on the Monday of the week NOW falls in: the first moment that isn't a completed week. */
const THIS_MONDAY = (() => {
  const d = new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth(), NOW.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.getTime();
})();

/** Week 0 is the oldest; week 25 is the last completed one. */
const weekStart = (week: number) => THIS_MONDAY - (HISTORY_WEEKS - week) * WEEK;
const weekOf = (iso: string) => Math.floor((new Date(iso).getTime() - weekStart(0)) / WEEK);
const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** The ISO week number of a date, for the report's id (HC-2026-W39). */
function isoWeek(ms: number) {
  const d = new Date(ms);
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7)); // that week's Thursday
  const jan4 = Date.UTC(d.getUTCFullYear(), 0, 4);
  return { year: d.getUTCFullYear(), week: 1 + Math.round((d.getTime() - jan4) / WEEK) };
}

/* ---------- deterministic generation helpers ---------- */

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

/** Pick a key by weight: { cleared: 7, known: 3 } returns 'cleared' seven times in ten. */
function weighted<K extends string>(r: () => number, weights: Partial<Record<K, number>>): K {
  const entries = Object.entries(weights) as [K, number][];
  let at = r() * entries.reduce((n, [, w]) => n + w, 0);
  for (const [key, w] of entries) if ((at -= w) < 0) return key;
  return entries[entries.length - 1][0];
}

/* ---------- change windows ---------- */

interface ChangeWindow {
  id: string;
  name: string;
  serviceId: string;
  schedule: string;
  /** Times it runs in a week it runs at all. */
  perWeek: number;
  /** Runs every Nth week (1 = weekly). Left out for a one-off. */
  every?: number;
  /** A one-off: the single week it ran in. */
  week?: number;
}

const WINDOWS: ChangeWindow[] = [
  { id: 'CHG-2291', name: 'Reactor load rebalance', serviceId: 'reactor', schedule: 'Every shift change', perWeek: 21, every: 1 },
  { id: 'CHG-2317', name: 'Squadron cold-start drills', serviceId: 'hangar', schedule: 'Mondays and Thursdays, 05:00', perWeek: 2, every: 1 },
  { id: 'CHG-2304', name: 'Motivator recalibration', serviceId: 'hyperdrive', schedule: 'Tuesdays, 02:00 to 04:00', perWeek: 1, every: 1 },
  { id: 'CHG-2280', name: 'Comlink key rotation', serviceId: 'holonet', schedule: 'Daily, 00:00 to 00:20', perWeek: 7, every: 1 },
  { id: 'CHG-2342', name: 'Turbolift maintenance', serviceId: 'facilities', schedule: 'Sundays, 02:00 to 05:00', perWeek: 1, every: 1 },
  { id: 'CHG-2356', name: 'Atmosphere recycler filter swap', serviceId: 'lifesupport', schedule: 'Every fourth week', perWeek: 1, every: 4 },
  { id: 'CHG-2398', name: 'Superlaser test firing', serviceId: 'reactor', schedule: 'One-off', perWeek: 1, week: 23 },
  { id: 'CHG-2371', name: 'Inspection for the Emperor’s arrival', serviceId: 'armory', schedule: 'One-off', perWeek: 1, week: 15 },
];

const windowById = (id: string) => WINDOWS.find((w) => w.id === id)!;

/** How many times a window ran in a given week. */
function runs(w: ChangeWindow, week: number) {
  if (w.every) return week % w.every === 1 % w.every ? w.perWeek : 0;
  return week === w.week ? w.perWeek : 0;
}

/* ---------- patterns with a known fix, but no rule yet ---------- */

const FIXES: Record<string, Pick<TuningAction, 'kind' | 'title' | 'detail' | 'ruleId'>> = {
  'widen-0412': {
    kind: 'widen',
    title: 'Widen RUL-0412 to cover flaps of up to 120 s',
    detail: 'Coupling alerts that take 90 to 120 s to clear fall just outside the rule’s 90 s limit.',
    ruleId: 'RUL-0412',
  },
  'dedupe-0388': {
    kind: 'widen',
    title: 'Widen RUL-0388’s dedupe window from 5 to 10 minutes',
    detail: 'Late copies of a turbolift obstruction arrive 5 to 9 minutes after the first, and are raised as new.',
    ruleId: 'RUL-0388',
  },
  'extend-2304': {
    kind: 'extend',
    title: 'Extend CHG-2304 by 40 minutes',
    detail: 'The motivator is still settling when the recalibration window closes at 04:00.',
  },
};

/* ---------- where the noise comes from ---------- */

/** One recurring pattern of noise: who raises it, how often, and what (if anything) matches it. */
interface Source {
  service: string;
  /** Hand-cancelled tickets a week (a week the window runs in, if it has one). */
  perWeek: number;
  category: CategoryKey;
  reasons: Partial<Record<ReasonKey, number>>;
  items: [title: string, ci: string][];
  /** The rule whose conditions these tickets match, whatever its status. */
  rule?: string;
  /** The share of the pattern the rule matches. The rest slips past it. */
  hit?: number;
  /** The change window these tickets are raised inside. */
  window?: string;
  /** A key into FIXES. */
  fix?: string;
  rising?: boolean;
  /** First and last week the pattern shows up in. */
  since?: number;
  until?: number;
}

const SOURCES: Source[] = [
  // Reactor Core
  { service: 'reactor', rule: 'RUL-0366', hit: 0.94, perWeek: 15, category: 'thermal', reasons: { cleared: 7, known: 2, nofault: 1 }, items: [['Reactor coolant flow jitter, loop 2', 'reactor-coolant-loop-2'], ['Coolant flow variance at 52% output', 'reactor-coolant-loop-1'], ['Primary coolant pump flow oscillation', 'reactor-coolant-pump-a']] },
  { service: 'reactor', window: 'CHG-2291', perWeek: 9, category: 'power', reasons: { planned: 8, cleared: 2 }, items: [['Main bus load imbalance during rebalance', 'reactor-bus-main'], ['Reactor output step alarm at shift change', 'reactor-output-ctl'], ['Power distribution variance, sector feeds', 'reactor-bus-main']] },
  { service: 'reactor', rule: 'RUL-0419', perWeek: 4.5, rising: true, category: 'sensors', reasons: { nofault: 6, cleared: 3, known: 1 }, items: [['Exhaust port proximity trip, droid sweep', 'exhaust-port-7g-prox'], ['Small object detected near thermal exhaust shaft', 'exhaust-port-7g-prox'], ['Proximity sensor 7G intermittent', 'exhaust-port-7g-prox']] },
  { service: 'reactor', rule: 'RUL-0435', perWeek: 1.4, category: 'power', reasons: { duplicate: 5, known: 3, cleared: 2 }, items: [['Tributary beam 4 pre-charge warning', 'superlaser-tributary-4'], ['Superlaser focus lens pre-charge variance', 'superlaser-tributary-2'], ['Pre-charge sequence alert, primary', 'superlaser-tributary-1']] },
  { service: 'reactor', window: 'CHG-2398', perWeek: 17, category: 'power', reasons: { planned: 9, drill: 1 }, items: [['Superlaser capacitor charge alarm, test firing', 'superlaser-primary'], ['Tributary beam alignment warning, test firing', 'superlaser-tributary-6']] },
  { service: 'reactor', perWeek: 3, category: 'sensors', reasons: { nofault: 4, cleared: 3, duplicate: 1, known: 2 }, items: [['Radiation monitor self-test fault', 'reactor-radmon-11'], ['Reactor deck door seal warning', 'reactor-deck-door-4'], ['Coolant sample probe offline', 'reactor-probe-3']] },

  // Tractor Beam Ops
  { service: 'tractor', rule: 'RUL-0412', hit: 0.97, perWeek: 17, category: 'thermal', reasons: { cleared: 9, known: 1 }, items: [['Tractor beam coupling 7 temperature warning', 'tb-coupling-07'], ['Coupling terminal heat above 70°C, generator 3', 'tb-coupling-03'], ['Tractor beam power coupling thermal flap', 'tb-coupling-05']] },
  { service: 'tractor', fix: 'widen-0412', perWeek: 3, category: 'thermal', reasons: { cleared: 8, nofault: 2 }, items: [['Coupling 7 temperature warning, slow to clear', 'tb-coupling-07'], ['Coupling heat held above 70°C for 100 s', 'tb-coupling-03']] },
  { service: 'tractor', perWeek: 1.5, category: 'power', reasons: { nofault: 5, duplicate: 3, cleared: 2 }, items: [['Beam generator alignment drift', 'tb-generator-2'], ['Tractor beam targeting self-test failed', 'tb-targeting-1']] },

  // Facilities
  { service: 'facilities', rule: 'RUL-0388', hit: 0.95, perWeek: 13, category: 'access', reasons: { duplicate: 9, cleared: 1 }, items: [['Turbolift 3 door obstruction, deck 12', 'turbolift-03-deck-12'], ['Turbolift 3 door sensor blocked', 'turbolift-03-deck-09'], ['Turbolift 3 door obstruction, deck 14', 'turbolift-03-deck-14']] },
  { service: 'facilities', fix: 'dedupe-0388', perWeek: 2.5, category: 'access', reasons: { duplicate: 10 }, items: [['Turbolift 3 door obstruction, late repeat', 'turbolift-03-deck-12'], ['Turbolift 3 door sensor blocked, late repeat', 'turbolift-03-deck-14']] },
  { service: 'facilities', rule: 'RUL-0430', perWeek: 4.5, category: 'mechanical', reasons: { cleared: 6, known: 3, nofault: 1 }, items: [['Trash compactor 3263827 hydraulic pressure warning', 'compactor-3263827'], ['Compactor wall actuator pressure dip', 'compactor-3263827'], ['Hydraulic pressure below nominal, detention level', 'compactor-3263827']] },
  { service: 'facilities', rule: 'RUL-0392', perWeek: 4.5, until: 20, category: 'mechanical', reasons: { known: 6, cleared: 4 }, items: [['MSE-6 collision alert, corridor 9', 'mse-6-corridor'], ['Mouse droid bumped, level 5', 'mse-6-corridor'], ['Droid collision report', 'mse-6-corridor']] },
  { service: 'facilities', window: 'CHG-2342', perWeek: 5, category: 'access', reasons: { planned: 9, cleared: 1 }, items: [['Turbolift 1 out of service alarm', 'turbolift-01'], ['Turbolift shaft door interlock open', 'turbolift-02'], ['Turbolift 4 positioning fault during maintenance', 'turbolift-04']] },
  { service: 'facilities', perWeek: 2.5, category: 'mechanical', reasons: { nofault: 4, cleared: 3, duplicate: 2, known: 1 }, items: [['Waste chute blockage sensor', 'waste-chute-7'], ['Corridor lighting panel fault', 'lighting-c-12'], ['Blast door 3 cycle timeout', 'blast-door-03']] },

  // Detention Block AA-23
  { service: 'detention', rule: 'RUL-0360', hit: 0.99, perWeek: 31, category: 'environment', reasons: { cleared: 8, known: 2 }, items: [['CO2 scrubber cycling, detention block AA-23', 'det-scrubber-aa23'], ['Scrubber duty cycle alarm, cell bay 2', 'det-scrubber-aa23-b2'], ['Air quality dip during scrubber regeneration', 'det-scrubber-aa23']] },
  { service: 'detention', rule: 'RUL-0421', perWeek: 2.3, category: 'access', reasons: { nofault: 7, cleared: 3 }, items: [['Cell 2187 door sensor false-open', 'cell-2187-door'], ['Cell 2187 door state mismatch', 'cell-2187-door']] },
  { service: 'detention', perWeek: 1.5, category: 'sensors', reasons: { nofault: 5, duplicate: 3, cleared: 2 }, items: [['Holocam feed dropout, cell bay 1', 'det-holocam-b1'], ['Intercom fault, detention control', 'det-intercom-1']] },

  // Life Support
  { service: 'lifesupport', rule: 'RUL-0424', perWeek: 8, category: 'environment', reasons: { cleared: 7, known: 3 }, items: [['Deck 12 CO2 warning at shift change', 'ls-co2-deck-12'], ['CO2 above 900 ppm, deck 12 mess', 'ls-co2-deck-12'], ['Deck 12 air handler load warning', 'ls-ahu-deck-12']] },
  { service: 'lifesupport', rule: 'RUL-0371', perWeek: 5, category: 'environment', reasons: { known: 6, cleared: 4 }, items: [['Bridge viewport condensation alarm', 'exec-bridge-viewport'], ['Viewport heater humidity warning', 'exec-bridge-viewport']] },
  { service: 'lifesupport', window: 'CHG-2356', perWeek: 7, category: 'environment', reasons: { planned: 9, cleared: 1 }, items: [['Recycler pressure drop during filter swap', 'ls-recycler-2'], ['Air recycler offline alarm, planned', 'ls-recycler-2']] },
  { service: 'lifesupport', perWeek: 2, category: 'environment', reasons: { nofault: 5, cleared: 3, duplicate: 2 }, items: [['Humidity sensor drift, officer quarters', 'ls-humidity-oq'], ['Water reclamation level sensor fault', 'ls-water-reclaim-1']] },

  // Hyperdrive Maintenance
  { service: 'hyperdrive', rule: 'RUL-0401', hit: 0.97, perWeek: 10, category: 'mechanical', reasons: { cleared: 6, known: 4 }, items: [['Hyperdrive motivator calibration drift 0.2%', 'hd-motivator-1'], ['Motivator alignment variance within tolerance', 'hd-motivator-2'], ['Calibration drift warning, motivator B', 'hd-motivator-2']] },
  { service: 'hyperdrive', window: 'CHG-2304', perWeek: 6, category: 'mechanical', reasons: { planned: 9, drill: 1 }, items: [['Motivator offline for recalibration', 'hd-motivator-1'], ['Hyperdrive field coil test alarm', 'hd-field-coil-3'], ['Null-field generator reset during recalibration', 'hd-null-field-1']] },
  { service: 'hyperdrive', fix: 'extend-2304', perWeek: 1.8, category: 'mechanical', reasons: { planned: 8, cleared: 2 }, items: [['Motivator still settling after recalibration', 'hd-motivator-1'], ['Field coil alarm after the window closed', 'hd-field-coil-3']] },
  { service: 'hyperdrive', rule: 'RUL-0433', perWeek: 1.2, since: 14, category: 'mechanical', reasons: { known: 6, nofault: 4 }, items: [['Hyperdrive fault code, impounded YT-1300', 'yt-1300-impound'], ['Motivator fault on impounded freighter', 'yt-1300-impound']] },
  { service: 'hyperdrive', perWeek: 1.5, category: 'sensors', reasons: { nofault: 5, duplicate: 3, cleared: 2 }, items: [['Navicomputer sync timeout', 'hd-navicomp-2'], ['Coolant line pressure sensor fault', 'hd-coolant-line-4']] },

  // TIE Hangar Ops
  { service: 'hangar', rule: 'RUL-0376', hit: 0.94, perWeek: 22, category: 'power', reasons: { cleared: 8, nofault: 2 }, items: [['TIE ion engine pre-flight timeout, cold start', 'tie-ln-bay-2'], ['Ion engine ignition check timed out', 'tie-ln-bay-4'], ['Pre-flight sequence timeout, squadron 3', 'tie-ln-bay-3']] },
  { service: 'hangar', window: 'CHG-2317', perWeek: 7, category: 'power', reasons: { drill: 8, planned: 2 }, items: [['Launch rack release alarm during drill', 'hangar-rack-2'], ['Hangar bay magnetic field fluctuation, drill', 'hangar-magfield-1'], ['Scramble klaxon fault, drill', 'hangar-klaxon-1']] },
  { service: 'hangar', rule: 'RUL-0395', perWeek: 3.4, category: 'comms', reasons: { known: 5, nofault: 5 }, items: [['TIE Advanced x1 telemetry gap in hyperspace', 'tie-adv-x1'], ['x1 telemetry link lost, hyperspace transit', 'tie-adv-x1']] },
  { service: 'hangar', perWeek: 3, category: 'mechanical', reasons: { nofault: 4, cleared: 3, duplicate: 3 }, items: [['Solar panel actuator fault', 'tie-ln-bay-1'], ['Refuelling arm position sensor', 'hangar-fuel-arm-3'], ['Hangar blast shield cycle warning', 'hangar-shield-1']] },

  // HoloNet Comms
  { service: 'holonet', rule: 'RUL-0409', hit: 0.96, perWeek: 28, category: 'comms', reasons: { cleared: 9, known: 1 }, items: [['HoloNet relay packet loss, Outer Rim', 'holonet-relay-or-7'], ['Relay link degraded under 2 min, Outer Rim', 'holonet-relay-or-3'], ['Outer Rim relay jitter', 'holonet-relay-or-7']] },
  { service: 'holonet', rule: 'RUL-0426', perWeek: 7, category: 'comms', reasons: { cleared: 6, known: 4 }, items: [['Comlink key rotation retry', 'comlink-kms-1'], ['Encryption key handshake retried', 'comlink-kms-2'], ['Key rotation retry, squad channel', 'comlink-kms-1']] },
  { service: 'holonet', window: 'CHG-2280', perWeek: 5, category: 'comms', reasons: { planned: 8, cleared: 2 }, items: [['Comlink channel reset during key rotation', 'comlink-kms-1'], ['Encryption handshake failed, rotation in progress', 'comlink-kms-2']] },
  { service: 'holonet', rule: 'RUL-0380', perWeek: 1.5, category: 'comms', reasons: { nofault: 6, known: 4 }, items: [['Probe droid heartbeat loss, Hoth system', 'probe-droid-hoth'], ['Probe droid telemetry silent, Hoth system', 'probe-droid-hoth']] },
  { service: 'holonet', perWeek: 4, category: 'comms', reasons: { nofault: 4, duplicate: 3, cleared: 3 }, items: [['Holoprojector calibration fault, conference room', 'holo-proj-cr1'], ['Subspace transceiver self-test warning', 'subspace-trx-4'], ['Comm tower antenna alignment', 'comm-tower-2']] },

  // Armory & Logistics
  { service: 'armory', rule: 'RUL-0415', hit: 0.92, perWeek: 6, category: 'inventory', reasons: { known: 6, nofault: 4 }, items: [['E-11 blaster count mismatch after drill', 'armory-rack-e11'], ['Inventory variance, E-11 rack 4', 'armory-rack-e11-4']] },
  { service: 'armory', rule: 'RUL-0428', perWeek: 10, category: 'inventory', reasons: { duplicate: 10 }, items: [['Armour fitting request, duplicate', 'armory-fitting-desk'], ['Stormtrooper armour refit ticket, repeat', 'armory-fitting-desk'], ['Helmet fitting ticket raised twice', 'armory-fitting-desk']] },
  { service: 'armory', window: 'CHG-2371', perWeek: 22, category: 'inventory', reasons: { planned: 7, drill: 3 }, items: [['Inventory lock during inspection', 'armory-vault-1'], ['Parade equipment count variance', 'armory-rack-e11']] },
  { service: 'armory', perWeek: 2, category: 'inventory', reasons: { nofault: 5, duplicate: 3, cleared: 2 }, items: [['Thermal detonator crate seal alert', 'armory-crate-td-9'], ['Power pack charger fault', 'armory-charger-3']] },
];

/** The share of each service's tickets that people cancel by hand. It sets the total ticket count. */
const CANCEL_SHARE: Record<string, number> = {
  reactor: 0.12,
  tractor: 0.16,
  facilities: 0.11,
  detention: 0.22,
  lifesupport: 0.09,
  hyperdrive: 0.13,
  hangar: 0.17,
  holonet: 0.19,
  armory: 0.1,
};

/* ---------- the tickets ---------- */

/** A hand-cancelled ticket, and what it matches. Whether that *catches* it depends on the rules live now. */
interface Ticket {
  id: string;
  week: number;
  openedAt: string;
  serviceId: string;
  title: string;
  ci: string;
  reason: ReasonKey;
  category: CategoryKey;
  ruleId?: string;
  windowId?: string;
  fix?: string;
}

/** A ticket that was real (worked, or escalated) and that a rule or change window also matches. */
interface RealMatch {
  week: number;
  serviceId: string;
  ruleId?: string;
  windowId?: string;
  escalated: boolean;
}

const purityOf = (ruleId: string) => RULES.find((r) => r.id === ruleId)?.purity ?? 1;

function generate() {
  const tickets: Ticket[] = [];
  const real: RealMatch[] = [];

  SOURCES.forEach((src, i) => {
    const r = rng(`cancelled-${i}`);
    const rr = rng(`real-${i}`);
    const win = src.window ? windowById(src.window) : null;
    // Real tickets that look just like the noise: what a rule's purity, or a blanket window, costs.
    const realRate = src.rule
      ? (src.perWeek * (src.hit ?? 1) * (1 - purityOf(src.rule))) / purityOf(src.rule)
      : win
        ? src.perWeek * 0.05
        : 0;

    for (let week = 0; week < HISTORY_WEEKS; week++) {
      if (win && !runs(win, week)) continue;
      if (week < (src.since ?? 0) || week >= (src.until ?? HISTORY_WEEKS)) continue;
      const trend = src.rising ? 0.55 + (week / (HISTORY_WEEKS - 1)) * 0.9 : 1;
      const count = Math.round(src.perWeek * trend * (0.72 + r() * 0.56));
      for (let n = 0; n < count; n++) {
        const [title, ci] = src.items[Math.floor(r() * src.items.length)];
        tickets.push({
          id: '',
          week,
          openedAt: new Date(weekStart(week) + Math.floor(r() * WEEK)).toISOString(),
          serviceId: src.service,
          title,
          ci,
          reason: weighted(r, src.reasons),
          category: src.category,
          ruleId: src.rule && r() < (src.hit ?? 1) ? src.rule : undefined,
          windowId: src.window,
          fix: src.fix,
        });
      }
      const realCount = Math.floor(realRate) + (rr() < realRate % 1 ? 1 : 0);
      for (let n = 0; n < realCount; n++)
        real.push({ week, serviceId: src.service, ruleId: src.rule, windowId: src.window, escalated: false });
    }
  });

  // The escalated incidents on the Rules page are the same ones here.
  RULES.forEach((rule) =>
    rule.related
      .filter((incident) => incident.resolution === 'escalated')
      .forEach((incident) => {
        const week = weekOf(incident.openedAt);
        if (week >= 0 && week < HISTORY_WEEKS)
          real.push({ week, serviceId: rule.groupId, ruleId: rule.id, escalated: true });
      }),
  );

  tickets.sort((a, b) => a.openedAt.localeCompare(b.openedAt));
  tickets.forEach((t, i) => (t.id = `INC-${30000 + i}`));

  // Every ticket each service raised each week: the cancelled ones are a known share of them.
  const volume: Record<string, { tickets: number; escalated: number }[]> = {};
  GROUPS.forEach((g) => {
    const r = rng(`volume-${g.id}`);
    volume[g.id] = Array.from({ length: HISTORY_WEEKS }, (_, week) => {
      const cancelled = tickets.filter((t) => t.serviceId === g.id && t.week === week).length;
      const all = Math.round((cancelled / CANCEL_SHARE[g.id]) * (0.9 + r() * 0.2));
      return { tickets: all, escalated: Math.max(1, Math.round(all * 0.012 * (0.6 + r() * 0.8))) };
    });
  });

  return { tickets, real, volume };
}

const DATA = generate();

/* ---------- the replay ---------- */

const emptySplit = (): Split => ({ rule: 0, window: 0, missed: 0 });

const ASSUMPTIONS = [
  'Rules are replayed as they are now, not as they were when each ticket was raised.',
  'A ticket counts once. If a rule and a change window both match it, the rule takes it.',
  'A ticket cancelled by hand is taken as noise: the operator’s call is the ground truth.',
  'Only completed weeks are replayed. The week in progress is never counted.',
  'This is what would have happened, not what will. A past catch rate is not a forecast.',
];

/** The hindcast for one scope, against the rules as they stand. The real app fetches this. */
export function buildReport(scope: Scope, rules: Rule[]): HindcastReport {
  const first = HISTORY_WEEKS - scope.weeks;
  const all = scope.serviceId === 'all';
  const inScope = (serviceId: string) => all || serviceId === scope.serviceId;
  const ruleById = new Map(rules.map((r) => [r.id, r]));
  const isActive = (id?: string) => !!id && ruleById.get(id)?.status === 'active';

  const outcomeOf = (t: Ticket): Outcome => (isActive(t.ruleId) ? 'rule' : t.windowId ? 'window' : 'missed');
  const splitOf = (tickets: Ticket[]) => {
    const split = emptySplit();
    tickets.forEach((t) => split[outcomeOf(t)]++);
    return split;
  };

  const inWindow = DATA.tickets.filter((t) => t.week >= first);
  const mine = inWindow.filter((t) => inScope(t.serviceId));
  const realMine = DATA.real.filter((m) => m.week >= first && inScope(m.serviceId));
  const volumeOf = (serviceId: string, key: 'tickets' | 'escalated') =>
    DATA.volume[serviceId].slice(first).reduce((n, w) => n + w[key], 0);

  /* --- the services, busiest first (always all of them: the list shows every one) --- */
  const services: ServiceRow[] = GROUPS.map((g) => {
    const theirs = inWindow.filter((t) => t.serviceId === g.id);
    return { id: g.id, name: g.name, unit: g.unit, tickets: volumeOf(g.id, 'tickets'), cancelled: theirs.length, split: splitOf(theirs) };
  }).sort((a, b) => b.cancelled - a.cancelled);

  const scoped = services.filter((s) => inScope(s.id));
  const split = splitOf(mine);
  const tickets = scoped.reduce((n, s) => n + s.tickets, 0);

  /* --- week by week --- */
  const weekly = Array.from({ length: scope.weeks }, (_, i) => {
    const week = first + i;
    return {
      start: isoDate(weekStart(week)),
      tickets: scoped.reduce((n, s) => n + DATA.volume[s.id][week].tickets, 0),
      split: splitOf(mine.filter((t) => t.week === week)),
    };
  });

  /* --- every ticket, classified --- */
  const hidden = (escalated: boolean, by: 'rule' | 'window') =>
    realMine.filter((m) => m.escalated === escalated && (by === 'rule' ? isActive(m.ruleId) : !isActive(m.ruleId) && !!m.windowId)).length;
  const escalatedAll = scoped.reduce((n, s) => n + volumeOf(s.id, 'escalated'), 0);
  const workedAll = tickets - mine.length - escalatedAll;
  const classification = {
    cancelled: { rule: split.rule, window: split.window, passed: split.missed },
    worked: { rule: hidden(false, 'rule'), window: hidden(false, 'window'), passed: 0 },
    escalated: { rule: hidden(true, 'rule'), window: hidden(true, 'window'), passed: 0 },
  };
  classification.worked.passed = workedAll - classification.worked.rule - classification.worked.window;
  classification.escalated.passed = escalatedAll - classification.escalated.rule - classification.escalated.window;

  /* --- breakdowns --- */
  const breakdown = <K extends string>(labels: Record<K, string>, keyOf: (t: Ticket) => K): BreakdownRow[] =>
    (Object.keys(labels) as K[])
      .map((key) => ({ key, label: labels[key], split: splitOf(mine.filter((t) => keyOf(t) === key)) }))
      .filter((row) => row.split.rule + row.split.window + row.split.missed > 0)
      .sort((a, b) => b.split.rule + b.split.window + b.split.missed - (a.split.rule + a.split.window + a.split.missed));
  const reasons = breakdown(REASON_LABEL, (t) => t.reason);
  const categories = breakdown(CATEGORY_LABEL, (t) => t.category);

  /* --- what did the catching --- */
  const matched = (ruleId: string) => mine.filter((t) => t.ruleId === ruleId);
  const realFor = (ruleId: string, escalated: boolean) =>
    realMine.filter((m) => m.ruleId === ruleId && m.escalated === escalated).length;

  const ruleRows: RuleContribution[] = rules
    .filter((r) => r.status === 'active' && inScope(r.groupId))
    .map((r) => ({ ruleId: r.id, name: r.name, serviceId: r.groupId, caught: matched(r.id).length, worked: realFor(r.id, false) }))
    .filter((r) => r.caught > 0)
    .sort((a, b) => b.caught - a.caught);

  const windows: WindowContribution[] = WINDOWS.filter((w) => inScope(w.serviceId))
    .map((w) => {
      const theirs = mine.filter((t) => t.windowId === w.id && outcomeOf(t) === 'window');
      return {
        id: w.id,
        name: w.name,
        serviceId: w.serviceId,
        schedule: w.schedule,
        recurring: !!w.every,
        occurrences: Array.from({ length: scope.weeks }, (_, i) => runs(w, first + i)).reduce((a, b) => a + b, 0),
        caught: theirs.length,
        weekly: Array.from({ length: scope.weeks }, (_, i) => theirs.filter((t) => t.week === first + i).length),
      };
    })
    .filter((w) => w.caught > 0)
    .sort((a, b) => b.caught - a.caught);

  /* --- proposed rules, replayed as if they had been active --- */
  const stillMissed = (ruleId: string) => matched(ruleId).filter((t) => outcomeOf(t) === 'missed').length;
  const proposed: ProposedValidation[] = rules
    .filter((r) => r.status === 'proposed' && inScope(r.groupId))
    .map((r) => {
      const escalated = realFor(r.id, true);
      const verdict: ProposalVerdict = escalated ? 'unsafe' : r.confidence < LOW_CONFIDENCE ? 'review' : 'validated';
      return { ruleId: r.id, name: r.name, serviceId: r.groupId, confidence: r.confidence, wouldCatch: stillMissed(r.id), worked: realFor(r.id, false), escalated, verdict };
    })
    .filter((p) => p.wouldCatch > 0 || p.escalated > 0)
    .sort((a, b) => b.wouldCatch - a.wouldCatch);

  /* --- what to tune next --- */
  const tuning: TuningAction[] = [];
  proposed
    .filter((p) => p.verdict === 'validated')
    .forEach((p) =>
      tuning.push({
        id: `approve-${p.ruleId}`,
        kind: 'approve',
        title: `Approve ${p.ruleId}`,
        detail: `${p.name}. ${Math.round(p.confidence * 100)}% confidence, and no escalated ticket matched.`,
        gain: p.wouldCatch,
        serviceId: p.serviceId,
        ruleId: p.ruleId,
      }),
    );
  // An inactive rule is worth another look only while its pattern is still turning up.
  rules
    .filter((r) => r.status === 'inactive' && inScope(r.groupId))
    .forEach((r) => {
      const gain = stillMissed(r.id);
      const recent = matched(r.id).some((t) => t.week >= HISTORY_WEEKS - 2);
      if (gain && recent)
        tuning.push({
          id: `revisit-${r.id}`,
          kind: 'revisit',
          title: `Revisit ${r.id}`,
          detail: `${r.name}. It was ${wasRejected(r) ? 'rejected' : 'deactivated'}, but its pattern is still being cancelled by hand.`,
          gain,
          serviceId: r.groupId,
          ruleId: r.id,
        });
    });
  Object.entries(FIXES).forEach(([key, fix]) => {
    const theirs = mine.filter((t) => t.fix === key && outcomeOf(t) === 'missed');
    if (theirs.length) tuning.push({ id: key, ...fix, gain: theirs.length, serviceId: theirs[0].serviceId });
  });
  tuning.sort((a, b) => b.gain - a.gain);

  // Headroom: what's caught, what the validated proposals would add, what other tuning could
  // still reach (the suggestions above, and proposals that aren't safe to approve yet), and the rest.
  const fromProposals = proposed.filter((p) => p.verdict === 'validated').reduce((n, p) => n + p.wouldCatch, 0);
  const fromTuning =
    tuning.filter((a) => a.kind !== 'approve').reduce((n, a) => n + a.gain, 0) +
    proposed.filter((p) => p.verdict !== 'validated').reduce((n, p) => n + p.wouldCatch, 0);
  const headroom = {
    caught: caught(split),
    proposed: fromProposals,
    tuning: fromTuning,
    outOfReach: split.missed - fromProposals - fromTuning,
  };

  /* --- the lead: the top noise maker, or this service --- */
  const leadService = all ? services[0] : scoped[0];
  const leadRank = services.indexOf(leadService) + 1;
  const allCancelled = services.reduce((n, s) => n + s.cancelled, 0);
  const toTicket = (t: Ticket): CancelledTicket => {
    const outcome = outcomeOf(t);
    return { id: t.id, title: t.title, ci: t.ci, serviceId: t.serviceId, openedAt: t.openedAt, reason: t.reason, outcome, by: outcome === 'rule' ? t.ruleId : outcome === 'window' ? t.windowId : undefined };
  };
  const lead = {
    service: leadService,
    rank: leadRank,
    claim: leadClaim(
      leadService,
      leadRank,
      allCancelled,
      ruleRows.find((r) => r.serviceId === leadService.id),
      proposed.find((p) => p.serviceId === leadService.id),
    ),
    tickets: inWindow
      .filter((t) => t.serviceId === leadService.id)
      .sort((a, b) => b.openedAt.localeCompare(a.openedAt))
      .map(toTicket),
  };

  const last = isoWeek(weekStart(HISTORY_WEEKS - 1));
  const group = all ? null : groupById(scope.serviceId);
  const title = group ? group.name : 'All services';

  return {
    id: `HC-${last.year}-W${String(last.week).padStart(2, '0')}`,
    scope,
    title,
    subtitle: group ? group.unit : `${services.length} services`,
    from: isoDate(weekStart(first)),
    to: isoDate(THIS_MONDAY - DAY),
    headline: headline(scope, title, tickets, split),
    totals: { tickets, cancelled: mine.length, split },
    services,
    weekly,
    classification,
    lead,
    reasons,
    categories,
    rules: ruleRows,
    windows,
    findings: findings(scope, services, split, ruleRows, proposed, classification),
    headroom,
    tuning,
    proposed,
    provenance: {
      generatedAt: NOW.toISOString(),
      source: 'Imperial service desk, ticket export',
      activeRules: rules.filter((r) => r.status === 'active' && inScope(r.groupId)).length,
      proposedRules: rules.filter((r) => r.status === 'proposed' && inScope(r.groupId)).length,
      changeWindows: WINDOWS.filter((w) => inScope(w.serviceId) && Array.from({ length: scope.weeks }, (_, i) => runs(w, first + i)).some(Boolean)).length,
      assumptions: ASSUMPTIONS,
    },
  };
}

/** Whether an id in the address is a real service. */
export const isService = (id: string | undefined) => !!id && GROUPS.some((g) => g.id === id);

/** A share, for sorting and labels elsewhere. */
export const catchRate = (s: ServiceRow) => share(caught(s.split), s.cancelled);
