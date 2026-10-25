/* Maintenance plans: what a plan made of each ticket, and the arithmetic of making one.
 *
 * A change window on its own only says what work is planned. A maintenance plan sits on one
 * run of a window and softens the tickets filed against what it covers while the work runs.
 * Softened, never hidden: every ticket is still filed and can be found, nobody is paged for
 * it, and a P1 always pages (see Soft in types.ts for the three levels). A plan never softens
 * a ticket filed before it started: that one has already paged.
 *
 * Most plans fade out rather than switch off: the work itself at the chosen level, then half
 * an hour at `mark`, so whatever the work sets off as it settles goes to the queue marked as
 * expected instead of paging someone the moment the window closes. */

import { HOUR } from './windows';
import type { ChangeWindow, MaintenancePlan, PlanTicket, Soft, Stretch } from './types';

export const MINUTE = 60_000;

/** How long a plan that fades out keeps marking tickets after the work. */
export const FADE = 30 * MINUTE;

export const SOFTS: Soft[] = ['mark', 'lower', 'hold'];

export const SOFT: Record<Soft, { label: string; is: string; was: string; says: string }> = {
  mark: {
    label: 'Mark',
    is: 'marked as expected',
    was: 'marked as expected',
    says: 'Each ticket goes to the queue at its own priority, marked as expected. Nobody is paged.',
  },
  lower: {
    label: 'Lower',
    is: 'lowered a priority',
    was: 'lowered a priority',
    says: 'Each ticket goes to the queue one priority lower, marked as expected. Nobody is paged.',
  },
  hold: {
    label: 'Hold',
    is: 'held beside the plan',
    was: 'held beside the plan',
    says: 'Each ticket is kept beside the plan while the work runs. Nobody is paged. Anything still open when it ends goes to the queue.',
  },
};

export type Ending = 'fade' | 'off';

export const ENDINGS: { value: Ending; label: string; says: string }[] = [
  { value: 'fade', label: 'Fade out', says: 'For half an hour after the work, new tickets are marked as expected instead of paging.' },
  { value: 'off', label: 'Switch off', says: 'Tickets page as usual the moment the work ends.' },
];

export const planStart = (p: MaintenancePlan) => p.stretches[0].from;
export const planEnd = (p: MaintenancePlan) => p.stretches[p.stretches.length - 1].to;

/** Whether the plan ends with the half-hour fade, and where the work part of it ends. */
export function fades(p: MaintenancePlan) {
  if (p.stretches.length < 2) return false;
  const [before, last] = p.stretches.slice(-2);
  return last.soft === 'mark' && before.soft !== 'mark' && last.to - last.from === FADE && last.from === before.to;
}
export const workEnd = (p: MaintenancePlan) => (fades(p) ? p.stretches[p.stretches.length - 2].to : planEnd(p));

export const stretchAt = (p: MaintenancePlan, t: number) => p.stretches.find((s) => t >= s.from && t < s.to);

/** The level the work runs at: now, if it's running, or at the end of the work. */
export const workLevel = (p: MaintenancePlan, now: number) => (now < workEnd(p) ? stretchAt(p, Math.max(now, planStart(p))) : stretchAt(p, workEnd(p) - 1))?.soft ?? p.stretches[0].soft;

/** In place now: started, not yet ended. */
export const planLive = (p: MaintenancePlan, now: number) => now >= planStart(p) && now < planEnd(p);

/** Where the run of hold that `t` falls in ends. */
function holdEnds(p: MaintenancePlan, t: number) {
  let i = p.stretches.findIndex((s) => t >= s.from && t < s.to);
  while (p.stretches[i + 1]?.soft === 'hold' && p.stretches[i + 1].from <= p.stretches[i].to) i++;
  return p.stretches[i].to;
}

const glob = (pattern: string) => new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);

export const covers = (p: MaintenancePlan, ci: string) => p.cis.some((pattern) => glob(pattern).test(ci));

/* ---------- what became of each ticket ---------- */

/** What became of a ticket.
 *    pages    no plan covered it: it paged as usual
 *    paged    a P1: it paged anyway
 *    marked   in the queue, marked as expected
 *    lowered  in the queue a priority lower
 *    held     beside the plan, waiting for the work to end
 *    cleared  held, and it cleared on its own
 *    sent     held, and still open when the hold ended (or sent on early): in the queue now */
export type Fate = 'pages' | 'paged' | 'marked' | 'lowered' | 'held' | 'cleared' | 'sent';

/** Status colour, by what each means: red a real page, amber waiting, green caught, orange needs a look. */
export const FATE_TONE: Record<Fate, 'red' | 'amber' | 'green' | 'orange' | undefined> = {
  pages: undefined,
  paged: 'red',
  marked: undefined,
  lowered: undefined,
  held: 'amber',
  cleared: 'green',
  sent: 'orange',
};

