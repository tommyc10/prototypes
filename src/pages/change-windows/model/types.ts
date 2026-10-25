/* The shape of the data. A change window is a stretch of planned work on something:
 * while it's in place, alerts from the things it covers are held back, because the work
 * is expected to set them off. */

/** Where a window is in its life. It's worked out from its times, never stored (see windows.ts).
 *    active       in place now, inside its planned time
 *    overrunning  in place now, past its planned end and still not closed
 *    upcoming     approved, not started
 *    ended        closed */
export type WindowStatus = 'active' | 'overrunning' | 'upcoming' | 'ended';

export interface ChangeWindow {
  /** Unique to this one run. A window that repeats has the same `id` each time. */
  key: string;
  /** The change ticket, e.g. CHG-2398. */
  id: string;
  name: string;
  groupId: string;
  reason: string;
  /** "One-off", or how often it repeats. Missing when the source doesn't say. */
  schedule?: string;
  /** Which CIs it covers, written the way a rule's condition is. */
  cis: string;
  raisedBy?: string;
  approvedBy?: string;
  /** Milliseconds. */
  start: number;
  plannedEnd: number;
  /** When it was closed. Missing while it's still in place, or hasn't started. */
  closedAt?: number;
  /** Alerts held back in each half hour since it started. Empty until it starts.
   *  Missing altogether when nobody is counting: then the page says nothing about it. */
  held?: number[];
  /** For a window that hasn't started: how many alerts its last run held back. */
  lastRunHeld?: number;
}

export type ListFilter = 'all' | 'now' | 'upcoming' | 'ended';

/** Which made-up estate the prototype shows: a tidy one, or one shaped like a real feed. */
export type Sample = 'tidy' | 'busy';

/** How much time the schedule shows, in hours. */
export type Range = 24 | 72 | 168;

/* ---------- maintenance plans ---------- */

/** How quiet a maintenance plan keeps the tickets it covers. Never hidden: every ticket is
 *  still filed and can be found, and a P1 always pages.
 *    mark   into the queue at its own priority, marked as expected. Nobody is paged.
 *    lower  into the queue one priority lower, marked. Nobody is paged.
 *    hold   kept beside the plan while the work runs. Nobody is paged. Whatever is still
 *           open when the hold ends (and its settle time has passed) goes to the queue. */
export type Soft = 'mark' | 'lower' | 'hold';

/** One stretch of a plan, at one level. */
export interface Stretch {
  /** Milliseconds. */
  from: number;
  to: number;
  soft: Soft;
}

/** A plan on one run of a change window: what it covers, how quiet, and until when. A window
 *  on its own holds nothing back; the plan is what softens the tickets filed against it. */
export interface MaintenancePlan {
  /** e.g. MNT-0412 */
  id: string;
  /** The run of the window it's on (ChangeWindow.key). */
  windowKey: string;
  /** What it covers, written the way a window's CIs are: `superlaser-*`. */
  cis: string[];
  /** In order. Usually the work itself, then a half-hour tail at `mark` when it fades out. */
  stretches: Stretch[];
  /** How long a held ticket gets, once the hold ends, to clear on its own. Milliseconds. */
  settle: number;
  by: string;
  reason: string;
  /** Tickets someone sent to the queue early, and when. */
  sent: Record<string, number>;
}

/** A ticket filed against something a window covers. */
export interface PlanTicket {
  /** e.g. INC-41288 */
  id: string;
  windowKey: string;
  title: string;
  ci: string;
  filedAt: number;
  /** When it cleared on its own. Missing when somebody had to work it. */
  clearedAt?: number;
  priority: 1 | 2 | 3 | 4;
}
