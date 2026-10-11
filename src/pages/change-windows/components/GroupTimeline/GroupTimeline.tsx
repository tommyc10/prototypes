/* The detail pane: the picked category's windows drawn on a timeline, a bar each, ten to
 * a page. So the picture is always a handful of bars with their names beside them, which
 * is the size a timeline is good at, and a hundred and fifty windows are reached in two
 * steps: which category (the list column), then which page.
 *
 *   the tabs    in place (the default), late, not started, ended, or all of them
 *   the time    "Fit" stretches the timeline to exactly the windows showing, so a window
 *               that started yesterday shows its planned part as well as its overrun.
 *               24h, 3d and 7d look a fixed distance around now instead.
 *   the strip   over the lanes: how many of the windows showing are in place at once
 *   a bar       solid for what's done, thinner ink for what's still planned, rose for
 *               anything past the planned end, an outline for a window not started
 *
 * When a category, a tab or a stretch of time is picked, the bars draw themselves in, left
 * to right. J and K move through them without any of that. */

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { Group } from '../../model/categories';
import type { ChangeWindow, Range } from '../../model/types';
import { HOUR, RANGES, dayLabel, endOf, hourLabel, howLong, rangeOf, statusOf, timing, when } from '../../model/windows';
import { Pager } from '../Pager/Pager';
import './GroupTimeline.css';

/** How many windows to a page of the timeline. */
const PAGE = 10;
/** How many slices the strip over the lanes is cut into. */
const SLICES = 72;
const ENDING_SOON = 2 * HOUR;

type Tab = 'open' | 'late' | 'upcoming' | 'ended' | 'all';
const TABS: { key: Tab; label: string; none: string }[] = [
  { key: 'open', label: 'In place', none: 'Nothing is in place.' },
  { key: 'late', label: 'Late', none: 'Nothing is past its planned end.' },
  {
    key: 'upcoming',
    label: 'Not started',
    none: 'Nothing is waiting to start.',
  },
  { key: 'ended', label: 'Ended', none: 'Nothing has ended lately.' },
  { key: 'all', label: 'All', none: 'No change windows.' },
];

const inTab = (w: ChangeWindow, tab: Tab, now: number) => {
  const status = statusOf(w, now);
  if (tab === 'all') return true;
  if (tab === 'open') return status === 'active' || status === 'overrunning';
  return tab === 'late' ? status === 'overrunning' : status === tab;
};

const dayShort = (ms: number) =>
  new Date(ms).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
  });

/** Round moments to label a stretch of time with: at most eight, on whole hours, midnights included. */
function ticksFor(from: number, to: number) {
  const hours = (to - from) / HOUR;
  const step = [1, 2, 3, 6, 12, 24, 48].find((s) => hours / s <= 8) ?? 72;
  const midnight = new Date(from).setHours(0, 0, 0, 0);
  const ticks = [];
  for (let t = midnight + Math.ceil((from - midnight) / (step * HOUR)) * step * HOUR; t < to; t += step * HOUR) ticks.push(t);
  return ticks;
}

