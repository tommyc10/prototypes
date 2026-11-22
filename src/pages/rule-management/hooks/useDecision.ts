/* The decision form's brain: which rule and action it's for, the reason typed so far,
 * whether the override is confirmed, and submitting. It knows nothing about how the
 * form looks; that's the Composer's job.
 *
 * Submitting isn't instant: the rule engine takes a moment to apply a decision (APPLYING_MS,
 * standing in for the backend; the mock store itself answers at once). Meanwhile the form
 * stays, says so, and can't be changed or closed; then the decision lands and the form goes. */

import { useState } from 'react';

/** How long the rule engine takes to apply a decision, in the mock. */
const APPLYING_MS = 900;
import { validate } from '../model/policy';
import type { Rule, RuleAction } from '../model/types';
import { useRulesStore } from './useRulesStore';

export function useDecision(onDone?: (rule: Rule, action: RuleAction, reason: string) => void) {
  const apply = useRulesStore((s) => s.apply);
  const [target, setTarget] = useState<{ rule: Rule; action: RuleAction } | null>(null);
  const [reason, setReason] = useState('');
  const [override, setOverride] = useState(false);
  // Errors only show after the first submit attempt, not while someone is still typing.
  const [attempted, setAttempted] = useState(false);
  // Submitted, and waiting for the rule engine.
  const [applying, setApplying] = useState(false);

  const check = target ? validate(target.rule, target.action, reason, override) : null;

  return {
    target,
    reason,
    setReason,
    override,
    setOverride,
    attempted,
    applying,
    check,
    open(rule: Rule, action: RuleAction) {
      setTarget({ rule, action });
      setReason('');
      setOverride(false);
      setAttempted(false);
      setApplying(false);
    },
    close() {
      if (!applying) setTarget(null);
    },
    submit() {
      if (!target || !check || applying) return false;
      setAttempted(true);
      if (!check.ok) return false;
      setApplying(true);
      const { rule, action } = target;
      setTimeout(() => {
        const updated = apply(rule.id, action, reason, override);
        onDone?.(updated, action, reason);
        setTarget(null);
        setApplying(false);
      }, APPLYING_MS);
      return true;
    },
  };
}

export type Decision = ReturnType<typeof useDecision>;
