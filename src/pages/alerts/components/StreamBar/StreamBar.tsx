/* The bar that stays at the top: the pane toggles, whether the stream is live or rewound
 * (and to when), the preview switch, and pause. */

import { useEffect, useState, type ReactNode } from 'react';
import { Pause, Play } from 'lucide-react';
import './StreamBar.css';

const clockFace = (ms: number) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export function StreamBar({
  toolbar,
  clock,
  playhead,
  preview,
  proposedCount,
  onPreview,
  onLive,
  onPause,
}: {
  /** Buttons at the start of the bar (the sidebar and list toggles). */
  toolbar?: ReactNode;
  clock: () => number;
  /** Where the stream is rewound to, or null when it's live. */
  playhead: number | null;
  preview: boolean;
  proposedCount: number;
  onPreview: () => void;
  onLive: () => void;
  onPause: () => void;
}) {
  const live = playhead === null;
  return (
    <div className="al-top">
      {toolbar}
      <div className="al-status" data-live={live || undefined} aria-live="off">
        <i aria-hidden />
        {live ? 'Live' : 'Rewound to'}
        <span className="mn-mono">{live ? <Ticking clock={clock} /> : clockFace(playhead)}</span>
      </div>

      <button
        className="al-switch"
        role="switch"
        aria-checked={preview}
        onClick={onPreview}
        disabled={proposedCount === 0}
        data-tour="al-preview"
        title="See what the proposed rules would hide  P"
      >
        <span className="al-switch-track" aria-hidden>
          <span />
        </span>
        Preview{' '}
        <span className="al-long">
          {proposedCount} proposed {proposedCount === 1 ? 'rule' : 'rules'}
        </span>
        <kbd>P</kbd>
      </button>

      <button className="mn-btn" onClick={live ? onPause : onLive} aria-label={live ? 'Pause' : 'Go live'} title={live ? 'Pause  Space' : 'Back to live  Space'}>
        {live ? <Pause size={13} /> : <Play size={13} />}
        <span className="al-long">{live ? 'Pause' : 'Go live'}</span>
        <kbd>Space</kbd>
      </button>
    </div>
  );
}

/** The live clock. It ticks by itself, so the rest of the page doesn't re-render every second. */
function Ticking({ clock }: { clock: () => number }) {
  const [now, setNow] = useState(clock);
  useEffect(() => {
    const timer = setInterval(() => setNow(clock()), 500);
    return () => clearInterval(timer);
  }, [clock]);
  return clockFace(now);
}
