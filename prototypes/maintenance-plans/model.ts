/* Throwaway: what a maintenance plan is, the tickets filed against each change window, and
 * what a plan made of each one. Every variant runs on this; only the way it's drawn differs.
 *
 * A plan sits on a change window. While it's in place, tickets filed against what it covers
 * are softened, never hidden. Every ticket is still filed and can still be found. How soft
 * is the plan's choice, and it can change as the work goes on:
 *
 *   mark    into the queue at its own priority, marked as expected. Nobody is paged.
 *   lower   into the queue one priority lower, marked. Nobody is paged.
 *   hold    kept beside the plan while the work runs. Nobody is paged. When the hold ends,
 *           each held ticket gets a little longer (the settle time) to clear on its own;
 *           whatever is still open then goes to the queue.
 *
 * Whatever the plan says, a P1 pages as usual. */

import { NOW } from '../../src/lib/clock';
import { SAMPLES } from '../../src/pages/change-windows/data/mockData';
import type { ChangeWindow } from '../../src/pages/change-windows/model/types';
import { HOUR, sortWindows } from '../../src/pages/change-windows/model/windows';

export const MINUTE = 60_000;
export { HOUR };

/* ---------- the plan ---------- */

export type Soft = 'mark' | 'lower' | 'hold';

/** Quietest last. */
export const SOFTS: Soft[] = ['mark', 'lower', 'hold'];

export const SOFT: Record<Soft, { label: string; done: string; doing: string; says: string; verb: string }> = {
  mark: {
    label: 'Mark',
    done: 'Marked',
    doing: 'Marking',
    verb: 'marked as expected',
    says: 'Each ticket goes to the queue at its own priority, marked as expected. Nobody is paged.',
  },
  lower: {
    label: 'Lower',
    done: 'Lowered',
    doing: 'Lowering',
    verb: 'lowered a priority',
    says: 'Each ticket goes to the queue one priority lower, marked as expected. Nobody is paged.',
  },
  hold: {
    label: 'Hold',
    done: 'Held',
    doing: 'Holding',
    verb: 'held beside the plan',
    says: 'Each ticket is kept beside the plan while the work runs. Nobody is paged. Anything still open when it ends goes to the queue.',
  },
};

/** One stretch of the plan, at one level. */
export interface Stretch {
  from: number;
  to: number;
  soft: Soft;
}

export interface Plan {
  id: string;
  windowKey: string;
  /** What it covers, written the way a window's CIs are: `superlaser-*`. */
  cis: string[];
  /** In order and touching. One for most plans; several when it quietens by steps. */
  stretches: Stretch[];
  /** How long a held ticket gets, once its hold ends, to clear on its own. */
  settle: number;
  by: string;
  reason: string;
  /** Tickets someone sent to the queue early, and when. */
  sent: Record<string, number>;
}

export const planStart = (p: Plan) => p.stretches[0].from;
export const planEnd = (p: Plan) => p.stretches[p.stretches.length - 1].to;

export const stretchAt = (p: Plan, t: number) => p.stretches.find((s) => t >= s.from && t < s.to);

/** Where the run of hold that `t` falls in ends. */
export function holdEnds(p: Plan, t: number) {
  let i = p.stretches.findIndex((s) => t >= s.from && t < s.to);
  while (p.stretches[i + 1]?.soft === 'hold' && p.stretches[i].soft === 'hold' && p.stretches[i + 1].from <= p.stretches[i].to) i++;
  return p.stretches[i].to;
}

const glob = (pattern: string) => new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);

export const covers = (p: Plan, ci: string) => p.cis.some((pattern) => glob(pattern).test(ci));

/** The plan's level at a moment, or null when it isn't softening anything then. */
export const levelAt = (p: Plan | undefined, t: number): Soft | null => (p ? (stretchAt(p, t)?.soft ?? null) : null);

/** A plan is in place from its start to its end, and still has held tickets settling for a while after. */
export const planLive = (p: Plan, now: number) => now >= planStart(p) && now < planEnd(p);

/* ---------- tickets ---------- */

export interface Ticket {
  id: string;
  windowKey: string;
  title: string;
  ci: string;
  filedAt: number;
  /** When it cleared on its own. Missing when somebody had to work it. */
  clearedAt?: number;
  priority: 1 | 2 | 3 | 4;
}

