/* Week by week, two charts on one time axis: tickets stacked by what became of them, and under
 * it the median time to resolve. Two measures, two charts; never two scales on one.
 *
 * One row of hit slots runs over both, so hovering a week lights it in both and the tooltip
 * carries every figure for it. Each slot can be focused, so the keyboard gets it too. */

import { useState, type CSSProperties } from 'react';
import { num } from '../../../../lib/format';
import { useSize } from '../../hooks/useSize';
import { OUTCOME_LABEL, OUTCOMES, dayMonth, monthName, niceAxis, span } from '../../model/labels';
import type { WeekRow } from '../../model/types';
import { Tip } from './Tip';

export const OUTCOME_TONE = { incident: 'var(--tone-1)', worked: 'var(--tone-2)', cancelled: 'var(--tone-4)' } as const;

/** Which weeks get a date under them: every other one when there's room, else each new month. */
export function labelled(starts: string[]) {
  return starts.map((s, i) => (starts.length <= 14 ? i % 2 === 0 : i === 0 ? false : s.slice(5, 7) !== starts[i - 1].slice(5, 7)));
}

export function VolumeChart({ weeks }: { weeks: WeekRow[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [plotRef, plot] = useSize<HTMLDivElement>();
  const [subRef, sub] = useSize<HTMLDivElement>();
  const { top, ticks } = niceAxis(Math.max(1, ...weeks.map((w) => w.total)), 3);
  const medians = weeks.map((w) => w.medianMins);
  const subAxis = niceAxis(Math.max(60, ...medians.map((m) => m ?? 0)), 2);
  const show = labelled(weeks.map((w) => w.start));
  const n = weeks.length;

  // The median line, in the sub chart's own pixels.
  const sx = (i: number) => ((i + 0.5) / n) * sub.width;
  const sy = (m: number) => sub.height - (m / subAxis.top) * (sub.height - 4);
  const line = medians
    .map((m, i) => (m === null ? null : `${sx(i).toFixed(1)},${sy(m).toFixed(1)}`))
    .filter(Boolean)
    .join(' L');
  const last = medians.length - 1;
  const week = hover === null ? null : weeks[hover];

  return (
    <div className="ol-vol">
      <div className="ol-vol-plot" ref={plotRef} onPointerLeave={() => setHover(null)}>
        <div className="ol-vol-bars">
          {ticks.map((tick) => (
            <div key={tick} className="ol-grid-line" style={{ bottom: `${(tick / top) * 100}%` }} aria-hidden>
              <span>{num(tick)}</span>
            </div>
          ))}
          <div className="ol-cols">
            {weeks.map((w, i) => (
              <div key={w.start} className="ol-col" data-hover={hover === i || undefined}>
                <div className="ol-col-stack ol-grow" style={{ height: `${(w.total / top) * 100}%`, '--i': i } as CSSProperties}>
                  {OUTCOMES.map((o) => w[o] > 0 && <span key={o} style={{ flexGrow: w[o], background: OUTCOME_TONE[o] }} />)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ol-vol-sub">
          <div className="ol-vol-sub-label">Median time to resolve</div>
          <div className="ol-vol-sub-plot" ref={subRef}>
            {subAxis.ticks.map((tick) => (
              <div key={tick} className="ol-grid-line" style={{ bottom: `${(tick / subAxis.top) * 100}%` }} aria-hidden>
                <span>{tick === 0 ? '0' : span(tick).replace(' 0m', '')}</span>
              </div>
            ))}
            {sub.width > 0 && (
              <svg className="ol-svg ol-wipe" width={sub.width} height={sub.height} aria-hidden>
                {hover !== null && <line className="ol-cross" x1={sx(hover)} x2={sx(hover)} y1={0} y2={sub.height} />}
                <path d={`M${line}`} className="ol-line" data-tone="2" />
                {medians[last] !== null && <circle cx={sx(last)} cy={sy(medians[last]!)} r={3.5} className="ol-dot" data-tone="2" />}
                {hover !== null && medians[hover] !== null && <circle cx={sx(hover)} cy={sy(medians[hover]!)} r={4} className="ol-dot" data-tone="1" />}
              </svg>
            )}
          </div>
        </div>

        <div className="ol-hits" role="list" aria-label="Weeks">
          {weeks.map((w, i) => (
            <div
              key={w.start}
              role="listitem"
              tabIndex={0}
              className="ol-hit"
              aria-label={`Week of ${dayMonth(w.start)}: ${num(w.total)} tickets, ${num(w.incident)} became incidents${w.medianMins ? `, median ${span(w.medianMins)} to resolve` : ''}`}
              onPointerEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
            />
          ))}
        </div>

        {week && plot.width > 0 && (
          <Tip
            x={((hover! + 0.5) / n) * (plot.width - 40) + 40}
            y={8}
            flip={hover! > n / 2}
            title={`Week of ${dayMonth(week.start)}`}
            rows={[
              ...OUTCOMES.map((o) => ({ tone: OUTCOME_TONE[o], value: num(week[o]), label: OUTCOME_LABEL[o] })),
              { value: week.medianMins ? span(week.medianMins) : '–', label: 'Median to resolve' },
            ]}
            foot={`${num(week.total)} tickets`}
          />
        )}
      </div>

      <div className="ol-x" aria-hidden>
        {weeks.map((w, i) => (
          <span key={w.start}>{show[i] && <em>{n <= 14 ? dayMonth(w.start) : monthName(w.start)}</em>}</span>
        ))}
      </div>
    </div>
  );
}

export function VolumeTable({ weeks }: { weeks: WeekRow[] }) {
  return (
    <table className="ol-table">
      <thead>
        <tr>
          <th>Week of</th>
          <th>Incidents</th>
          <th>Worked</th>
          <th>Cancelled</th>
          <th>Total</th>
          <th>Median to resolve</th>
        </tr>
      </thead>
      <tbody>
        {[...weeks].reverse().map((w) => (
          <tr key={w.start}>
            <th>{dayMonth(w.start)}</th>
            <td>{num(w.incident)}</td>
            <td>{num(w.worked)}</td>
            <td>{num(w.cancelled)}</td>
            <td>{num(w.total)}</td>
            <td>{w.medianMins ? span(w.medianMins) : '–'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
