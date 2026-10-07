/* The schedule: every window in the chosen stretch of time, as a bar on a timeline.
 * One row per assignment group, time left to right, and a line at now.
 *
 *   solid bar      in place now
 *   orange tail    the part past its planned end: it's overrunning
 *   outlined bar   approved, not started
 *   faint bar      ended
 *
 * A bar long enough to hold its name has it written inside; a shorter one has it underneath,
 * so a ten-minute window is as readable as a two-day one. Two windows for the same group at
 * the same time get a line each inside the group's row.
 *
 * The bars are ordinary buttons placed with left and width in pixels, worked out from the
 * plot's own width (measured off the time axis, because the sidebar and list beside the
 * chart can be hidden).
 * The window list beside the chart is the same windows as text. */

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { groupById } from '../../../rule-management/data/mockData';
import type { ChangeWindow, Range } from '../../model/types';
import { HOUR, STATUS_LABEL, dayLabel, endOf, hourLabel, rangeOf, statusOf, timing, when } from '../../model/windows';
import './Schedule.css';

/** How tall a line of bars is: just the bars, or the bars with names underneath. */
const LANE_INSIDE = 28;
const LANE_UNDER = 44;

interface Placed {
  window: ChangeWindow;
  lane: number;
  /** The bar, in pixels from the left of the plot. */
  x: number;
  width: number;
  /** How much of the bar is past the planned end. */
  overrun: number;
  /** The bar carries on past the edge of the plot. */
  cutStart: boolean;
  cutEnd: boolean;
  /** The bar is long enough to have its name written inside it. */
  inside: boolean;
  /** The name is anchored to the bar's right end, because there's no room after its start. */
  flip: boolean;
  /** Everything it takes up, bar and name, from left to right. */
  extent: [number, number];
}

/** Roughly how wide a name is drawn, to keep names in one row from overlapping. */
const nameWidth = (name: string) => name.length * 6.4 + 14;