/** What became of a ticket.
 *    pages    no plan touched it: it paged the group as usual
 *    paged    a P1: it paged anyway
 *    marked   in the queue, marked as expected
 *    lowered  in the queue a priority lower
 *    held     beside the plan, waiting for the work to end
 *    cleared  held, and it cleared on its own
 *    sent     held, still open when the hold ended (or sent early): in the queue now */
export type Fate = 'pages' | 'paged' | 'marked' | 'lowered' | 'held' | 'cleared' | 'sent';

/** Status colour for each: red a real page, amber waiting, green caught, orange needs a look. */
export const FATE: Record<Fate, { label: string; tone: 'red' | 'amber' | 'green' | 'orange' | 'plain' }> = {
  pages: { label: 'Paged as usual', tone: 'plain' },
  paged: { label: 'P1, paged anyway', tone: 'red' },
  marked: { label: 'In the queue, marked', tone: 'plain' },
  lowered: { label: 'In the queue, lowered', tone: 'plain' },
  held: { label: 'Held', tone: 'amber' },
  cleared: { label: 'Cleared on its own', tone: 'green' },
  sent: { label: 'Sent to the queue', tone: 'orange' },
};

export interface Verdict {
  fate: Fate;
  /** held: when it will be let go. cleared: when it cleared. sent: when it went. */
  at?: number;
}

export function verdictOf(t: Ticket, plan: Plan | undefined, now: number): Verdict {
  const stretch = plan && covers(plan, t.ci) ? stretchAt(plan, t.filedAt) : undefined;
  if (!plan || !stretch) return { fate: 'pages' };
  if (t.priority === 1) return { fate: 'paged' };
  if (stretch.soft === 'mark') return { fate: 'marked' };
  if (stretch.soft === 'lower') return { fate: 'lowered' };
  const letGo = Math.min(holdEnds(plan, t.filedAt) + plan.settle, plan.sent[t.id] ?? Infinity);
  if (t.clearedAt !== undefined && t.clearedAt <= Math.min(now, letGo)) return { fate: 'cleared', at: t.clearedAt };
  if (now >= letGo) return { fate: 'sent', at: letGo };
  return { fate: 'held', at: letGo };
}

/** `filed` counts only the tickets the plan covered; the ones outside it paged as usual. */
export type Tally = Record<Fate, number> & { filed: number };

export function tallyOf(tickets: Ticket[], plan: Plan | undefined, now: number): Tally {
  const tally = { filed: 0, pages: 0, paged: 0, marked: 0, lowered: 0, held: 0, cleared: 0, sent: 0 };
  for (const t of tickets) tally[verdictOf(t, plan, now).fate]++;
  tally.filed = tickets.length - tally.pages;
  return tally;
}

/* ---------- the made-up tickets ---------- */

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

/** What gets filed against each window's CIs while the work runs: [ci, title]. */
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
  'CHG-2304': [
    ['hd-motivator-02', 'Motivator 2 offline'],
    ['hd-motivator-05', 'Field coil 5 out of tolerance'],
  ],
};

/** How far ahead the prototype's clock can run, so tickets are made that far. */
const HORIZON = 10 * HOUR;

function ticketsFor(w: ChangeWindow): Omit<Ticket, 'id'>[] {
  const pool = FILED[w.id];
  if (!pool || w.start > NOW.getTime() + HORIZON) return [];
  const r = rng(w.key);
  const now = NOW.getTime();
  // Long windows only get tickets for the last half day, so the near past is busy.
  const from = Math.max(w.start, now - 10 * HOUR);
  // A window that's running late keeps setting things off until it's closed.
  const last = w.closedAt ?? (w.plannedEnd < now ? now + 3 * HOUR : w.plannedEnd);
  if (last <= from) return [];
  const hours = (last - from) / HOUR;
  const count = Math.max(3, Math.min(12, Math.round(hours * 2.2)));
  const out: Omit<Ticket, 'id'>[] = [];
  for (let i = 0; i < count; i++) {
    const [ci, title] = pool[Math.floor(r() * pool.length)];
    const filedAt = from + ((i + 0.2 + r() * 0.6) / count) * (last - from);
    const roll = r();
    out.push({
      windowKey: w.key,
      ci,
      title,
      filedAt,
      priority: roll < 0.18 ? 2 : roll < 0.6 ? 3 : 4,
      clearedAt: r() < 0.64 ? filedAt + (4 + r() * 38) * MINUTE : undefined,
    });
  }
  // One straggler just after the work: by then nothing covers it.
  const [ci, title] = pool[0];
  out.push({ windowKey: w.key, ci, title, filedAt: last + (8 + r() * 25) * MINUTE, priority: 3, clearedAt: undefined });
  // The superlaser test sets off one real fault partway through: a P1.
  if (w.id === 'CHG-2398') {
    out.push({ windowKey: w.key, ci: 'superlaser-cap-02', title: 'Capacitor bank 2 containment fault', filedAt: now - 64 * MINUTE, priority: 1 });
  }
  return out;
}

