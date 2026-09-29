/* The decision form's brain: which rule and action it's for, the reason typed so far,
 * whether the override is confirmed, and submitting. It knows nothing about how the
 * form looks; that's the Composer's job. */

import { useState } from 'react';
import { validate } from '../model/policy';
import type { Rule, RuleAction } from '../model/types';
import { useRulesStore } from './useRulesStore';

export function useDecision(onDone?: (rule: Rule, action: RuleAction) => void) {
  const apply = useRulesStore((s) => s.apply);
  const [target, setTarget] = useState<{ rule: Rule; action: RuleAction } | null>(null);
  const [reason, setReason] = useState('');
  const [override, setOverride] = useState(false);
  // Errors only show after the first submit attempt, not while someone is still typing.
  const [attempted, setAttempted] = useState(false);

  const check = target ? validate(target.rule, target.action, reason, override) : null;

  return {
    target,
    reason,
    setReason,
    override,
    setOverride,
    attempted,
    check,
    open(rule: Rule, action: RuleAction) {
      setTarget({ rule, action });
      setReason('');
      setOverride(false);
      setAttempted(false);
    },
    close() {
      setTarget(null);
    },
    submit() {
      if (!target || !check) return false;
      setAttempted(true);
      if (!check.ok) return false;
      const updated = apply(target.rule.id, target.action, reason, override);
      onDone?.(updated, target.action);
      setTarget(null);
      return true;
    },
  };
}

export type Decision = ReturnType<typeof useDecision>;
