/* The shape of the Services page: every service, read for "who's the loudest?". Nothing
 * here is stored. It's the hindcast's tickets and the Rules page's rules, counted per
 * service over a lookback, so the figures agree with both pages (see model/talkers.ts). */

import type { Rule } from '../../rule-management/model/types';

/** What the list is ranked by. */
export type Measure = 'tickets' | 'incidents' | 'rules';

/** How far back the counts look, in completed weeks. */
export type Lookback = 4 | 12 | 26;

/** One service over the lookback. */
export interface Talker {
  id: string;
  name: string;
  unit: string;
  /** Every ticket raised against it. */
  tickets: number;
  /** The tickets that turned out to be real incidents. */
  incidents: number;
  /** The same two counts over the lookback before this one, for the change. */
  before: { tickets: number; incidents: number };
  /** Tickets in each completed week of the lookback, oldest first. */
  weekly: number[];
  /** Every rule written for it, by status. */
  rules: { active: number; proposed: number; inactive: number; total: number };
  ruleList: Rule[];
  /** Its slice of every ticket raised in the lookback. */
  share: number;
}
