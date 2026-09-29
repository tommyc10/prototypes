/* The confirmation shown after a decision. sonner handles when it appears and
 * disappears; this component is only what it looks like. */

import { Check } from 'lucide-react';
import { ACTION_PAST } from '../../model/policy';
import type { Rule, RuleAction } from '../../model/types';
import './DecisionToast.css';

export function DecisionToast({ rule, action }: { rule: Rule; action: RuleAction }) {
  return (
    <div className="mn-toast">
      <span className="mn-toast-icon">
        <Check size={13} strokeWidth={2.5} />
      </span>
      <div>
        <div className="mn-toast-title">
          {rule.id} {ACTION_PAST[action]}
        </div>
        <div className="mn-toast-sub">Reason recorded in the audit log</div>
      </div>
    </div>
  );
}
