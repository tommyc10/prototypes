/* The words the UI shows for each value. Lookup tables instead of if/else:
 * `Record<RuleAction, string>` makes TypeScript insist on an entry for every action. */

import { wasRejected } from './policy';
import type { Resolution, Rule, RuleAction, RuleSource, RuleStatus } from './types';

export const ACTION_LABEL: Record<RuleAction, string> = {
  approve: 'Approve',
  reject: 'Reject',
  activate: 'Activate',
  deactivate: 'Deactivate',
};

/** The keyboard shortcut for each action. */
export const ACTION_KEY: Record<RuleAction, string> = { approve: 'A', reject: 'X', activate: 'E', deactivate: 'D' };

export const STATUS_LABEL: Record<RuleStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  proposed: 'Proposed',
};

export const SOURCE_LABEL: Record<RuleSource, string> = {
  'pattern-miner': 'Pattern miner',
  'correlation-engine': 'Correlation engine',
  'duplicate-detector': 'Duplicate detector',
  operator: 'Operator',
};

export const RESOLUTION_LABEL: Record<Resolution, string> = {
  'auto-cleared': 'Auto-cleared',
  'closed-no-action': 'Closed, no action',
  duplicate: 'Duplicate',
  worked: 'Worked, minor',
  escalated: 'Escalated',
};

/** "Rejected" isn't a status of its own, so it's worked out from the audit log. */
export function statusLabel(rule: Rule) {
  return wasRejected(rule) ? 'Rejected' : STATUS_LABEL[rule.status];
}
