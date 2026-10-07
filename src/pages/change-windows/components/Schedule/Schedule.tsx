/* The schedule: every window in the chosen stretch of time, as a bar on a timeline, with a
 * line at now.
 *
 *   solid bar       in place now
 *   orange edge     the part past its planned end: it's overrunning
 *   outlined bar    approved, not started
 *   faint bar       ended
 *
 * It lays itself out one of two ways, depending on the data:
 *
 *   by group    a row per assignment group, with that group's windows side by side. This is
 *               the tidy picture, and it works while groups have a handful of windows each.
 *   by window   a row per window, most urgent first, with its name beside it. This is what
 *               it falls back to when one group holds most of the windows (a real feed often
 *               has a hundred windows and no group on any of them), because stacking a
 *               hundred bars in one row tells nobody anything.
 *
 * Neither layout draws more than fits: a group's row stops at six lines, and the by-window
 * layout shows the first few of each kind (late, in place, upcoming), so the picture has
 * all three in it instead of fourteen late ones. Each says how many it left out and offers
 * the rest.
 *
 * The bars are placed with left and width in pixels, worked out from the plot's own width
 * (measured off the time axis, because the sidebar and list beside the chart can be hidden).
 * The window list beside the chart is the same windows as text. */

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ChangeWindow, Range, WindowStatus } from '../../model/types';
import { HOUR, STATUS_LABEL, dayLabel, endOf, groupOf, hourLabel, rangeOf, statusOf, timing, when } from '../../model/windows';
import './Schedule.css';

/** How tall a line of bars is: just the bars, or the bars with names underneath. */
const LANE_INSIDE = 28;
const LANE_UNDER = 44;
/** The most lines of bars one group's row will draw. */
const MAX_LANES = 6;
/** How many windows of each kind the by-window layout shows before "Show all". */
const SECTION_SHOWN = 5;

const SECTIONS: { status: WindowStatus; title: string }[] = [
  { status: 'overrunning', title: 'Past their planned end' },
  { status: 'active', title: 'In place' },
  { status: 'upcoming', title: 'Upcoming' },
  { status: 'ended', title: 'Ended' },
];

interface Bar {
  window: ChangeWindow;
  /** The bar, in pixels from the left of the plot. */
  x: number;
  width: number;
  /** How much of the bar's right end is past the planned end. */
  overrun: number;
  /** The bar carries on past the edge of the plot. */
  cutStart: boolean;
  cutEnd: boolean;
}

interface Placed extends Bar {
  lane: number;
  /** The bar is long enough to have its name written inside it. */
  inside: boolean;
  /** The name is anchored to the bar's right end, because there's no room after its start. */
  flip: boolean;
  /** Everything it takes up, bar and name, from left to right. */
  extent: [number, number];
}

/** Roughly how wide a name is drawn, to keep names in one row from overlapping. A long name
 *  is cut short, so it never claims more than this. */
const nameWidth = (name: string) => Math.min(240, name.length * 6.4 + 14);

