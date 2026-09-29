/* The card at the top of the rail: who proposed the rule, what it's doing now, and the
 * buttons to change that. When a decision starts, the Composer takes this card's place. */

import { AlertTriangle } from 'lucide-react';
import { pct } from '../../../../lib/format';
import { groupById } from '../../data/mockData';
import { LOW_CONFIDENCE, isLowConfidence } from '../../model/policy';
import type { Rule, RuleAction } from '../../model/types';
import { ActionButtons } from '../common/ActionButtons';
import { Proposer } from './Proposer';
import './DecisionCard.css';

/** One sentence on what the rule is doing right now. */
function currentEffect(rule: Rule) {
  const group = groupById(rule.groupId).name;
  if (rule.status === 'proposed') {
    const by = rule.source === 'operator' ? 'Suggested by an operator' : 'Proposed by the rule engine';
    return `${by}. Nothing is suppressed until a person approves it.`;
  }
  if (rule.status === 'active') return `Suppressing matching incidents for ${group}.`;
  return `Not suppressing. Matching incidents page ${group}.`;
}

export function DecisionCard({ rule, onAction }: { rule: Rule; onAction: (action: RuleAction) => void }) {
  return (
    <div className="mn-decide">
      <Proposer rule={rule} />
      <div className="mn-decide-title">Decision</div>
      <p>{currentEffect(rule)}</p>
      <div className="mn-decide-actions">
        <ActionButtons rule={rule} onAction={onAction} />
      </div>
      {isLowConfidence(rule) && rule.status !== 'active' && (
        <p className="mn-decide-note">
          <AlertTriangle size={13} /> Below {pct(LOW_CONFIDENCE)} confidence. Activating needs an override.
        </p>
      )}
      <p className="mn-decide-foot">Every change needs a written reason.</p>
    </div>
  );
}
