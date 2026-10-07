/* The shape of the data. An incident travels a fixed line of checkpoints. At each one it is
 * either let through or stopped, and where it stopped is what became of it. Like a rule's
 * status on the other pages, that isn't stored: it's worked out from the rules as they
 * stand (see data/mockData.ts), so approving a rule changes this page too. */

import type { MatchedCondition, RelatedIncident, Rule } from '../../rule-management/model/types';

/** The checkpoints, in the order every incident meets them. */
export type StationId = 'raised' | 'windows' | 'rules' | 'duplicates' | 'enrichment' | 'delivered';

/** Where an incident's journey ended.
 *    held        inside a change window: expected, so held back
 *    suppressed  an active rule fitted it: hidden
 *    folded      the same fault as an incident already open: added to that one
 *    noise       it got through every check, then cleared on its own before anyone triaged it
 *    enriching   not noise: with the Imperial Ops team now, being enriched
 *    delivered   enriched, and handed to the group that owns it */
export type End = 'held' | 'suppressed' | 'folded' | 'noise' | 'enriching' | 'delivered';

export interface Station {
  id: StationId;
  /** passed: went through. stopped: the journey ended here. current: it's here now.
   *  unreached: it never got this far. */
  state: 'passed' | 'stopped' | 'current' | 'unreached';
  /** When it got here, in milliseconds. Missing if it never did. */
  at?: number;
  /** What this checkpoint made of it, in a few words. */
  verdict: string;
}

/** One field of the ticket, as it was raised and as the team left it. */
export interface EnrichedField {
  label: string;
  before: string;
  /** Missing while the team hasn't got to it yet. */
  after?: string;
}

export interface Enrichment {
  by: string;
  sentAt: number;
  /** Missing while it's still with the team. */
  doneAt?: number;
  fields: EnrichedField[];
}

/** One step of what happened after delivery. */
export interface Step {
  at: number;
  actor: string;
  text: string;
}

/** An incident and its whole journey. */
export interface Lifecycle {
  incident: RelatedIncident;
  groupId: string;
  end: End;
  /** Somebody had to work it, or it was escalated: it was a real incident, not noise. */
  real: boolean;
  /** The verdict, as one sentence. */
  summary: string;
  stations: Station[];
  /** The rule whose conditions it fits, whatever that rule's status. */
  rule?: Rule;
  matched: MatchedCondition[];
  /** The change window it was raised inside, if it was held. */
  window?: { id: string; name: string };
  /** The incident it was folded into. */
  foldedInto?: string;
  enrichment?: Enrichment;
  /** After delivery: acknowledged, worked, resolved. */
  steps: Step[];
  alertCount: number;
  /** The priority it was raised at, and the one it ended at. */
  raisedAt: number;
  priority: number;
}

export type EndFilter = 'all' | 'suppressed' | 'enriched' | 'other';