export function Schedule({
  windows,
  now,
  range,
  selectedKey,
  onSelect,
  onMore,
}: {
  /** The windows to draw, most urgent first. */
  windows: ChangeWindow[];
  now: number;
  range: Range;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  /** Show the rest of a group's windows (the ones its row had no room for) in the list. */
  onMore: (groupId: string) => void;
}) {
  const plotRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useLayoutEffect(() => {
    const el = plotRef.current!;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const { from, to } = rangeOf(range, now);
  const xOf = (ms: number) => ((ms - from) / (to - from)) * width;

  const inView = useMemo(() => windows.filter((w) => w.start < to && endOf(w, now) > from), [windows, now, from, to]);

  // One group holding most of a long list is the sign that grouping isn't telling us anything.
  const flat = useMemo(() => {
    const sizes = new Map<string, number>();
    for (const w of inView) sizes.set(w.groupId, (sizes.get(w.groupId) ?? 0) + 1);
    return inView.length > 12 && Math.max(...sizes.values()) > inView.length / 2;
  }, [inView]);

  /** Where a window's bar goes. */
  const bar = (window: ChangeWindow): Bar => {
    const end = endOf(window, now);
    const x = Math.max(0, xOf(window.start));
    const right = Math.min(width, xOf(end));
    const late = statusOf(window, now) === 'overrunning' || (window.closedAt ?? 0) > window.plannedEnd;
    return {
      window,
      x,
      width: Math.max(4, right - x),
      overrun: late ? Math.max(0, right - Math.max(x, xOf(window.plannedEnd))) : 0,
      cutStart: window.start < from,
      cutEnd: end > to,
    };
  };

  // By group: give each window a line in its group's row where neither its bar nor its name
  // runs into the one before it. A window that would need a seventh line is left out and counted.
  const rows = useMemo(() => {
    if (flat) return [];
    const groups = new Map<string, { placed: Placed[]; more: number }>();
    for (const window of [...inView].sort((a, b) => a.start - b.start)) {
      const b = bar(window);
      const right = b.x + b.width;
      const label = nameWidth(window.name);
      const inside = b.width >= label + 6;
      const flip = !inside && b.x + label > width && right - label >= 0;
      const extent: Placed['extent'] = inside ? [b.x, right] : flip ? [Math.min(b.x, right - label), right] : [b.x, Math.max(right, b.x + label)];

      const row = groups.get(window.groupId) ?? groups.set(window.groupId, { placed: [], more: 0 }).get(window.groupId)!;
      let lane = 0;
      const clash = (p: Placed) => p.lane === lane && extent[0] < p.extent[1] + 14 && p.extent[0] < extent[1] + 14;
      while (lane < MAX_LANES && row.placed.some(clash)) lane++;
      if (lane === MAX_LANES) row.more++;
      else row.placed.push({ ...b, lane, inside, flip, extent });
    }
    // The groups with something in place now come first, then by when their next window starts.
    return [...groups.entries()]
      .map(([groupId, { placed, more }]) => {
        // A line whose bars all hold their own names is shorter than one with names underneath.
        const heights = Array.from({ length: Math.max(...placed.map((p) => p.lane)) + 1 }, (_, lane) =>
          placed.some((p) => p.lane === lane && !p.inside) ? LANE_UNDER : LANE_INSIDE,
        );
        const tops = heights.map((_, lane) => heights.slice(0, lane).reduce((sum, h) => sum + h, 0));
        return { group: groupOf(groupId), placed, more, tops, height: heights.reduce((sum, h) => sum + h, 0) };
      })
      .sort((a, b) => {
        const live = (r: typeof a) => (r.placed.some((p) => ['active', 'overrunning'].includes(statusOf(p.window, now))) ? 0 : 1);
        return live(a) - live(b) || a.placed[0].window.start - b.placed[0].window.start;
      });
  }, [flat, inView, now, from, to, width]);

  // By window: a section for each kind, in the list's own order (most urgent first). Each
  // shows its first few, plus the picked one if it isn't among them.
  const sections = useMemo(() => {
    if (!flat) return [];
    return SECTIONS.map(({ status, title }) => {
      const all = inView.filter((w) => statusOf(w, now) === status);
      const shown = showAll ? all : all.slice(0, SECTION_SHOWN);
      const picked = all.find((w) => w.key === selectedKey);
      return { status, title, total: all.length, bars: (picked && !shown.includes(picked) ? [...shown, picked] : shown).map(bar) };
    }).filter((section) => section.total > 0);
  }, [flat, inView, showAll, selectedKey, now, from, to, width]);
  const flatShown = sections.reduce((sum, section) => sum + section.bars.length, 0);

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

  /** The bar itself: the same mark in both layouts. */
  const mark = (b: Bar, name?: string) => (
    <span
      className="cw-bar-mark"
      data-status={statusOf(b.window, now)}
      data-cut-start={b.cutStart || undefined}
      data-cut-end={b.cutEnd || undefined}
      style={{ width: b.width }}
    >
      {name && <span className="cw-bar-name">{name}</span>}
      {b.overrun > 0 && <span className="cw-bar-over" style={{ width: Math.min(b.width, b.overrun) }} />}
    </span>
  );

  const tip = (b: Bar, top: number) => (
    <span key={b.window.key} className="cw-tip" style={{ left: Math.min(Math.max(b.x + b.width / 2, 120), Math.max(120, width - 120)), top }}>
      <span className="cw-tip-title">{b.window.name}</span>
      <span>
        {when(b.window.start, now)} to {when(b.window.plannedEnd, now)}
      </span>
      <span data-status={statusOf(b.window, now)}>
        {STATUS_LABEL[statusOf(b.window, now)]}, {timing(b.window, now)}
      </span>
    </span>
  );

  const hoverOn = (key: string) => ({
    onPointerEnter: () => setHover(key),
    onPointerLeave: () => setHover(null),
    onFocus: () => setHover(key),
    onBlur: () => setHover(null),
  });

  return (
    <figure className="cw-sched" data-layout={flat ? 'window' : 'group'} data-tour="cw-schedule">
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

        {/* ---------- by group ---------- */}
        {rows.map(({ group, placed, more, tops, height }) => (
          <div className="cw-sched-row" key={group.id}>
            <div className="cw-sched-group">
              <div className="mn-truncate">{group.name}</div>
              <div className="mn-subtle mn-truncate">{group.unit}</div>
              {more > 0 && (
                <button className="mn-link" onClick={() => onMore(group.id)}>
                  +{more} more in the list
                </button>
              )}
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
                    // Never wider than the room left in the plot: a long name is cut short with an ellipsis.
                    style={{ left, top: tops[p.lane] + 5, width: Math.min(p.extent[1], width) - left }}
                    aria-label={`${p.window.name}, ${STATUS_LABEL[status]}, ${timing(p.window, now)}`}
                    onClick={() => onSelect(p.window.key)}
                    {...hoverOn(p.window.key)}
                  >
                    {mark(p, p.inside ? p.window.name : undefined)}
                    {!p.inside && <span className="cw-bar-name">{p.window.name}</span>}
                  </button>
                );
              })}
              {placed.filter((p) => p.window.key === hover).map((p) => tip(p, tops[p.lane]))}
            </div>
          </div>
        ))}

        {/* ---------- by window ---------- */}
        {sections.map((section) => (
          <div className="cw-flat-section" key={section.status}>
            <div className="cw-flat-head" data-status={section.status}>
              {section.title} <span>{section.total}</span>
              {section.bars.length < section.total && <span className="mn-subtle">showing {section.bars.length}</span>}
            </div>
            {section.bars.map((b) => {
              const status = statusOf(b.window, now);
              return (
                <button
                  key={b.window.key}
                  className="cw-sched-row cw-flat"
                  data-status={status}
                  data-selected={b.window.key === selectedKey || undefined}
                  onClick={() => onSelect(b.window.key)}
                  {...hoverOn(b.window.key)}
                >
                  <span className="cw-flat-label">
                    <span className="cw-flat-name mn-truncate">{b.window.name}</span>
                    <span className="cw-flat-sub">
                      <span className="mn-mono">{b.window.id}</span>
                      <span className="cw-flat-when">{timing(b.window, now)}</span>
                    </span>
                  </span>
                  <span className="cw-sched-plot">
                    <span className="cw-flat-bar" style={{ left: b.x }}>
                      {mark(b)}
                    </span>
                    {hover === b.window.key && tip(b, 0)}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
        {flat && (showAll || flatShown < inView.length) && (
          <button className="cw-sched-all" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show fewer' : `Show all ${inView.length}`}
            {!showAll && <span className="mn-subtle">showing the first {SECTION_SHOWN} of each</span>}
          </button>
        )}

        {!inView.length && (
          <div className="cw-sched-row">
            <div className="cw-sched-group" />
            <div className="cw-sched-plot cw-sched-empty">No change windows in this stretch</div>
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
