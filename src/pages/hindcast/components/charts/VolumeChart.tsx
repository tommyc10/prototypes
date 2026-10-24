/* Week by week, two charts on one time axis: tickets stacked by what became of them, and under
 * it the median time to resolve. Two measures, two charts; never two scales on one.
 *
 * One row of hit slots runs over both, so hovering a week lights it in both and the tooltip
 * carries every figure for it. Each slot can be focused, so the keyboard gets it too.
 *
 * When the scope changes the chart morphs rather than redraws: bars grow and shrink, the
 * median line reshapes, the axis glides, and weeks that come into the lookback open up room
 * from the left while weeks that leave close it (hooks/useTween). */

import { useState, type CSSProperties } from 'react';
import { num } from '../../../../lib/format';
import { useSize } from '../../hooks/useSize';
import { slots, useTweenedNumbers, useTweenedSeries } from '../../hooks/useTween';
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

  // The figures on screen morph to the new ones when the scope changes: weeks line up by their
  // start date, so a longer lookback slides older weeks in from the left (hooks/useTween).
  const frames = useTweenedSeries(
    weeks.map((w) => ({ key: w.start, values: { incident: w.incident, worked: w.worked, cancelled: w.cancelled, median: w.medianMins ?? Number.NaN } })),
  );
  const axis = niceAxis(Math.max(1, ...weeks.map((w) => w.total)), 3);
  const subAxis = niceAxis(Math.max(60, ...weeks.map((w) => w.medianMins ?? 0)), 2);
  const { top, subTop } = useTweenedNumbers({ top: axis.top, subTop: subAxis.top });
  const place = slots(frames);
  const show = labelled(frames.map((f) => f.key));
  const many = weeks.length > 14;

  // The median line, in the sub chart's own pixels, through each week's centre.
  const sx = (i: number) => place[i].centre * sub.width;
  const sy = (m: number) => sub.height - (m / subTop) * (sub.height - 4);
  const line = frames
    .map((f, i) => (Number.isNaN(f.values.median) ? null : `${sx(i).toFixed(1)},${sy(f.values.median).toFixed(1)}`))
    .filter(Boolean)
    .join(' L');
  const last = frames.length - 1;
  // The tooltip reads the real figures, never the in-between ones.
  const week = hover === null ? null : (weeks.find((w) => w.start === frames[hover]?.key) ?? null);
  const visible = (tick: number, max: number) => tick <= max * 1.001;

  return (
    <div className="ol-vol">
      <div className="ol-vol-plot" ref={plotRef} onPointerLeave={() => setHover(null)}>
        <div className="ol-vol-bars">
          {axis.ticks.filter((tick) => visible(tick, top)).map((tick) => (
            <div key={tick} className="ol-grid-line" style={{ bottom: `${(tick / top) * 100}%` }} aria-hidden>
              <span>{num(tick)}</span>
            </div>
          ))}
          <div className="ol-cols">
            {frames.map((f, i) => {
              const total = f.values.incident + f.values.worked + f.values.cancelled;
              return (
                <div key={f.key} className="ol-col" data-hover={hover === i || undefined} style={{ flexGrow: f.presence }}>
                  <div className="ol-col-stack ol-grow" style={{ height: `${(total / top) * 100}%`, '--i': i } as CSSProperties}>
                    {OUTCOMES.map((o) => f.values[o] > 0.05 && <span key={o} style={{ flexGrow: f.values[o], background: OUTCOME_TONE[o] }} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ol-vol-sub">
          <div className="ol-vol-sub-label">Median time to resolve</div>
          <div className="ol-vol-sub-plot" ref={subRef}>
            {subAxis.ticks.filter((tick) => visible(tick, subTop)).map((tick) => (
              <div key={tick} className="ol-grid-line" style={{ bottom: `${(tick / subTop) * 100}%` }} aria-hidden>
                <span>{tick === 0 ? '0' : span(tick).replace(' 0m', '')}</span>
              </div>
            ))}
            {sub.width > 0 && frames.length > 0 && (
              <svg className="ol-svg ol-wipe" width={sub.width} height={sub.height} aria-hidden>
                {hover !== null && <line className="ol-cross" x1={sx(hover)} x2={sx(hover)} y1={0} y2={sub.height} />}
                {line && <path d={`M${line}`} className="ol-line" data-tone="2" />}
                {!Number.isNaN(frames[last].values.median) && <circle cx={sx(last)} cy={sy(frames[last].values.median)} r={3.5} className="ol-dot" data-tone="2" />}
                {hover !== null && !Number.isNaN(frames[hover].values.median) && (
                  <circle cx={sx(hover)} cy={sy(frames[hover].values.median)} r={4} className="ol-dot" data-tone="1" />
                )}
              </svg>
            )}
          </div>
        </div>

        <div className="ol-hits" role="list" aria-label="Weeks">
          {frames.map((f, i) => {
            const w = weeks.find((x) => x.start === f.key);
            return (
              <div
                key={f.key}
                role="listitem"
                tabIndex={w ? 0 : -1}
                className="ol-hit"
                style={{ flexGrow: f.presence }}
                aria-label={w ? `Week of ${dayMonth(w.start)}: ${num(w.total)} tickets, ${num(w.incident)} became incidents${w.medianMins ? `, median ${span(w.medianMins)} to resolve` : ''}` : undefined}
                onPointerEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              />
            );
          })}
        </div>

        {week && hover !== null && plot.width > 0 && (
          <Tip
            x={place[hover].centre * (plot.width - 40) + 40}
            y={8}
            flip={place[hover].centre > 0.5}
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
        {frames.map((f, i) => (
          <span key={f.key} style={{ flexGrow: f.presence, opacity: f.presence }}>
            {show[i] && <em>{many ? monthName(f.key) : dayMonth(f.key)}</em>}
          </span>
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
