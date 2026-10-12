/* The confirmation after a suggestion is proposed or dismissed. Same toast as a decision
 * (see DecisionToast), with one way back: view the new rule, or undo the dismissal. */

import { Check } from 'lucide-react';
import './DecisionToast.css';

export function SuggestionToast({ title, sub, action, onAction }: { title: string; sub: string; action: string; onAction: () => void }) {
  return (
    <div className="mn-toast">
      <span className="mn-toast-icon">
        <Check size={13} strokeWidth={2.5} />
      </span>
      <div className="mn-toast-text">
        <div className="mn-toast-title">{title}</div>
        <div className="mn-toast-sub">{sub}</div>
      </div>
      <button className="mn-link" onClick={onAction}>
        {action}
      </button>
    </div>
  );
}
