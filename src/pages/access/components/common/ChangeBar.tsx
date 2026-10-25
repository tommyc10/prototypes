/* The glass bar that floats over the pane while there's something to save: what the change
 * amounts to, in one sentence, then a way out and the one white button. */

import type { ReactNode } from 'react';
import { CornerDownLeft } from 'lucide-react';

export function ChangeBar({
  children,
  cancel,
  onCancel,
  submit,
  onSubmit,
  ready,
}: {
  /** The sentence: what saving would do, or what's still needed. */
  children: ReactNode;
  cancel: string;
  onCancel: () => void;
  submit: string;
  onSubmit: () => void;
  /** Whether it can be saved yet. */
  ready: boolean;
}) {
  return (
    <div className="ac-bar" role="region" aria-label="Changes not saved yet">
      <span className="ac-bar-note" aria-live="polite">
        {children}
      </span>
      <button type="button" className="mn-btn mn-btn-ghost" onClick={onCancel}>
        {cancel}
      </button>
      <button type="button" className="mn-btn" data-variant="primary" onClick={onSubmit} disabled={!ready}>
        {submit}
        <kbd>
          ⌘<CornerDownLeft size={11} />
        </kbd>
      </button>
    </div>
  );
}
