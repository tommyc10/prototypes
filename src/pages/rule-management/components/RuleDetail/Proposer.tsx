/* Who proposed the rule. The rule engine gets a bot icon; a person gets their initials. */

import { Bot } from 'lucide-react';
import { ago } from '../../../../lib/format';
import type { Rule } from '../../model/types';
import './Proposer.css';

/** "TK-421" → "T4", "Grand Moff Tarkin" → "MT" */
const initials = (name: string) =>
  name
    .split(/[\s.-]+/)
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

export function Proposer({ rule }: { rule: Rule }) {
  const human = rule.source === 'operator';
  const name = human ? rule.sourceDetail.replace(/^Suggested by /, '') : rule.sourceDetail;
  return (
    <div className="mn-proposer">
      <span className="mn-proposer-avatar" aria-hidden="true">
        {human ? initials(name) : <Bot size={16} />}
      </span>
      <div className="mn-proposer-text">
        <div className="mn-proposer-name">{name}</div>
        <div className="mn-subtle">
          {human ? 'Operator' : 'Rule engine'} · proposed {ago(rule.createdAt)}
        </div>
      </div>
    </div>
  );
}
