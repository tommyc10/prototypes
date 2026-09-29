/* The governance rules: who can do what to a rule, and when.
 * Plain functions with no React in them, so they're easy to read and test.
 * The real backend must enforce the same rules; the browser can always be bypassed. */

import { pct } from '../../../lib/format';
import type { AuditAction, Impact, Rule, RuleAction, RuleStatus } from './types';

/** Rules below this confidence need an explicit override before they can be turned on. */
export const LOW_CONFIDENCE = 0.6;

/** The shortest reason we accept for a decision, in characters. */
export const MIN_REASON = 12;

/** Which buttons a rule gets depends only on its status. */
export function actionsFor(rule: Rule): RuleAction[] {
  if (rule.status === 'proposed') return ['approve', 'reject'];
  if (rule.status === 'active') return ['deactivate'];
  return ['activate'];
}

/** The status a rule moves to after each action. */
export const NEXT_STATUS: Record<RuleAction, RuleStatus> = {
  approve: 'active',
  reject: 'inactive',
  activate: 'active',
  deactivate: 'inactive',
};

/** How each action is written in the audit log. */
export const ACTION_PAST: Record<RuleAction, AuditAction> = {
  approve: 'approved',
  reject: 'rejected',
  activate: 'activated',
  deactivate: 'deactivated',
};

export const isLowConfidence = (rule: Rule) => rule.confidence < LOW_CONFIDENCE;

/** Approve and activate start suppressing incidents; reject and deactivate stop it. */
export const turnsOn = (action: RuleAction) => action === 'approve' || action === 'activate';

export const needsOverride = (rule: Rule, action: RuleAction) => turnsOn(action) && isLowConfidence(rule);

/** Checks a decision before it's saved. `ok` is false until every requirement is met. */
export function validate(rule: Rule, action: RuleAction, reason: string, override: boolean) {
  const errors: { reason?: string; override?: string } = {};
  const len = reason.trim().length;
  if (len === 0) errors.reason = 'A written reason is required for every rule change.';
  else if (len < MIN_REASON) errors.reason = `Add a little more detail (${MIN_REASON - len} more characters).`;
  if (needsOverride(rule, action) && !override)
    errors.override = `Confidence is ${pct(rule.confidence)}, below the ${pct(LOW_CONFIDENCE)} floor. Confirm the override to continue.`;
  return { ok: !errors.reason && !errors.override, errors };
}

/** A rejected rule is stored as "inactive"; its last audit entry tells the two apart. */
export function wasRejected(rule: Rule) {
  return rule.status === 'inactive' && rule.audit[rule.audit.length - 1]?.action === 'rejected';
}

/** What the rule hides (or would hide) over its evidence window. The real app gets this from the backtest API. */
export function estimateImpact(rule: Rule): Impact {
  const suppressed = Math.round(rule.incidentCount * rule.purity);
  return { suppressed, escalated: rule.evidence.escalations, hoursSaved: Math.round((suppressed * 9) / 60) };
}
