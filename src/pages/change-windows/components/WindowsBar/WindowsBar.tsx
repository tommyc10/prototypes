/* The bar that stays at the top: the pane toggles, the time it is now, and how much time
 * the schedule shows. */

import type { ReactNode } from 'react';
import type { Range, Sample } from '../../model/types';
import { RANGES, dayLabel, hourLabel } from '../../model/windows';
import './WindowsBar.css';

export function WindowsBar({
  toolbar,
  now,
  range,
  onRange,
  sample,
  onSample,
}: {
  /** Buttons at the start of the bar (the sidebar and list toggles). */
  toolbar?: ReactNode;
  now: number;
  range: Range;
  onRange: (range: Range) => void;
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
            <button
              key={option}
              role="radio"
              aria-checked={sample === option}
              className="mn-tab"
              data-active={sample === option || undefined}
              onClick={() => onSample(option)}
            >
              {option === 'tidy' ? 'Tidy' : 'Busy'}
            </button>
          ))}
        </div>
      </div>
      <div className="cw-range" role="radiogroup" aria-label="How much time the schedule shows" data-tour="cw-range">
        <span className="mn-subtle cw-range-label">Schedule</span>
        <div className="mn-tabs">
          {RANGES.map((option) => (
            <button
              key={option.hours}
              role="radio"
              aria-checked={range === option.hours}
              className="mn-tab"
              data-active={range === option.hours || undefined}
              onClick={() => onRange(option.hours)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
