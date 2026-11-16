/* Tickets closed by hand, week by week, stacked by what today's logic says: explained at the
 * base (the one status colour), then unknown, then not explained on top, brightest, because
 * that's what someone tuning wants to see grow or shrink.
 *
 * Drag across the weeks to narrow the ticket list to them; a click picks one week; Esc lets
 * go. Hovering shows the week's figures. The bars morph when the scope changes, keyed by
 * week, so a longer lookback slides older weeks in (hooks/useTween). */

import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { num } from '../../../../lib/format';
import { Tip } from '../charts/Tip';
import { useSize } from '../../hooks/useSize';
import { slots, useTweenedSeries } from '../../hooks/useTween';
import { dayMonth, monthName, niceAxis } from '../../model/labels';
import type { WeekVerdicts } from '../../model/replay';

export type WeekRange = [number, number];

const STACK = ['explained', 'unknown', 'unexplained'] as const;
const TONE: Record<(typeof STACK)[number], string> = { explained: 'caught', unknown: 'hatch', unexplained: 'tone-2' };
const LABEL: Record<(typeof STACK)[number], string> = { explained: 'Would be explained', unknown: 'Unknown', unexplained: 'Not explained' };
const TIP_TONE: Record<(typeof STACK)[number], string> = { explained: 'var(--green)', unknown: 'var(--tone-3)', unexplained: 'var(--tone-2)' };

export function WeekChart({ weeks, range, onRange }: { weeks: WeekVerdicts[]; range: WeekRange | null; onRange: (r: WeekRange | null) => void }) {
  const frames = useTweenedSeries(weeks.map((w) => ({ key: w.start, values: { explained: w.explained, unknown: w.unknown, unexplained: w.unexplained } })));
  const places = slots(frames);
  const max = Math.max(1, ...frames.map((f) => (f.values.explained + f.values.unknown + f.values.unexplained) * f.presence));
  const axis = niceAxis(max, 3);
  const [plotRef, size] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const drag = useRef<{ from: number; moved: boolean } | null>(null);
  const [live, setLive] = useState<WeekRange | null>(null);

  const indexAt = (e: PointerEvent) => {
    const box = plotRef.current!.getBoundingClientRect();
    const x = Math.min(0.9999, Math.max(0, (e.clientX - box.left) / box.width));
    return Math.min(weeks.length - 1, Math.floor(x * weeks.length));
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const i = indexAt(e);
    drag.current = { from: i, moved: false };
    setLive([i, i]);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const i = indexAt(e);
    setHover(i);
    if (!drag.current) return;
    if (i !== drag.current.from) drag.current.moved = true;
    setLive([Math.min(drag.current.from, i), Math.max(drag.current.from, i)]);
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || !live) return;
    const same = range && range[0] === live[0] && range[1] === live[1];
    onRange(same && !d.moved ? null : live);
    setLive(null);
  };

  const shownRange = live ?? range;
  const inRange = (i: number) => !shownRange || (i >= shownRange[0] && i <= shownRange[1]);
  const h = (v: number) => `${(v / axis.top) * 100}%`;
  const hovered = hover !== null ? weeks[hover] : null;
  // A label where each month starts. The first week's month only gets one if its own month runs
  // on for three weeks or more, so two labels never sit on top of each other.
  const starts = weeks.map((w, i) => i > 0 && monthName(w.start) !== monthName(weeks[i - 1].start));
  const firstTurn = starts.indexOf(true);
  const months = weeks.map((w, i) => (starts[i] || (i === 0 && (firstTurn < 0 || firstTurn >= 3)) ? monthName(w.start) : null));

  return (
    <div className="ol-weeks">
      <div className="ol-weeks-axis" aria-hidden>
        {axis.ticks
          .slice()
          .reverse()
          .map((t) => (
            <span key={t} style={{ bottom: h(t) } as CSSProperties}>
              {num(t)}
            </span>
          ))}
      </div>
      <div
        ref={plotRef}
        className="ol-weeks-plot"
        data-brushing={live ? '' : undefined}
        role="slider"
        tabIndex={-1}
        aria-label="Drag across weeks to narrow the tickets"
        aria-valuemin={0}
        aria-valuemax={weeks.length - 1}
        aria-valuenow={range?.[0] ?? 0}
        aria-valuetext={range ? `${dayMonth(weeks[range[0]].start)} to ${dayMonth(weeks[range[1]].start)}` : 'All weeks'}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => {
          drag.current = null;
          setLive(null);
        }}
        onPointerLeave={() => setHover(null)}
      >
        {axis.ticks.map((t) => (
          <i key={t} className="ol-weeks-grid" data-base={t === 0 || undefined} style={{ bottom: h(t) } as CSSProperties} />
        ))}
        {frames.map((f, i) => (
          <div
            key={f.key}
            className="ol-week"
            data-out={!inRange(i) || undefined}
            data-hover={hover === i || undefined}
            style={{ left: `${(places[i].centre - places[i].width / 2) * 100}%`, width: `${places[i].width * 100}%`, '--i': i } as CSSProperties}
          >
            <div className="ol-week-stack ol-grow">
              {STACK.map((k) => (
                <i key={k} data-tone={TONE[k]} style={{ height: h(f.values[k] * f.presence) }} />
              ))}
            </div>
          </div>
        ))}
        {shownRange && (
          <div
            className="ol-brush"
            aria-hidden
            style={{ left: `${(shownRange[0] / weeks.length) * 100}%`, width: `${((shownRange[1] - shownRange[0] + 1) / weeks.length) * 100}%` } as CSSProperties}
          />
        )}
        {hovered && hover !== null && size.width > 0 && !live && (
          <Tip
            x={((hover + 0.5) / weeks.length) * size.width}
            y={8}
            flip={hover > weeks.length / 2}
            title={`Week of ${dayMonth(hovered.start)}`}
            rows={[...STACK].reverse().map((k) => ({ tone: TIP_TONE[k], value: num(hovered[k]), label: LABEL[k] }))}
            foot={`${num(hovered.total)} closed by hand`}
          />
        )}
      </div>
      <div className="ol-weeks-x" aria-hidden>
        {months.map((m, i) =>
          m ? (
            <span key={weeks[i].start} style={{ left: `${(i / weeks.length) * 100}%` } as CSSProperties}>
              {m}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}

export function WeekTable({ weeks }: { weeks: WeekVerdicts[] }) {
  return (
    <table className="ol-table">
      <thead>
        <tr>
          <th>Week of</th>
          <th>Explained</th>
          <th>Not explained</th>
          <th>Unknown</th>
          <th>Closed by hand</th>
        </tr>
      </thead>
      <tbody>
        {weeks.map((w) => (
          <tr key={w.start}>
            <th>{dayMonth(w.start)}</th>
            <td>{num(w.explained)}</td>
            <td>{num(w.unexplained)}</td>
            <td>{num(w.unknown)}</td>
            <td>{num(w.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
