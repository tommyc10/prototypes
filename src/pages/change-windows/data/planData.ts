/* Mock data: the maintenance plans in place when the page opens, and the tickets filed
 * against what the windows cover. This is the file the real backend replaces (the plans,
 * and the tickets from the ticketing system). Nothing else knows the data is fake.
 *
 * The tidy estate has a few hand-written stories:
 *   CHG-2398 Superlaser test firing   held, half of it cleared on its own, one P1 paged anyway
 *   CHG-2342 Turbolift 3 actuator     running late: its plan ended, so new tickets page again
 *   CHG-2405 Hangar bay 327 seal      ended: what it held either cleared or went to the queue
 * The busy estate has tickets but no plans, so every window there starts from nothing. */

import { NOW } from '../../../lib/clock';
import { HOUR } from '../model/windows';
import { MINUTE, stretchesOf } from '../model/plans';
import type { ChangeWindow, MaintenancePlan, PlanTicket, Sample } from '../model/types';
import { SAMPLES } from './mockData';

const now = NOW.getTime();

/** The same numbers for the same seed, every time. */
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

/** What gets filed against each tidy window's CIs while the work runs: [ci, title]. */
const FILED: Record<string, [string, string][]> = {
  'CHG-2398': [
    ['superlaser-cap-04', 'Capacitor bank 4 charge variance'],
    ['superlaser-trib-02', 'Tributary beam 2 alignment drift'],
    ['superlaser-cap-07', 'Capacitor bank 7 over temperature'],
    ['superlaser-focus', 'Focusing lens coolant flow low'],
    ['superlaser-trib-05', 'Tributary beam 5 output below threshold'],
    ['superlaser-cap-01', 'Capacitor bank 1 slow to charge'],
    ['superlaser-trib-08', 'Tributary beam 8 phase mismatch'],
  ],
  'CHG-2342': [
    ['turbolift-03-door', 'Car 3 door open too long'],
    ['turbolift-03-pos', 'Car 3 position sensor lost'],
    ['turbolift-03-drive', 'Car 3 stalled between decks'],
    ['turbolift-03-door', 'Deck 12 door actuator fault'],
  ],
  'CHG-2291': [
    ['reactor-bus-b', 'Bus B output dip'],
    ['reactor-bus-a', 'Bus A load imbalance'],
    ['reactor-bus-c', 'Distribution switch flapping'],
  ],
  'CHG-2410': [
    ['holonet-relay-ord-mantell', 'Relay unreachable'],
    ['holonet-relay-ord-mantell', 'Packet loss over 40%'],
    ['holonet-relay-ord-mantell', 'Relay restarted unexpectedly'],
    ['holonet-relay-ord-mantell', 'Upstream link down'],
  ],
  'CHG-2371': [
    ['armory-vault-09', 'Vault 9 door held open'],
    ['armory-rack-14', 'Inventory count mismatch, rack 14'],
    ['armory-rack-03', 'Blaster rack 3 unlocked'],
    ['armory-vault-02', 'Vault 2 seal sensor offline'],
  ],
  'CHG-2405': [
    ['hangar-327-seal', 'Magnetic seal field down'],
    ['hangar-327-env', 'Bay 327 pressure differential'],
    ['hangar-327-seal', 'Seal emitter fault'],
    ['hangar-327-door', 'Bay door interlock open'],
  ],
  'CHG-2280': [
    ['comlink-kms-01', 'Handshake failures above threshold'],
    ['comlink-kms-02', 'Channel reset storm'],
  ],
  'CHG-2389': [
    ['coolant-pump-bank-a', 'Pump 3 flow variance'],
    ['coolant-pump-bank-a', 'Pump 1 stopped'],
    ['coolant-pump-bank-a', 'Bank A pressure low'],
  ],
};

/** For the busy estate, where nobody wrote anything specific. */
const GENERIC = ['Unreachable', 'Health check failing', 'Threshold breached', 'Restarted unexpectedly', 'Response time degraded'];

function ticketsFor(w: ChangeWindow, busy: boolean): Omit<PlanTicket, 'id'>[] {
  const r = rng(w.key);
  const pool: [string, string][] =
    FILED[w.id] ?? (busy ? GENERIC.map((title, i) => [w.cis.replace('*', String(i + 1).padStart(2, '0')), title]) : []);
  // Only what has been filed so far, and only in the last ten hours, so the near past is busy.
  const from = Math.max(w.start, now - 10 * HOUR);
  const last = Math.min(now, w.closedAt ?? now);
  if (!pool.length || last <= from) return [];
  const count = busy ? Math.floor(r() * 4) : Math.max(2, Math.min(9, Math.round(((last - from) / HOUR) * 2.2)));
  const out: Omit<PlanTicket, 'id'>[] = [];
  for (let i = 0; i < count; i++) {
    const [ci, title] = pool[Math.floor(r() * pool.length)];
    const filedAt = from + ((i + 0.2 + r() * 0.6) / count) * (last - from);
    const roll = r();
    const clearedAt = r() < 0.64 ? filedAt + (4 + r() * 38) * MINUTE : undefined;
    out.push({ windowKey: w.key, ci, title, filedAt, priority: roll < 0.18 ? 2 : roll < 0.6 ? 3 : 4, clearedAt: clearedAt && clearedAt <= now ? clearedAt : undefined });
  }
  // The superlaser test sets off one real fault partway through.
  if (w.id === 'CHG-2398') out.push({ windowKey: w.key, ci: 'superlaser-cap-02', title: 'Capacitor bank 2 containment fault', filedAt: now - 64 * MINUTE, priority: 1 });
  return out;
}

function ticketsOf(sample: Sample, first: number): PlanTicket[] {
  return SAMPLES[sample]
    .flatMap((w) => ticketsFor(w, sample === 'busy'))
    .sort((a, b) => a.filedAt - b.filedAt)
    .map((t, i) => ({ ...t, id: `INC-${first + i * 3}` }));
}

export const TICKETS: Record<Sample, PlanTicket[]> = { tidy: ticketsOf('tidy', 41180), busy: ticketsOf('busy', 52010) };

/* ---------- the plans in place when the page opens ---------- */

const run = (id: string, ended = false) => SAMPLES.tidy.find((w) => w.id === id && !!w.closedAt === ended)!;

function seed(id: string, w: ChangeWindow, by: string, reason: string, ending: 'fade' | 'off'): MaintenancePlan {
  return { id, windowKey: w.key, cis: [w.cis], stretches: stretchesOf({ from: w.start, until: w.plannedEnd, soft: 'hold', ending }), settle: 30 * MINUTE, by, reason, sent: {} };
}

export const PLANS: MaintenancePlan[] = [
  seed('MNT-0412', run('CHG-2398'), 'Commander Praji', 'Pre-charge and a low-power firing. Capacitor and beam alarms are expected the whole way through.', 'fade'),
  seed('MNT-0409', run('CHG-2342'), 'Chief Bast', 'The car is locked out for the actuator swap, so its door and position sensors will alarm.', 'off'),
  seed('MNT-0401', run('CHG-2405', true), 'TIE Hangar Ops', 'The seal is powered down for inspection. Field and pressure alarms are expected.', 'off'),
];
