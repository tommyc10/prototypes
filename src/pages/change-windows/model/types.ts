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
  /** "One-off", or how often it repeats. */
  schedule: string;
  /** Which CIs it covers, written the way a rule's condition is. */
  cis: string;
  raisedBy: string;
  approvedBy: string;
  /** Milliseconds. */
  start: number;
  plannedEnd: number;
  /** When it was closed. Missing while it's still in place, or hasn't started. */
  closedAt?: number;
  /** Alerts held back in each half hour since it started. Empty until it starts. */
  held: number[];
  /** For a window that hasn't started: how many alerts its last run held back. */
  lastRunHeld?: number;
}

export type ListFilter = 'all' | 'now' | 'upcoming' | 'ended';

/** How much time the schedule shows, in hours. */
export type Range = 24 | 72 | 168;
