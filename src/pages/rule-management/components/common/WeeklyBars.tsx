/* A bar chart with no chart library: one div per week, its height a percentage
 * of the busiest week. Every bar can be focused, so keyboard and screen reader
 * users get the numbers too. */

import { useState } from 'react';
import { NOW } from '../../../../lib/clock';
import './WeeklyBars.css';

/** The date a week starts, counting back from this week. */
const weekLabel = (i: number, weeks: number) => {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() - (weeks - 1 - i) * 7);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export function WeeklyBars({ data, height = 72 }: { data: number[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data);
  return (
    <div className="wb">
      <div className="wb-plot" style={{ height }} onPointerLeave={() => setHover(null)}>
        {data.map((value, i) => (
          <div
            key={i}
            className="wb-col"
            tabIndex={0}
            aria-label={`Week of ${weekLabel(i, data.length)}: ${value} incidents`}
            data-hover={hover === i || undefined}
            onPointerEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
          >
            <div
              className="wb-bar"
              data-now={i === data.length - 1 || undefined}
              style={{ height: `${Math.max(2, (value / max) * 100)}%` }}
            />
            {hover === i && (
              // Near the edges the tooltip flips inwards so it's never cut off.
              <div className="wb-tip" data-edge={i > data.length - 4 ? 'end' : i < 3 ? 'start' : undefined}>
                <strong>{value}</strong>
                <span>wk of {weekLabel(i, data.length)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="wb-axis">
        <span>{weekLabel(0, data.length)}</span>
        <span>This week</span>
      </div>
    </div>
  );
}
