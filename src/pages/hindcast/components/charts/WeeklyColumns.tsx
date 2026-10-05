/* Week by week: one stacked column per completed week, with no chart library. Each column is
 * a div whose height is a percentage of the axis; its three segments share that height by
 * flex-grow. Every column can be focused, so the keyboard gets the same tooltip as the mouse. */

import { useState } from 'react';
import { num, pct } from '../../../../lib/format';
import { OUTCOMES, caught, share, total } from '../../model/labels';
import type { WeekPoint } from '../../model/types';
import { Tip, splitRows } from './Tip';

/** "3 Aug" */
export const dayMonth = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** A round step that gives about three intervals: 270 → 100, so the axis reads 0 · 100 · 200 · 300. */
function axis(max: number) {
  const rough = Math.max(1, max / 3);
  const power = 10 ** Math.floor(Math.log10(rough));
  const f = rough / power;
  const step = Math.max(1, (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * power);
  const top = Math.max(step, Math.ceil(max / step) * step);
  return { top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step) };
}

export function WeeklyColumns({ weeks }: { weeks: WeekPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const { top, ticks } = axis(Math.max(...weeks.map((w) => total(w.split))));
  // With room, every week gets its date. Past twelve, only the first week of each month does
  // (and the very first week, unless the next one starts a month and would sit on top of it).
  const month = (i: number) => weeks[i]?.start.slice(5, 7);
  const labelled = (i: number) => weeks.length <= 12 || (i === 0 ? month(1) === month(0) : month(i) !== month(i - 1));

  return (
    <div className="hc-cols">
      <div className="hc-cols-plot" onPointerLeave={() => setHover(null)}>
        {ticks.map((tick) => (
          <div key={tick} className="hc-cols-tick" style={{ bottom: `${(tick / top) * 100}%` }} aria-hidden>
            <span>{num(tick)}</span>
          </div>
        ))}
        <div className="hc-cols-bars">
          {weeks.map((week, i) => {
            const sum = total(week.split);
            return (
              <div
                key={week.start}
                className="hc-col"
                tabIndex={0}
                aria-label={`Week of ${dayMonth(week.start)}: ${num(sum)} cancelled, ${num(caught(week.split))} would have been caught`}
                data-hover={hover === i || undefined}
                onPointerEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              >
                <div className="hc-col-stack" style={{ height: `${(sum / top) * 100}%` }}>
                  {OUTCOMES.map((o) => week.split[o] > 0 && <span key={o} data-outcome={o} style={{ flexGrow: week.split[o] }} />)}
                </div>
                {hover === i && (
                  <Tip
                    title={`Week of ${dayMonth(week.start)}`}
                    rows={splitRows(week.split)}
                    foot={`${num(sum)} cancelled · ${pct(share(caught(week.split), sum))} caught`}
                    edge={i >= weeks.length / 2 ? 'end' : undefined}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="hc-cols-x" aria-hidden>
        {weeks.map((week, i) => (
          <span key={week.start}>{labelled(i) && <em>{dayMonth(week.start)}</em>}</span>
        ))}
      </div>
    </div>
  );
}
