/* The words the UI shows for each value. */

import type { FeedFilter, Outcome, Severity } from './types';

export const OUTCOME_LABEL: Record<Outcome, string> = {
  paged: 'Reached a person',
  folded: 'Folded into an incident',
  hidden: 'Hidden by a rule',
};

/** The short form, for the feed's tabs and rows. */
export const OUTCOME_SHORT: Record<Outcome, string> = {
  paged: 'Reached',
  folded: 'Folded',
  hidden: 'Hidden',
};

/** The order the outcomes are always listed in: what people saw first. */
export const OUTCOMES: Outcome[] = ['paged', 'folded', 'hidden'];

export const FEED_TABS: { key: FeedFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  ...OUTCOMES.map((key) => ({ key, label: OUTCOME_SHORT[key] })),
];

export const SEVERITY_LABEL: Record<Severity, string> = {
  info: 'Info',
  warning: 'Warning',
  critical: 'Critical',
};
