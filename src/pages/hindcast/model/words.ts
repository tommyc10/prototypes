/* The replay's words: what each lifecycle and verdict is called, and how it's drawn. */

import type { Lifecycle, Verdict, VerdictGroup } from './replay';

export const LIFECYCLE: Record<Lifecycle | 'closedByHand' | 'closedAuto', string> = {
  closedByHand: 'Closed by hand',
  closedAuto: 'Closed automatically',
  closed: 'Closed',
  cancelled: 'Cancelled',
  open: 'Still open',
  other: 'Merged or moved',
};

export const VERDICT: Record<Verdict, string> = {
  rule: 'An active rule',
  both: 'Rule and window',
  window: 'A change window',
  hypothetical: 'Only a proposed or inactive rule',
  none: 'Nothing explains it',
  unevaluable: 'Couldn’t evaluate',
  unavailable: 'Calendar unavailable',
};

/** Short, for chips in a table row. */
export const VERDICT_SHORT: Record<Verdict, string> = {
  rule: 'Rule',
  both: 'Rule and window',
  window: 'Window',
  hypothetical: 'Hypothetical',
  none: 'Unexplained',
  unevaluable: 'Couldn’t evaluate',
  unavailable: 'Unavailable',
};

export const GROUP: Record<VerdictGroup, string> = {
  explained: 'Would be explained',
  unexplained: 'Not explained',
  unknown: 'Unknown',
};

/** One line under each group, so the reader knows what the group promises and what it doesn't. */
export const GROUP_NOTE: Record<VerdictGroup, string> = {
  explained: 'An active rule or an approved window covers it. Counted once, even when both do.',
  unexplained: 'Nothing running today matches it. These are the gaps worth tuning.',
  unknown: 'The replay couldn’t tell. Not a miss, and not counted as one.',
};

/** How each verdict is drawn: which group's colour, and how strong. "Nothing explains it" is
 *  most of most charts, so it takes the middle grey: the green and the hatching read against
 *  it, and a full-width slab of the brightest tone never becomes the loudest thing on screen. */
export const VERDICT_TONE: Record<Verdict, string> = {
  rule: 'caught',
  both: 'caught-2',
  window: 'caught-3',
  hypothetical: 'tone-3',
  none: 'tone-2',
  unevaluable: 'hatch',
  unavailable: 'hatch-2',
};

export const LIFE_TONE: Record<'closedByHand' | 'closedAuto' | 'cancelled' | 'open' | 'other', string> = {
  closedByHand: 'tone-1',
  closedAuto: 'tone-2',
  cancelled: 'tone-3',
  other: 'tone-4',
  open: 'ring',
};

export type LifeKey = keyof typeof LIFE_TONE;
export const LIFE_KEYS: LifeKey[] = ['closedByHand', 'closedAuto', 'cancelled', 'open', 'other'];