export function Schedule({
  windows,
  now,
  range,
  selectedKey,
  onSelect,
}: {
  windows: ChangeWindow[];
  now: number;
  range: Range;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  const plotRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<string | null>(null);

  useLayoutEffect(() => {
    const el = plotRef.current!;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const { from, to } = rangeOf(range, now);
  const xOf = (ms: number) => ((ms - from) / (to - from)) * width;

  // Group the windows in view, then give each one a line in its group's row where neither
  // its bar nor its name runs into the one before it.
  const rows = useMemo(() => {
    const groups = new Map<string, Placed[]>();
    const inView = windows.filter((w) => w.start < to && endOf(w, now) > from).sort((a, b) => a.start - b.start);
    for (const window of inView) {
      const end = endOf(window, now);
      const x = Math.max(0, xOf(window.start));
      const right = Math.min(width, xOf(end));
      const barWidth = Math.max(4, right - x);
      const label = nameWidth(window.name);
      const inside = barWidth >= label + 6;
      const flip = !inside && x + label > width && right - label >= 0;
      const extent: Placed['extent'] = inside ? [x, x + barWidth] : flip ? [Math.min(x, right - label), right] : [x, Math.max(x + barWidth, x + label)];

      const placed = groups.get(window.groupId) ?? groups.set(window.groupId, []).get(window.groupId)!;
      let lane = 0;
      const clash = (p: Placed) => p.lane === lane && extent[0] < p.extent[1] + 14 && p.extent[0] < extent[1] + 14;
      while (placed.some(clash)) lane++;

      placed.push({
        window,
        lane,
        x,
        width: barWidth,
        overrun: statusOf(window, now) === 'overrunning' || (window.closedAt ?? 0) > window.plannedEnd ? Math.max(0, right - Math.max(x, xOf(window.plannedEnd))) : 0,
        cutStart: window.start < from,
        cutEnd: end > to,
        inside,
        flip,
        extent,
      });
    }
    // The groups with something in place now come first, then by when their next window starts.
    return [...groups.entries()]
      .map(([groupId, placed]) => {
        // A line whose bars all hold their own names is shorter than one with names underneath.
        const heights = Array.from({ length: Math.max(...placed.map((p) => p.lane)) + 1 }, (_, lane) =>
          placed.some((p) => p.lane === lane && !p.inside) ? LANE_UNDER : LANE_INSIDE,
        );
        const tops = heights.map((_, lane) => heights.slice(0, lane).reduce((sum, h) => sum + h, 0));
        return { group: groupById(groupId), placed, tops, height: heights.reduce((sum, h) => sum + h, 0) };
      })
      .sort((a, b) => {
        const live = (r: typeof a) => (r.placed.some((p) => ['active', 'overrunning'].includes(statusOf(p.window, now))) ? 0 : 1);
        return live(a) - live(b) || a.placed[0].window.start - b.placed[0].window.start;
      });
  }, [windows, now, from, to, width]);

  // A tick every few hours, and the day wherever one begins.
  const step = (range === 24 ? 3 : range === 72 ? 12 : 24) * HOUR;
  const ticks: number[] = [];
  const first = new Date(from);
  first.setMinutes(0, 0, 0);
  for (let t = first.getTime(); t < to; t += HOUR) {
    const d = new Date(t);
    if (t > from && (d.getHours() * HOUR) % step === 0) ticks.push(t);
  }
  const midnight = (t: number) => new Date(t).getHours() === 0;
  // Every tick gets a grid line, but only the ones with room get a label: not on top of
  // "Now", and not on top of the label before.
  const labelled: number[] = [];
  for (const t of ticks) {
    const x = xOf(t);
    const last = labelled.length ? xOf(labelled[labelled.length - 1]) : -Infinity;
    if (x > 18 && x < width - 18 && x - last >= 56 && Math.abs(x - xOf(now)) >= 40) labelled.push(t);
  }

  const hovered = rows.flatMap((r) => r.placed).find((p) => p.window.key === hover);

  return (
    <figure className="cw-sched" data-tour="cw-schedule">
      <div className="cw-sched-axis" aria-hidden>
        <div />
        <div className="cw-sched-ticks" ref={plotRef}>
          {labelled.map((t) => (
            <span key={t} style={{ left: xOf(t) }} data-day={midnight(t) || undefined}>
              {range === 168 || midnight(t) ? dayLabel(t).replace(/ \w+$/, '') : hourLabel(t)}
            </span>
          ))}
          <span className="cw-sched-now" style={{ left: xOf(now) }}>
            Now
          </span>
        </div>
      </div>

      <div className="cw-sched-body">
        {/* The grid: a hairline at each tick, a stronger one at midnight, and the line at now. */}
        <div className="cw-sched-grid" aria-hidden>
          <div />
          <div>
            {ticks.map((t) => (
              <i key={t} style={{ left: xOf(t) }} data-day={midnight(t) || undefined} />
            ))}
            <i className="cw-sched-nowline" style={{ left: xOf(now) }} />
          </div>
        </div>

        {rows.map(({ group, placed, tops, height }) => (
          <div className="cw-sched-row" key={group.id}>
            <div className="cw-sched-group">
              <div className="mn-truncate">{group.name}</div>
              <div className="mn-subtle mn-truncate">{group.unit}</div>
            </div>
            <div className="cw-sched-plot" style={{ height }}>
              {placed.map((p) => {
                const status = statusOf(p.window, now);
                const left = p.extent[0];
                return (
                  <button
                    key={p.window.key}
                    className="cw-bar"
                    data-status={status}
                    data-selected={p.window.key === selectedKey || undefined}
                    data-flip={p.flip || undefined}
                    data-inside={p.inside || undefined}
                    data-cut-start={p.cutStart || undefined}
                    data-cut-end={p.cutEnd || undefined}
                    // Never wider than the room left in the plot: a long name is cut short with an ellipsis.
                    style={{ left, top: tops[p.lane] + 5, width: Math.min(p.extent[1], width) - left }}
                    aria-label={`${p.window.name}, ${STATUS_LABEL[status]}, ${timing(p.window, now)}`}
                    onClick={() => onSelect(p.window.key)}
                    onPointerEnter={() => setHover(p.window.key)}
                    onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover(p.window.key)}
                    onBlur={() => setHover(null)}
                  >
                    <span className="cw-bar-mark" style={{ width: p.width }}>
                      {p.inside && <span className="cw-bar-name">{p.window.name}</span>}
                      {p.overrun > 0 && <span className="cw-bar-over" style={{ width: Math.min(p.width, p.overrun) }} />}
                    </span>
                    {!p.inside && <span className="cw-bar-name">{p.window.name}</span>}
                  </button>
                );
              })}
              {hovered && placed.includes(hovered) && (
                <div
                  className="cw-tip"
                  style={{ left: Math.min(Math.max(hovered.x + hovered.width / 2, 120), Math.max(120, width - 120)), top: tops[hovered.lane] }}
                >
                  <div className="cw-tip-title">{hovered.window.name}</div>
                  <div>
                    {when(hovered.window.start, now)} to {when(hovered.window.plannedEnd, now)}
                  </div>
                  <div data-status={statusOf(hovered.window, now)}>
                    {STATUS_LABEL[statusOf(hovered.window, now)]}, {timing(hovered.window, now)}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {!rows.length && (
          <div className="cw-sched-row">
            <div className="cw-sched-group" />
            <div className="cw-sched-plot cw-sched-empty">
              No change windows in this stretch
            </div>
          </div>
        )}
      </div>

      <figcaption className="cw-sched-key">
        <span>
          <i data-status="active" /> In place
        </span>
        <span>
          <i data-status="overrunning" /> Past its planned end
        </span>
        <span>
          <i data-status="upcoming" /> Upcoming
        </span>
        <span>
          <i data-status="ended" /> Ended
        </span>
      </figcaption>
    </figure>
  );
}