export const WINDOWS: ChangeWindow[] = sortWindows(SAMPLES.tidy, NOW.getTime());

/** Every ticket, oldest first, numbered in the order they were filed. */
export const TICKETS: Ticket[] = WINDOWS.flatMap(ticketsFor)
  .sort((a, b) => a.filedAt - b.filedAt)
  .map((t, i) => ({ ...t, id: `INC-${41180 + i * 3}` }));

/** The tickets filed against a window so far, newest first. */
export const filedFor = (w: ChangeWindow, now: number) => TICKETS.filter((t) => t.windowKey === w.key && t.filedAt <= now).reverse();

/* ---------- plans already in place when the prototype opens ---------- */

const windowById = (id: string, ended = false) => WINDOWS.find((w) => w.id === id && !!w.closedAt === ended)!;

function seed(id: string, w: ChangeWindow, settle: number, by: string, reason: string): Plan {
  return { id, windowKey: w.key, cis: [w.cis], stretches: [{ from: w.start, to: w.plannedEnd, soft: 'hold' }], settle, by, reason, sent: {} };
}

export const SEEDED: Plan[] = [
  seed('MNT-0412', windowById('CHG-2398'), 30 * MINUTE, 'Commander Praji', 'Pre-charge and a low-power firing. Capacitor and beam alarms are expected the whole way through.'),
  seed('MNT-0409', windowById('CHG-2342'), 15 * MINUTE, 'Chief Bast', 'The car is locked out for the actuator swap, so its door and position sensors will alarm.'),
  seed('MNT-0401', windowById('CHG-2405', true), 30 * MINUTE, 'TIE Hangar Ops', 'The seal is powered down for inspection. Field and pressure alarms are expected.'),
];

let made = 412;
export const nextPlanId = () => `MNT-0${++made}`;

/** A new plan for a window, as it would be filled in for you: what the window covers, from
 *  now (or its start) to its planned end (or an hour from now, if it's already past it),
 *  held, with half an hour to settle. Null for a window that has ended. */
export function draftFor(w: ChangeWindow, now: number, by: string): Plan | null {
  if (w.closedAt) return null;
  const from = Math.max(w.start, Math.ceil(now / (5 * MINUTE)) * 5 * MINUTE);
  const to = w.plannedEnd > from ? w.plannedEnd : from + HOUR;
  return { id: '', windowKey: w.key, cis: [w.cis], stretches: [{ from, to, soft: 'hold' }], settle: 30 * MINUTE, by, reason: '', sent: {} };
}

/** Set the whole plan to one level. */
export const oneLevel = (p: Plan, soft: Soft): Plan => ({ ...p, stretches: p.stretches.map((s) => ({ ...s, soft })) });

/** Move the plan's end, keeping its stretches in order (the last one stretches or shrinks). */
export function withEnd(p: Plan, to: number): Plan {
  const kept = p.stretches.filter((s) => s.from < to);
  const stretches = kept.map((s, i) => (i === kept.length - 1 ? { ...s, to } : s));
  return { ...p, stretches: stretches.length ? stretches : [{ ...p.stretches[0], to }] };
}

/** Give a plan more time. One that has already ended starts again from now: the tickets
 *  filed in between have already paged, and nothing softens them after the fact. */
export function extended(p: Plan, now: number, by: number): Plan {
  if (now < planEnd(p)) return withEnd(p, planEnd(p) + by);
  const last = p.stretches[p.stretches.length - 1];
  return { ...p, stretches: [...p.stretches, { from: now, to: now + by, soft: last.soft }] };
}

/** End a plan now: anything after now is dropped. */
export const endedNow = (p: Plan, now: number): Plan => withEnd(p, Math.max(planStart(p) + MINUTE, now));

export const MIN_REASON = 12;
