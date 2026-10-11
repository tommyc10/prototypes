/* The bar that stays at the top of the detail pane: the pane toggles and the time it is now. */

import type { ReactNode } from 'react';
import type { Sample } from '../../model/types';
import { dayLabel, hourLabel } from '../../model/windows';
import './WindowsBar.css';

export function WindowsBar({
  toolbar,
  now,
  sample,
  onSample,
}: {
  /** Buttons at the start of the bar (the sidebar and list toggles). */
  toolbar?: ReactNode;
  now: number;
  /** Prototype only: which made-up estate to show. The real page has one, the real one. */
  sample: Sample;
  onSample: (sample: Sample) => void;
}) {
  return (
    <div className="cw-top">
      {toolbar}
      <div className="cw-clock">
        {dayLabel(now)} <span className="mn-mono">{hourLabel(now)}</span>
      </div>
      <div className="cw-range" role="radiogroup" aria-label="Sample data">
        <span className="mn-subtle cw-range-label">Sample data</span>
        <div className="mn-tabs">
          {(['tidy', 'busy'] as const).map((option) => (
            <button key={option} role="radio" aria-checked={sample === option} className="mn-tab" data-active={sample === option || undefined} onClick={() => onSample(option)}>
              {option === 'tidy' ? 'Tidy' : 'Busy'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
