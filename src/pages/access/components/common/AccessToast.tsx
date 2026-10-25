/* The confirmation after an invitation, a save or a removal. sonner decides when it shows;
 * this is what it looks like: the app's toast, with Undo when there's something to undo. */

import { Check } from 'lucide-react';
import '../../../rule-management/components/common/DecisionToast.css';

export function AccessToast({ title, sub, onUndo }: { title: string; sub: string; onUndo?: () => void }) {
  return (
    <div className="mn-toast">
      <span className="mn-toast-icon">
        <Check size={13} strokeWidth={2.5} />
      </span>
      <div className="mn-toast-text">
        <div className="mn-toast-title">{title}</div>
        <div className="mn-toast-sub">{sub}</div>
      </div>
      {onUndo && (
        <button className="mn-link" onClick={onUndo}>
          Undo
        </button>
      )}
    </div>
  );
}
