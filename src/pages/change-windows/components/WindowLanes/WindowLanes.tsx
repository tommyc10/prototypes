/* The picked window's timeline: its whole run, start to end, drawn as a lane, with the
 * other windows of the same category that are in place at the same time as lanes under it.
 *
 *   the thick lane   this window: the planned part solid, anything past the planned end in rose
 *   the thin lanes   the others, fainter. Press one to go to it
 *   the rules        a dashed one at the planned end, a solid one at now
 *
 * The time shown is this window's own run with a little either side, so its bar fills the
 * picture whether it lasts forty minutes or two days. The others are cut off where they
 * leave it.
 *
 * When a window is picked with the pointer the lanes draw themselves, left to right, the
 * way time runs. Moved to with J and K, they're simply there. */

import type { CSSProperties } from 'react';
import type { Categories } from '../../model/categories';
import type { ChangeWindow } from '../../model/types';
import { endOf, howLong, statusOf, timing, when } from '../../model/windows';
import './WindowLanes.css';

/** How many of the other windows to draw. */
const SHOWN = 6;

export function WindowLanes({
  window: w,
  all,
  now,
  categories,
  onSelect,
  animate,
}: {
  window: ChangeWindow;
  all: ChangeWindow[];
  now: number;
  categories: Categories;
  onSelect: (key: string) => void;
  /** Draw the lanes in (it was picked with the pointer). */
  animate: boolean;
}) {
  const own = categories.of(w);
  const status = statusOf(w, now);
  const end = Math.max(w.plannedEnd, endOf(w, now));
  const pad = (end - w.start) * 0.07;
  const from = w.start - pad;
  const to = end + pad;
  /** A moment as a percentage across the picture. */
  const at = (ms: number) => Math.min(100, Math.max(0, ((ms - from) / (to - from)) * 100));

  // The others: same category, not closed, overlapping this one's run. The ones that overlap it longest first.
  const overlap = (o: ChangeWindow) => Math.min(end, Math.max(o.plannedEnd, endOf(o, now))) - Math.max(w.start, o.start);
  const others = all
    .filter((o) => o.key !== w.key && !o.closedAt && categories.of(o).key === own.key && overlap(o) > 0)
    .sort((a, b) => overlap(b) - overlap(a));

  /** A lane's bar: where it starts and stops, and how much of it is past its planned end. */
  const bar = (o: ChangeWindow) => {
    const stop = Math.max(o.plannedEnd, endOf(o, now));
    const [left, right, planned] = [at(o.start), at(stop), at(o.plannedEnd)];
    return {
      style: { left: `${left}%`, width: `${Math.max(0.8, right - left)}%` } as CSSProperties,
      late: stop > o.plannedEnd ? ((right - Math.max(left, planned)) / Math.max(0.8, right - left)) * 100 : 0,
      cutStart: o.start < from,
      cutEnd: stop > to,
    };
  };
  const mine = bar(w);
  const nowIn = now > from && now < to;
  const ranOver = end > w.plannedEnd;
  // One moment is named above the lanes, the one in the middle of the picture: the planned
  // end if the run went past it, otherwise now. The two ends are named underneath.
  const above = ranOver ? { at: w.plannedEnd, says: 'Planned end' } : nowIn && status === 'active' ? { at: now, says: 'Now' } : null;
  const right = ranOver ? (w.closedAt ? { at: w.closedAt, says: 'Closed' } : { at: now, says: 'Now' }) : { at: w.plannedEnd, says: 'Planned end' };

  return (
    // Keyed by the window, so the drawing-in starts again for each one picked.
    <section className="cw-wl" key={w.key} data-animate={animate || undefined} aria-label="Timeline">
      <h3>
        Timeline
        <span className="mn-subtle">
          {howLong(w.plannedEnd - w.start)} planned{status === 'overrunning' ? `, ${howLong(now - w.plannedEnd)} over` : ''}
        </span>
      </h3>

      {/* The planned end is named above its rule, clear of the two ends named underneath. */}
      <div className="cw-wl-axis" data-side="top">
        <div>
          {above && (
            <span style={{ left: `${at(above.at)}%` }} data-edge={at(above.at) > 75 ? 'end' : at(above.at) < 25 ? 'start' : 'mid'}>
              {above.says} <b>{when(above.at, now)}</b>
            </span>
          )}
        </div>
      </div>

      <div className="cw-wl-plot">
        <div className="cw-wl-lane" data-own>
          <span className="cw-wl-name">This window</span>
          <div className="cw-wl-track">
            <span className="cw-wl-bar" data-status={status} style={mine.style}>
              {mine.late > 0 && <b style={{ width: `${mine.late}%` }} />}
            </span>
          </div>
        </div>

        {others.slice(0, SHOWN).map((o, i) => {
          const b = bar(o);
          return (
            <button key={o.key} className="cw-wl-lane" style={{ '--cw-i': i + 1 } as CSSProperties} onClick={() => onSelect(o.key)} title={`${o.id}: ${o.name}, ${timing(o, now)}`}>
              <span className="cw-wl-name mn-truncate">{o.name}</span>
              <div className="cw-wl-track">
                <span className="cw-wl-bar" data-status={statusOf(o, now)} data-cut-start={b.cutStart || undefined} data-cut-end={b.cutEnd || undefined} style={b.style}>
                  {b.late > 0 && <b style={{ width: `${b.late}%` }} />}
                </span>
              </div>
            </button>
          );
        })}

        {/* The rules run through every lane. They sit in the same column as the tracks. */}
        <div className="cw-wl-rules" aria-hidden>
          <div>
            {ranOver && <i data-rule="planned" style={{ left: `${at(w.plannedEnd)}%` }} />}
            {nowIn && <i data-rule="now" style={{ left: `${at(now)}%` }} />}
          </div>
        </div>
      </div>

      <div className="cw-wl-axis">
        <div>
          <span style={{ left: `${at(w.start)}%` }} data-edge="start">
            {status === 'upcoming' ? 'Starts' : 'Started'} <b>{when(w.start, now)}</b>
          </span>
          <span style={{ left: `${at(right.at)}%` }} data-edge="end">
            {right.says} <b>{when(right.at, now)}</b>
          </span>
        </div>
      </div>

      <p className="cw-wl-note">
        {others.length ? (
          <>
            With <b>{others.length}</b> other <span className={own.mono ? 'cw-wl-code' : undefined}>{own.label}</span> {others.length === 1 ? 'window' : 'windows'} in place during it
            {others.length > SHOWN ? `, the ${SHOWN} that overlap it longest shown.` : '.'}
          </>
        ) : (
          <>
            Nothing else for <span className={own.mono ? 'cw-wl-code' : undefined}>{own.label}</span> is in place during it.
          </>
        )}
      </p>
    </section>
  );
}
