/* The picked window: what it is and why, how far through it is, what it covers, how many
 * alerts it has held back, and anything else in place for the same group at the same time.
 *
 * Everything here runs the full width of the page except the prose, which stops at a
 * comfortable line length. */

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { num } from '../../../../lib/format';
import type { ChangeWindow } from '../../model/types';
import { HOUR, STATUS_LABEL, UNASSIGNED, groupOf, heldTotal, hourLabel, howLong, overlapping, statusOf, timing, when } from '../../model/windows';

/** How many overlapping windows to list before "and N more". */
const OTHERS_SHOWN = 5;
import './WindowDetail.css';

export function WindowDetail({
  window: w,
  all,
  now,
  onSelect,
}: {
  window: ChangeWindow | null;
  /** Every window, to find the ones that overlap this one. */
  all: ChangeWindow[];
  now: number;
  onSelect: (key: string) => void;
}) {
  if (!w) {
    return (
      <section className="cw-detail" data-tour="cw-detail">
        <p className="cw-note">Pick a change window to see what it covers.</p>
      </section>
    );
  }

  const group = groupOf(w.groupId);
  const grouped = group.id !== UNASSIGNED;
  const status = statusOf(w, now);
  // "Also for this group" only means something when there is a group.
  const others = grouped ? overlapping(w, all, now) : [];
  // Only the facts the source actually has. A missing one is left out, not marked "unavailable".
  const facts = [
    ['Repeats', w.schedule],
    ['Planned length', howLong(w.plannedEnd - w.start)],
    ['Raised by', w.raisedBy],
    ['Approved by', w.approvedBy],
  ].filter(([, value]) => value);

  return (
    <section className="cw-detail" data-tour="cw-detail">
      <div className="cw-detail-top">
        <span className="mn-mono mn-subtle">{w.id}</span>
        <span className="cw-badge" data-status={status}>
          <i data-status={status} aria-hidden />
          {STATUS_LABEL[status]}
        </span>
      </div>
      <h2>{w.name}</h2>
      <p className="cw-reason">{w.reason}</p>

      {status === 'overrunning' && (
        <div className="cw-callout">
          <AlertTriangle size={14} />
          <span>
            <strong>Past its planned end by {howLong(now - w.plannedEnd)}.</strong> It's still holding alerts back
            {grouped ? ` for ${group.name}` : ''}. Either the work is running late or nobody closed the window.
          </span>
        </div>
      )}

      <Run window={w} now={now} />

      <div className="cw-detail-grid">
        <div>
          <h3>Covers</h3>
          {/* Written like a rule's conditions, because it works the same way: alerts that fit are held back. */}
          <div className="cw-code">
            <div>
              <span className="cw-code-kw">where</span> ci <span className="cw-code-kw">matches</span> <span className="cw-code-val">{w.cis}</span>
            </div>
            {grouped && (
              <div>
                <span className="cw-code-kw">{'  and'}</span> assignment_group <span className="cw-code-kw">=</span>{' '}
                <span className="cw-code-val">{group.name}</span>
              </div>
            )}
          </div>
          {others.length > 0 && (
            <>
              <h3 className="cw-also">
                Also for {group.name} <span className="mn-subtle">at the same time</span>
              </h3>
              <ul className="cw-others">
                {others.slice(0, OTHERS_SHOWN).map((o) => (
                  <li key={o.key}>
                    <button onClick={() => onSelect(o.key)}>
                      <i data-status={statusOf(o, now)} aria-hidden />
                      <span className="mn-truncate">{o.name}</span>
                      <span className="mn-subtle">{timing(o, now)}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {others.length > OTHERS_SHOWN && <p className="cw-note cw-others-more">and {others.length - OTHERS_SHOWN} more</p>}
            </>
          )}
        </div>

        <div>
          <h3>Details</h3>
          <dl className="cw-facts">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/** The window's run, start to end, as one picture: how far through it is, and how many
 *  alerts it held back in each half hour so far. The time still to come is drawn empty,
 *  so the columns stop where "now" is. Time past the planned end is orange.
 *  One series, so no legend: the heading names it. */
function Run({ window: w, now }: { window: ChangeWindow; now: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const status = statusOf(w, now);
  const started = status !== 'upcoming';
  const half = HOUR / 2;

  // The run ends at the planned end, or later if it ran (or is running) past it.
  const end = Math.max(w.plannedEnd, w.closedAt ?? (started ? now : 0));
  const slots = Math.max(1, Math.ceil((end - w.start) / half));
  // No counts at all (nobody keeps them): the picture is just the track, and nothing is said about alerts.
  const held = w.held ?? [];
  const counted = w.held !== undefined;
  const max = Math.max(1, ...held);
  /** How far along the run a moment is, 0 to 1. */
  const along = (ms: number) => Math.min(1, Math.max(0, (ms - w.start) / (slots * half)));
  const reached = along(w.closedAt ?? now);
  const planned = along(w.plannedEnd);
  /** It ran past its planned end, so the picture's right edge is later than that. */
  const late = planned < 1;

  return (
    <div className="cw-run" data-tour="cw-run">
      <div className="cw-run-head">
        <span>
          <span className="mn-subtle">{started ? 'Started' : 'Starts'}</span> {when(w.start, now)}
        </span>
        <b data-status={status}>{timing(w, now)}</b>
        {/* The right-hand label names whatever the right edge of the picture is. */}
        <span>
          <span className="mn-subtle">{status === 'ended' ? 'Closed' : status === 'overrunning' ? 'Now' : 'Planned end'}</span>{' '}
          {when(status === 'overrunning' ? now : (w.closedAt ?? w.plannedEnd), now)}
        </span>
      </div>

      <div
        className="cw-run-plot"
        data-late={late || undefined}
        // Nothing to draw before it starts: only the empty track is shown.
        hidden={!started || !counted}
        role="img"
        aria-label={`${heldTotal(w)} alerts held back since it started, in half hours.`}
        onPointerLeave={() => setHover(null)}
      >
        {Array.from({ length: slots }, (_, i) => (
          // Each half hour is a full-height strip, so it's easy to point at; the column inside is the value.
          <div key={i} onPointerEnter={() => setHover(i)} data-hover={hover === i || undefined} data-over={w.start + i * half >= w.plannedEnd || undefined}>
            {i < held.length && <span style={{ height: `${Math.max(4, (held[i] / max) * 100)}%` }} />}
          </div>
        ))}
        {/* Where the planned end falls, when the run went past it. */}
        {late && (
          <i className="cw-run-planned" style={{ left: `${planned * 100}%` }}>
            <span>Planned end {hourLabel(w.plannedEnd)}</span>
          </i>
        )}
      </div>

      {/* The track under the columns: filled as far as the run has got. */}
      <div className="cw-run-track" aria-hidden>
        {started && <span data-status={status === 'ended' ? 'ended' : 'active'} style={{ width: `${Math.min(reached, planned) * 100}%` }} />}
        {started && reached > planned && <span data-status="overrunning" style={{ left: `${planned * 100}%`, width: `${(reached - planned) * 100}%` }} />}
      </div>

      <div className="cw-run-foot" hidden={!counted}>
        {hover !== null && hover < held.length ? (
          <span>
            <b>{held[hover]}</b> held back, {hourLabel(w.start + hover * half)} to {hourLabel(w.start + (hover + 1) * half)}
          </span>
        ) : started ? (
          <span>
            <b>{num(heldTotal(w))}</b> {heldTotal(w) === 1 ? 'alert' : 'alerts'} held back {status === 'ended' ? 'in all' : 'so far'}
          </span>
        ) : (
          <span>
            {w.lastRunHeld
              ? `Nothing held back yet. Its last run held back ${num(w.lastRunHeld)} alerts.`
              : 'Nothing held back yet. This is its first run, so there is no last time to go by.'}
          </span>
        )}
      </div>
    </div>
  );
}