/** The detail pane: the picked category's windows on a timeline. */
export function GroupTimeline({
  group,
  now,
  selectedKey,
  onSelect,
  onOrder,
}: {
  group?: Group;
  now: number;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  /** Tell the page what order the windows are showing in, so J and K follow it. */
  onOrder: (keys: string[]) => void;
}) {
  const [tab, setTab] = useState<Tab>('open');
  // How much time the timeline shows: fitted to the windows showing, or a fixed distance around now.
  const [span, setSpan] = useState<'fit' | Range>('fit');

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.key, (group?.windows ?? []).filter((w) => inTab(w, t.key, now)).length])), [group, now]);
  const shown = useMemo(() => (group?.windows ?? []).filter((w) => inTab(w, tab, now)), [group, tab, now]);

  useEffect(() => onOrder(shown.map((w) => w.key)), [shown, onOrder]);
  // A window picked from somewhere else (the command menu, a link) may be under another tab: show them all.
  useEffect(() => {
    if (selectedKey && group?.windows.some((w) => w.key === selectedKey) && !shown.some((w) => w.key === selectedKey)) setTab('all');
  }, [selectedKey]);

  // The stretch of time. Fitted: from the earliest start to the latest end showing, with now in it and a little either side.
  const { from, to } = useMemo(() => {
    if (span !== 'fit' || !shown.length) return rangeOf(span === 'fit' ? 24 : span, now);
    const first = Math.min(now, ...shown.map((w) => w.start));
    const last = Math.max(now, ...shown.map((w) => Math.max(w.plannedEnd, endOf(w, now))));
    const pad = Math.max(HOUR / 2, (last - first) * 0.04);
    return { from: first - pad, to: last + pad };
  }, [span, shown, now]);
  /** A moment as a percentage across the timeline. */
  const at = (ms: number) => Math.min(100, Math.max(0, ((ms - from) / (to - from)) * 100));
  const ticks = ticksFor(from, to);

  // The strip over the lanes: how many of the windows showing are in place at once, across the same
  // stretch of time. It covers every page, so it's the shape of the whole list, not just these ten.
  const strip = useMemo(() => {
    const counts = Array.from({ length: SLICES }, (_, i) => {
      const t = from + ((i + 0.5) / SLICES) * (to - from);
      // Up to now: what was really open. After now: what's planned.
      return shown.filter((w) => w.start <= t && (t <= now ? (w.closedAt ?? Infinity) > t : !w.closedAt && w.plannedEnd > t)).length;
    });
    return {
      counts,
      most: Math.max(1, ...counts),
      peak: counts.indexOf(Math.max(...counts)),
    };
  }, [shown, from, to, now]);

  if (!group) return <div className="mn-empty">No change windows match</div>;

  const ending = group.windows.filter((w) => statusOf(w, now) === 'active' && w.plannedEnd - now <= ENDING_SOON).length;

  const lane = (w: ChangeWindow) => {
    const status = statusOf(w, now);
    const end = endOf(w, now);
    const seen = w.start < to && end > from;
    const [left, right] = [at(w.start), at(end)];
    const width = Math.max(0.6, right - left);
    // The bar in three parts: what's done, what's still to come of the plan, and anything past the planned end.
    const planned = Math.min(right, Math.max(left, at(w.plannedEnd)));
    const reached = status === 'ended' ? right : Math.min(planned, Math.max(left, at(now)));
    const share = (a: number, b: number) => `${(Math.max(0, b - a) / width) * 100}%`;
    return (
      <button
        key={w.key}
        className="cw-gl"
        data-status={status}
        data-selected={w.key === selectedKey || undefined}
        aria-pressed={w.key === selectedKey}
        title={`${w.id}: ${when(w.start, now)} to ${when(w.closedAt ?? w.plannedEnd, now)}, ${howLong(w.plannedEnd - w.start)} planned`}
        // Where it is on its page, so the bars can draw in one after another.
        style={{ '--cw-i': shown.indexOf(w) % PAGE } as CSSProperties}
        onClick={() => onSelect(w.key)}
      >
        <span className="cw-gl-name">
          <span className="mn-truncate">{w.name}</span>
          <small className="mn-truncate">
            <span className="mn-mono">{w.id}</span>
            {when(w.start, now)} to {when(w.closedAt ?? w.plannedEnd, now)}
          </small>
        </span>
        <span className="cw-gl-track">
          {seen ? (
            <span
              className="cw-gl-bar"
              data-status={status}
              data-cut-start={w.start < from || undefined}
              data-cut-end={end > to || undefined}
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              {status !== 'upcoming' && <i style={{ width: share(left, reached) }} />}
              {status === 'active' && <i data-part="to-go" style={{ width: share(reached, planned) }} />}
              {status === 'overrunning' && <i data-part="late" style={{ width: share(planned, right) }} />}
            </span>
          ) : (
            // Outside the stretch of time showing: say which way it lies.
            <small data-side={w.start >= to ? 'after' : 'before'}>{w.start >= to ? 'later' : 'earlier'}</small>
          )}
        </span>
        <span className="cw-gl-when">{timing(w, now)}</span>
      </button>
    );
  };

  return (
    <section className="cw-groups-main" aria-label={group.category.label}>
      <header>
        <div>
          <h2 data-mono={group.category.mono || undefined}>{group.category.label}</h2>
          <p>
            {group.late > 0 ? (
              <>
                <em>
                  {group.late} of the {group.inPlace} in place {group.late === 1 ? 'is' : 'are'} past {group.late === 1 ? 'its' : 'their'} planned end.
                </em>{' '}
              </>
            ) : group.inPlace ? (
              <>
                {group.inPlace === 1 ? 'The one in place is' : `All ${group.inPlace} in place are`} inside {group.inPlace === 1 ? 'its' : 'their'} planned
                time.{' '}
              </>
            ) : (
              <>Nothing is in place. </>
            )}
            <b>{ending}</b> {ending === 1 ? 'ends' : 'end'} in the next two hours, <b>{group.upcoming}</b> not started.
          </p>
        </div>
      </header>

      <div className="cw-groups-tools" data-tour="cw-tools">
        <div className="mn-tabs" role="tablist" aria-label="Which windows">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className="mn-tab"
              data-active={tab === t.key || undefined}
              data-late={(t.key === 'late' && counts.late > 0) || undefined}
              onClick={() => setTab(t.key)}
            >
              {t.label} <span>{counts[t.key]}</span>
            </button>
          ))}
        </div>
        <div className="cw-range" role="radiogroup" aria-label="How much time the timeline shows">
          <div className="mn-tabs">
            {[{ hours: 'fit' as const, label: 'Fit' }, ...RANGES].map((option) => (
              <button
                key={option.hours}
                role="radio"
                aria-checked={span === option.hours}
                className="mn-tab"
                data-active={span === option.hours || undefined}
                title={option.hours === 'fit' ? 'Stretch the timeline to the windows showing' : undefined}
                onClick={() => setSpan(option.hours)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Keyed by what's showing, so a different category, tab or stretch of time draws its bars in afresh. */}
      <div className="cw-gl-plot" data-tour="cw-timeline" key={`${group.category.key} ${tab} ${span}`} style={{ '--cw-now': `${at(now)}%` } as CSSProperties}>
        <div className="cw-gl cw-gl-head" aria-hidden>
          <span>
            {shown.length} {shown.length === 1 ? 'window' : 'windows'}, {howLong(to - from)} across
          </span>
          <span className="cw-gl-track">
            {ticks.map((t) => {
              const midnight = new Date(t).getHours() === 0;
              // A label that would sit under "Now" gives way to it.
              return Math.abs(at(t) - at(now)) < 8 ? null : (
                <small key={t} data-day={midnight || undefined} style={{ left: `${at(t)}%` }}>
                  {midnight ? dayShort(t) : hourLabel(t)}
                </small>
              );
            })}
            <small data-now style={{ left: `${at(now)}%` }}>
              Now
            </small>
          </span>
          <span />
        </div>
        {/* The shape of the whole list, over the same stretch of time. */}
        <div className="cw-gl cw-gl-strip">
          <span>
            In place at once, <b>{strip.most}</b> at the most
          </span>
          <span
            className="cw-gl-track"
            role="img"
            aria-label={`Up to ${strip.most} of these windows in place at once, around ${dayLabel(from + ((strip.peak + 0.5) / SLICES) * (to - from))}`}
          >
            {strip.counts.map((count, i) => (
              <i key={i} data-ahead={from + ((i + 0.5) / SLICES) * (to - from) > now || undefined} style={{ height: `${(count / strip.most) * 100}%` }} />
            ))}
          </span>
          <span />
        </div>
        <div className="cw-gl-lanes">
          {/* A faint rule at each labelled moment, behind every lane. */}
          <div className="cw-gl-rules cw-gl" aria-hidden>
            <span />
            <span className="cw-gl-track">
              {ticks.map((t) => (
                <i key={t} data-day={new Date(t).getHours() === 0 || undefined} style={{ left: `${at(t)}%` }} />
              ))}
              {/* Everything left of now has happened: it sits on a faint tint. */}
              <b style={{ width: `${at(now)}%` }} />
              <i data-now style={{ left: `${at(now)}%` }} />
            </span>
            <span />
          </div>
          {shown.length ? (
            <Pager items={shown} size={PAGE} label={`${group.category.label} windows`} row={lane} />
          ) : (
            <p className="cw-gl-none">{TABS.find((t) => t.key === tab)!.none}</p>
          )}
        </div>
        <div className="cw-gl-key" aria-hidden>
          <span>
            <i /> Done
          </span>
          <span>
            <i data-part="to-go" /> Still planned
          </span>
          <span>
            <i data-part="late" /> Past planned end
          </span>
          <span>
            <i data-part="upcoming" /> Not started
          </span>
        </div>
      </div>
    </section>
  );
}
