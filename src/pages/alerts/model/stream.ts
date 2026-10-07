/* What the rules make of the stream. An alert only says which rule it fits; whether that
 * hides it depends on the rule's status right now, so approving a rule on the Rules page
 * changes this page too. */

import type { Rule } from '../../rule-management/model/types';
import type { Alert, RuleAtWork, StreamAlert, Tally } from './types';

/** Work out what became of each alert, given the rules as they stand. */
export function resolve(alerts: Alert[], rules: Rule[]): StreamAlert[] {
  const byId = new Map(rules.map((rule) => [rule.id, rule]));
  return alerts.map((alert) => {
    const rule = alert.ruleId ? byId.get(alert.ruleId) : undefined;
    return {
      ...alert,
      rule,
      outcome: rule?.status === 'active' ? 'hidden' : alert.fallback,
      wouldHide: rule?.status === 'proposed',
    };
  });
}

export function tally(alerts: StreamAlert[]): Tally {
  const t: Tally = { total: alerts.length, paged: 0, folded: 0, hidden: 0, wouldHide: 0, wouldHidePaged: 0 };
  for (const alert of alerts) {
    t[alert.outcome]++;
    if (alert.wouldHide) {
      t.wouldHide++;
      if (alert.outcome === 'paged') t.wouldHidePaged++;
    }
  }
  return t;
}

/** The active and proposed rules that alerts in this stretch fit, the busiest first. */
export function rulesAtWork(alerts: StreamAlert[]): RuleAtWork[] {
  const rows = new Map<string, RuleAtWork>();
  for (const alert of alerts) {
    const rule = alert.rule;
    if (!rule || rule.status === 'inactive') continue;
    const row = rows.get(rule.id) ?? { rule, count: 0, paged: 0 };
    row.count++;
    if (alert.outcome === 'paged') row.paged++;
    rows.set(rule.id, row);
  }
  return [...rows.values()].sort((a, b) => b.count - a.count);
}

/** Below the waterline: hidden, or (while previewing) about to be. */
export const isSunk = (alert: StreamAlert, preview: boolean) => alert.outcome === 'hidden' || (preview && alert.wouldHide);
