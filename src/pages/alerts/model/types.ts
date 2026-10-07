/* The shape of the data. An alert is what a monitor sends; what becomes of it depends on
 * the rules as they stand right now, so that part is worked out, never stored (see stream.ts). */

import type { Rule } from '../../rule-management/model/types';

export type Severity = 'info' | 'warning' | 'critical';

/** What became of an alert.
 *    paged   it opened an incident, and a person was told
 *    folded  it joined an incident that was already open
 *    hidden  an active rule suppressed it; nobody saw it */
export type Outcome = 'paged' | 'folded' | 'hidden';

/** One alert, as it arrives from a monitor. */
export interface Alert {
  id: string;
  /** When it arrived, in milliseconds. */
  at: number;
  title: string;
  ci: string;
  source: string;
  severity: Severity;
  groupId: string;
  /** The rule whose conditions this alert fits, whatever that rule's status is. */
  ruleId?: string;
  /** What happens to it when no active rule hides it. */
  fallback: 'paged' | 'folded';
  /** The incident it opened, or was folded into. */
  incidentId: string;
}

/** An alert, plus what the rules made of it. */
export interface StreamAlert extends Alert {
  outcome: Outcome;
  /** The rule it fits, if any. Active means it was hidden by this rule. */
  rule?: Rule;
  /** A proposed rule fits it: approving that rule would hide alerts like this one. */
  wouldHide: boolean;
}

/** The counts for a stretch of the stream. */
export interface Tally {
  total: number;
  paged: number;
  folded: number;
  hidden: number;
  /** Not hidden today, but a proposed rule would hide them. */
  wouldHide: number;
  /** …and of those, how many opened an incident: pages that would stop arriving. */
  wouldHidePaged: number;
}

/** One rule's part in the stream. */
export interface RuleAtWork {
  rule: Rule;
  /** Alerts in the window that fit this rule. */
  count: number;
  /** Of those, how many opened an incident (only matters while the rule isn't active). */
  paged: number;
}

export type FeedFilter = 'all' | Outcome;
