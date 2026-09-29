/* The Approve / Reject / Activate / Deactivate buttons for a rule. Which ones appear
 * comes from the policy, never hard-coded. Used in the action bar, the decision card
 * and the incidents panel. */

import { ACTION_KEY, ACTION_LABEL } from '../../model/labels';
import { actionsFor, turnsOn } from '../../model/policy';
import type { Rule, RuleAction } from '../../model/types';

export function ActionButtons({ rule, onAction }: { rule: Rule; onAction: (action: RuleAction) => void }) {
  return actionsFor(rule).map((action) => (
    <button
      key={action}
      className="mn-btn"
      data-variant={turnsOn(action) ? 'primary' : 'danger'}
      onClick={() => onAction(action)}
    >
      {ACTION_LABEL[action]}
      <kbd>{ACTION_KEY[action]}</kbd>
    </button>
  ));
}
