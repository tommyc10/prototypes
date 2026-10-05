/* The shape of a hindcast.
 *
 * A hindcast replays the tickets people already cancelled by hand against the suppression
 * logic that is live now, and says what would have been caught, and by what. It is evidence
 * about the past, not a prediction.
 *
 * One request (a scope: a service and a number of completed weeks) returns one
 * HindcastReport, and every number on the page is read from it. The components never add
 * anything up themselves, so the figures on the page always agree with each other. */

/** How far back the replay looks, in completed weeks. A week still in progress is never counted. */
export type Lookback = 4 | 8 | 12 | 26;

export interface Scope {
  /** A service's id, or 'all'. */
  serviceId: string;
  weeks: Lookback;
}

/** What the replay says would have happened to a ticket that someone cancelled by hand. */
export type Outcome = 'rule' | 'window' | 'missed';

/** Cancelled tickets, split by outcome. The three always add up to the cancelled total. */
export interface Split {
  rule: number;
  window: number;
  missed: number;
}

/** Why a cancelled ticket was closed, as the operator recorded it. */
export type ReasonKey = 'cleared' | 'duplicate' | 'planned' | 'known' | 'drill' | 'nofault';

export type CategoryKey =
  | 'thermal'
  | 'power'
  | 'sensors'
  | 'comms'
  | 'access'
  | 'environment'
  | 'mechanical'
  | 'inventory';

/** One service's share of the noise. The list column shows one of these per row. */
export interface ServiceRow {
  id: string;
  name: string;
  unit: string;
  /** Every ticket the service raised in the window. */
  tickets: number;
  /** The ones a person cancelled by hand. */
  cancelled: number;
  split: Split;
}

/** One completed week. `start` is its Monday, as an ISO date. */
export interface WeekPoint {
  start: string;
  tickets: number;
  split: Split;
}

/** One bar of a breakdown: a cancellation reason, or a ticket category. */
export interface BreakdownRow {
  key: string;
  label: string;
  split: Split;
}

/** What the engine would do with a ticket today. */
export interface Verdicts {
  rule: number;
  window: number;
  /** Sent on to a person. */
  passed: number;
}

/** Every ticket in the window, by what people did with it and what the engine would do. */
export interface Classification {
  cancelled: Verdicts;
  /** Worked by a person: real, if minor. Anything suppressed here is the cost of the logic. */
  worked: Verdicts;
  /** Escalated: the tickets suppression must never hide. */
  escalated: Verdicts;
}

/** An active rule that matched cancelled tickets. */
export interface RuleContribution {
  ruleId: string;
  name: string;
  serviceId: string;
  caught: number;
  /** Worked (minor) tickets it would also have suppressed. */
  worked: number;
}

/** A change window that had cancelled tickets raised inside it. */
export interface WindowContribution {
  id: string;
  name: string;
  serviceId: string;
  /** In words: "Tuesdays, 02:00–04:00". */
  schedule: string;
  recurring: boolean;
  /** How many times it ran in the window. */
  occurrences: number;
  caught: number;
  /** Tickets caught in each week of the lookback, oldest first. */
  weekly: number[];
}

/** Validated: safe to approve. Review: below the confidence floor. Unsafe: it matched an escalated ticket. */
export type ProposalVerdict = 'validated' | 'review' | 'unsafe';

/** A proposed rule, replayed over the same tickets as if it had been active. */
export interface ProposedValidation {
  ruleId: string;
  name: string;
  serviceId: string;
  confidence: number;
  /** Cancelled tickets it would catch that nothing catches today. */
  wouldCatch: number;
  worked: number;
  escalated: number;
  verdict: ProposalVerdict;
}

/** Of the cancelled tickets: caught today, and what tuning could and couldn't still reach. Adds up to the cancelled total. */
export interface Headroom {
  caught: number;
  /** More, if every proposed rule that validates were approved. */
  proposed: number;
  /** More again, from the other tuning suggested below. */
  tuning: number;
  /** One-offs with no pattern: nothing would catch these. */
  outOfReach: number;
}

export type TuningKind = 'approve' | 'revisit' | 'widen' | 'extend';

/** One thing to change, and what it would have been worth over the window. */
export interface TuningAction {
  id: string;
  kind: TuningKind;
  title: string;
  detail: string;
  /** Cancelled tickets it would have caught on top of today's. */
  gain: number;
  serviceId: string;
  /** The rule to open, if it's about one. */
  ruleId?: string;
}

/** A ticket someone cancelled by hand. */
export interface CancelledTicket {
  id: string;
  title: string;
  ci: string;
  serviceId: string;
  openedAt: string;
  reason: ReasonKey;
  outcome: Outcome;
  /** What would have caught it: a rule or change window id. */
  by?: string;
}

/** The service that raised the most manual cancellations, as a claim with its evidence. */
export interface Lead {
  service: ServiceRow;
  rank: number;
  /** Prose, written from the figures. **Double asterisks** mark the numbers. */
  claim: string;
  tickets: CancelledTicket[];
}

export interface Provenance {
  /** When the replay ran. */
  generatedAt: string;
  /** Where the tickets came from. */
  source: string;
  /** The suppression logic the tickets were replayed against. */
  activeRules: number;
  proposedRules: number;
  changeWindows: number;
  assumptions: string[];
}

export interface HindcastReport {
  /** HC-2026-W39: the last completed week the replay covers. */
  id: string;
  scope: Scope;
  /** The scope's name: "All services", or the service. */
  title: string;
  subtitle: string;
  /** First and last day covered, as ISO dates. */
  from: string;
  to: string;

  /** The executive headline: one paragraph, written from the figures below. */
  headline: string;
  totals: { tickets: number; cancelled: number; split: Split };
  /** Every service, busiest first, whatever the scope: the list column always shows them all. */
  services: ServiceRow[];
  weekly: WeekPoint[];
  classification: Classification;

  /** The top noise maker (scope: all), or this service with its rank. */
  lead: Lead;
  reasons: BreakdownRow[];
  categories: BreakdownRow[];

  rules: RuleContribution[];
  windows: WindowContribution[];

  /** What this tells us: a few sentences, written from the figures. */
  findings: string[];
  headroom: Headroom;
  tuning: TuningAction[];
  proposed: ProposedValidation[];

  provenance: Provenance;
}
