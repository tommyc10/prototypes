/* The shape of the hindcast, and the pieces the forecast shares with it.
 *
 * The hindcast looks back over every ticket raised, says what caused them and when, and
 * finds the patterns that repeat. The forecast page (src/pages/forecast) takes those same
 * tickets and patterns and says what the next few weeks should hold. Both read one scope (a
 * service and a lookback), so a pattern found here is the same pattern, with the same
 * evidence, that the forecast projects forward.
 *
 * Every number on the page comes from model/hindcast.ts. Components never add anything up
 * themselves, so the figures always agree with each other. */

/** How far back the history looks, in completed weeks. */
export type Lookback = 12 | 26 | 52;

/** How far ahead the forecast looks, in weeks. Here because the scope bar is shared. */
export type Horizon = 4 | 8;

export type CauseKey = 'deploy' | 'config' | 'capacity' | 'hardware' | 'dependency' | 'network' | 'certificate' | 'unknown';

/** What happened to a ticket: it became an incident, someone worked it, or someone cancelled it. */
export type Outcome = 'incident' | 'worked' | 'cancelled';

export interface Ticket {
  id: string;
  title: string;
  ci: string;
  serviceId: string;
  /** ISO timestamp. */
  openedAt: string;
  /** Epoch ms of openedAt, kept for the maths. */
  at: number;
  outcome: Outcome;
  cause: CauseKey;
  /** What fixed it, in a few words. */
  fix: string;
  /** Minutes from opened to resolved. */
  resolveMins: number;
  /** The same CI had a ticket with the same cause in the 3 days before. */
  repeat: boolean;
}

/** When a pattern gets its chance to happen. */
export type Cadence =
  | { kind: 'weekday'; day: number } // 0 = Monday
  | { kind: 'cycle'; everyDays: number; anchor: string }
  | { kind: 'month-end'; daysBefore: number };

/** Something that keeps happening, written as a claim the history can check. */
export interface Pattern {
  id: string;
  title: string;
  serviceId: string;
  cause: CauseKey;
  cadence: Cadence;
  /** In words: "Every Wednesday", "Every 91 days". */
  when: string;
  /** How many days after each chance a matching ticket still counts. */
  windowDays: number;
  /** What to do about it, for the forecast. */
  action: string;
}

/* ---------- hindcast ---------- */

export interface HindcastScope {
  serviceId: string; // or 'all'
  weeks: Lookback;
  cause: CauseKey | null;
}

export interface WeekRow {
  /** Monday, ISO date. */
  start: string;
  incident: number;
  worked: number;
  cancelled: number;
  total: number;
  /** Median minutes to resolve; null in a week with no tickets. */
  medianMins: number | null;
}

/** A headline figure, with the same figure for the period before and its weekly series. */
export interface Kpi {
  value: number;
  previous: number;
  series: number[];
}

export interface CauseRow {
  key: CauseKey;
  label: string;
  count: number;
  share: number;
  incidents: number;
  medianMins: number;
  /** Count in the period before, for the change. */
  previous: number;
}

export interface PatternEvidence {
  pattern: Pattern;
  /** Chances the pattern had in the lookback. */
  chances: number;
  hits: number;
  confidence: number;
  /** Hit or miss for the most recent chances, oldest first. */
  strip: boolean[];
  /** Of the tickets that matched, the share that became incidents. */
  incidentShare: number;
  /** Tickets raised each time it happened, on average. */
  ticketsPerHit: number;
  /** The next chance after today, ISO date. */
  next: string;
}

export interface Hindcast {
  scope: HindcastScope;
  from: string;
  to: string;
  weeks: WeekRow[];
  kpis: {
    tickets: Kpi;
    incidents: Kpi;
    medianMins: Kpi;
    repeatShare: Kpi;
    foundShare: Kpi;
  };
  /** Every cause in the scope's service and lookback, ignoring the cause filter. Biggest first. */
  causes: CauseRow[];
  /** Tickets by weekday (Monday first) and hour, 7 × 24. */
  heat: number[][];
  heatMax: number;
  /** Newest first. */
  tickets: Ticket[];
  patterns: PatternEvidence[];
}
