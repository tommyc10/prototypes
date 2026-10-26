/* The Halloween card: Tesla's "Trick or Treat" card, in the announcement row above every page.
 * A lantern, a sentence that says what changes (and what doesn't), and the switch.
 *
 * It shows through the season until it's dismissed, then the usual announcement comes back.
 * After that the switch lives in ⌘K. */

import { useState } from 'react';
import { X } from 'lucide-react';
import { inSeason, setHalloween, useHalloween } from '../../hooks/useHalloween';
import { Lantern } from './Creatures';
import './HalloweenCard.css';

const DISMISSED_KEY = `mn-halloween-card-dismissed-${new Date().getFullYear()}`;

/** Whether the card has the announcement row this season, and how to give it back. */
export function useHalloweenCard() {
  const [shown, setShown] = useState(() => inSeason() && localStorage.getItem(DISMISSED_KEY) !== 'true');
  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setShown(false);
  };
  return { shown, dismiss };
}

export function HalloweenCard({ onDismiss }: { onDismiss: () => void }) {
  const on = useHalloween();

  return (
    <aside className="hw-card" aria-label="Halloween mode" data-own-keys>
      <span className="hw-card-thumb">
        <Lantern />
      </span>
      <p className="hw-card-copy">
        <strong id="hw-card-title">{on ? 'Halloween mode is on' : 'Halloween mode'}</strong>
        <span>
          {on
            ? 'Until 1 November. Status colours haven’t changed. Turn it off here or from ⌘K.'
            : 'A moonlit night and a ghost for a logo, until 1 November. Status colours stay as they are.'}
        </span>
      </p>
      <button className="hw-switch" role="switch" aria-checked={on} aria-labelledby="hw-card-title" onClick={() => setHalloween(!on)}>
        <span />
      </button>
      <button className="mn-icon-btn hw-card-dismiss" type="button" aria-label="Dismiss the Halloween card" title="Dismiss" onClick={onDismiss}>
        <X size={15} aria-hidden />
      </button>
    </aside>
  );
}
