/* Hold to confirm: a slow, deliberate confirmation for a risky action.
 * The 2-second timer is the truth; the CSS fill (same 2 seconds) is only the picture of it. */

import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import './HoldButton.css';

export function HoldButton({ done, onDone }: { done: boolean; onDone: () => void }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number>(undefined);

  const start = () => {
    if (done) return;
    setHolding(true);
    timer.current = window.setTimeout(() => {
      setHolding(false);
      onDone();
    }, 2000);
  };
  const stop = () => {
    clearTimeout(timer.current);
    setHolding(false);
  };
  useEffect(() => () => clearTimeout(timer.current), []); // no timer left running after unmount

  const label = done ? 'Override confirmed' : 'Hold to override';
  return (
    <button
      type="button"
      className="mn-hold"
      data-holding={holding || undefined}
      data-done={done || undefined}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onKeyDown={(e) => {
        // e.repeat: a held key fires keydown again and again; only the first one starts the timer.
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && stop()}
      aria-label={done ? 'Override confirmed' : 'Hold for two seconds to confirm the override'}
    >
      <span className="mn-hold-label">
        {done && <Check size={13} strokeWidth={2.5} />}
        {label}
      </span>
      {/* A solid copy of the button on top, revealed left to right while you hold. */}
      <span className="mn-hold-fill" aria-hidden>
        <span className="mn-hold-label">{label}</span>
      </span>
    </button>
  );
}
