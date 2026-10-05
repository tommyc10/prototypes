/* The words the page shows for each value, and the few sums the components share. */

import type { CategoryKey, Lookback, Outcome, ProposalVerdict, ReasonKey, Split, TuningKind } from './types';

export const LOOKBACKS: Lookback[] = [4, 8, 12, 26];
export const DEFAULT_LOOKBACK: Lookback = 8;

/** Always in this order: the strongest catch first, what slipped through last. */
export const OUTCOMES: Outcome[] = ['rule', 'window', 'missed'];

export const OUTCOME_LABEL: Record<Outcome, string> = {
  rule: 'Caught by a rule',
  window: 'Caught by a change window',
  missed: 'Not caught',
};

/** For tight spots: the list's key, the ticket filters. */
export const OUTCOME_SHORT: Record<Outcome, string> = {
  rule: 'Rule',
  window: 'Window',
  missed: 'Not caught',
};

export const REASON_LABEL: Record<ReasonKey, string> = {
  cleared: 'Cleared before triage',
  duplicate: 'Duplicate of an open ticket',
  planned: 'Planned work in progress',
  known: 'Known issue, no action',
  drill: 'Test or drill',
  nofault: 'No fault found',
};

export const CATEGORY_LABEL: Record<CategoryKey, string> = {
  thermal: 'Thermal',
  power: 'Power',
  sensors: 'Sensors',
  comms: 'Comms',
  access: 'Doors and access',
  environment: 'Environment',
  mechanical: 'Mechanical',
  inventory: 'Inventory',
};

export const VERDICT_LABEL: Record<ProposalVerdict, string> = {
  validated: 'Validated',
  review: 'Needs review',
  unsafe: 'Unsafe',
};

export const TUNING_LABEL: Record<TuningKind, string> = {
  approve: 'Approve',
  revisit: 'Revisit',
  widen: 'Widen',
  extend: 'Extend',
};

/** The page's chapters, in reading order. The ids are the sections' element ids. */
export const CHAPTERS = [
  { id: 'verdict', label: 'Verdict', question: 'What would have happened' },
  { id: 'sources', label: 'Sources', question: 'Where the noise came from' },
  { id: 'caught-by', label: 'Caught by', question: 'What would have caught it' },
  { id: 'tune-next', label: 'Tune next', question: 'What to change' },
  { id: 'method', label: 'Method', question: 'How to read this' },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]['id'];

/** Every cancelled ticket in a split. */
export const total = (s: Split) => s.rule + s.window + s.missed;

/** The ones that would never have reached a person. */
export const caught = (s: Split) => s.rule + s.window;

/** A share that's safe when there's nothing to divide by. */
export const share = (part: number, whole: number) => (whole ? part / whole : 0);