export interface Verdict {
  fate: Fate;
  /** held: when it will be let go. cleared: when it cleared. sent: when it went. */
  at?: number;
}

export function verdictOf(t: PlanTicket, plan: MaintenancePlan | undefined, now: number): Verdict {
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

/** How many of each. `filed` counts only the tickets the plan covered. */
export type Tally = Record<Fate, number> & { filed: number };

export function tallyOf(tickets: PlanTicket[], plan: MaintenancePlan | undefined, now: number): Tally {
  const tally = { filed: 0, pages: 0, paged: 0, marked: 0, lowered: 0, held: 0, cleared: 0, sent: 0 };
  for (const t of tickets) tally[verdictOf(t, plan, now).fate]++;
  tally.filed = tickets.length - tally.pages;
  return tally;
}

/* ---------- making and changing a plan ---------- */

/** What the form holds. A plan is built from it, and read back into it to be changed. */
export interface PlanDraft {
  cis: string[];
  from: number;
  /** When the work part ends (the fade, if any, comes after). */
  until: number;
  soft: Soft;
  ending: Ending;
  settle: number;
  reason: string;
}

/** The stretches a draft makes: the work at its level, then the fade if it has one. */
export function stretchesOf(d: Pick<PlanDraft, 'from' | 'until' | 'soft' | 'ending'>): Stretch[] {
  const work = { from: d.from, to: d.until, soft: d.soft };
  return d.ending === 'fade' && d.soft !== 'mark' ? [work, { from: d.until, to: d.until + FADE, soft: 'mark' }] : [work];
}

/** A new plan for a window, filled in for you: what the window covers, from now (or its
 *  start) to its planned end (or an hour from now, if it's past it), held, fading out, with
 *  half an hour to settle. Null for a window that has ended: a plan only covers work to come. */
export function draftFor(w: ChangeWindow, now: number): PlanDraft | null {
  if (w.closedAt) return null;
  const from = Math.max(w.start, Math.ceil(now / (5 * MINUTE)) * 5 * MINUTE);
  return { cis: [w.cis], from, until: w.plannedEnd > from ? w.plannedEnd : from + HOUR, soft: 'hold', ending: 'fade', settle: 30 * MINUTE, reason: '' };
}

/** A plan read back into the form, to be changed. The reason starts empty: a change needs its own. */
export function draftOf(p: MaintenancePlan): PlanDraft {
  return { cis: p.cis, from: planStart(p), until: workEnd(p), soft: workLevel(p, Infinity), ending: fades(p) ? 'fade' : 'off', settle: p.settle, reason: '' };
}

/** A plan ends with its window. If the window was closed before the plan's work part ended,
 *  the work part stops there, and the fade (if it has one) runs from then. */
export function withWindow(p: MaintenancePlan, w: ChangeWindow): MaintenancePlan {
  const closed = w.closedAt;
  if (!closed || closed >= workEnd(p)) return p;
  const fade = fades(p);
  const work = (fade ? p.stretches.slice(0, -1) : p.stretches).filter((s) => s.from < closed).map((s) => ({ ...s, to: Math.min(s.to, closed) }));
  if (!work.length) return p;
  return { ...p, stretches: fade ? [...work, { from: closed, to: closed + FADE, soft: 'mark' }] : work };
}

/** Give a plan whose time has run out another `by`, from now. The tickets filed in between
 *  have already paged, and nothing softens them after the fact. */
export function extended(p: MaintenancePlan, now: number, by: number): MaintenancePlan {
  const soft = workLevel(p, now);
  // A fade still running is cut off at now: the work has turned out not to be over.
  const before = now < planEnd(p) ? endedNow(p, now).stretches : p.stretches;
  return { ...p, stretches: [...before, ...stretchesOf({ from: now, until: now + by, soft, ending: fades(p) ? 'fade' : 'off' })] };
}

/** A plan with the form's changes. Whatever has already happened stays as it was: the new
 *  levels apply from now on, so no ticket is softened (or un-softened) after the fact. */
export function applied(d: PlanDraft, base: MaintenancePlan, now: number, by: string): MaintenancePlan {
  const started = base.stretches.length > 0 && planStart(base) < now;
  const past = started ? endedNow(base, now).stretches : [];
  const next = stretchesOf({ ...d, from: started ? now : d.from });
  return { ...base, cis: d.cis, stretches: [...past, ...next].filter((s) => s.to > s.from), settle: d.settle, by, reason: d.reason.trim() };
}

/** End a plan now: anything after now is dropped. Held tickets then settle as usual. */
export function endedNow(p: MaintenancePlan, now: number): MaintenancePlan {
  const kept = p.stretches.filter((s) => s.from < now).map((s) => ({ ...s, to: Math.min(s.to, now) }));
  return { ...p, stretches: kept.length ? kept : [{ ...p.stretches[0], to: p.stretches[0].from + MINUTE }] };
}
