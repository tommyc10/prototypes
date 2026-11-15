/* One ticket's replay, in a drawer over the right of the pane: what happened to it, what each
 * rule for its service says, whether an approved window covered it, and the verdict those
 * add up to. It says what the replay can't: that today's rules weren't necessarily the ones
 * running, and that a match isn't proof the ticket would have been suppressed.
 *
 * It slides in when opened with the pointer and appears at once from the keyboard. Drag it
 * right, or fling it, to put it away; let go early and it settles back. J and K move to the
 * next ticket without closing it. */

import { useLayoutEffect, useRef, type PointerEvent } from 'react';
import { ArrowUpRight, CalendarClock, CircleDashed, CloudOff, X } from 'lucide-react';
import { serviceName } from '../../data/mockData';
import { CAUSE_LABEL } from '../../model/labels';
import { isLive, type Replayed, type RuleCheck } from '../../model/replay';
import { LIFECYCLE, VERDICT_TONE } from '../../model/words';
import { lifeKey } from './Tickets';

const longWhen = (ms: number) =>
  new Date(ms).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
const clock = (ms: number) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
const day = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function verdictSentence(r: Replayed) {
  const matched = r.checks.filter((c) => isLive(c.rule) && c.verdict === 'match').map((c) => c.rule.id);
  const win = r.window?.window.id;
  switch (r.verdict) {
    case 'both':
      return { lead: 'Would be explained, by a rule and a window.', more: `${matched.join(' and ')} matches, and ${win} covered it. Counted once.` };
    case 'rule':
      return { lead: 'Would be explained by an active rule.', more: `${matched.join(' and ')} ${matched.length > 1 ? 'match' : 'matches'}.` };
    case 'window':
      return { lead: 'Would be explained by an approved window.', more: `${win} was running when it arrived.` };
    case 'hypothetical':
      return { lead: 'Not explained by anything running today.', more: 'Only a proposed or inactive rule would match it. That’s a hypothesis, not a fix.' };
    case 'none':
      return { lead: 'Nothing in today’s logic explains it.', more: 'No active rule matches and no approved window covered it. A gap worth a look.' };
    case 'unevaluable':
      return { lead: 'Unknown: a rule couldn’t be evaluated.', more: 'An active rule reads a field this ticket never recorded. Not a miss.' };
    case 'unavailable':
      return { lead: 'Unknown: the change calendar wasn’t there.', more: 'No rule matches, and there’s no calendar for when it arrived to say whether a window covered it. Not a miss.' };
  }
}

function Check({ c }: { c: RuleCheck }) {
  const live = isLive(c.rule);
  return (
    <li className="ol-check" data-verdict={c.verdict} data-live={live || undefined}>
      <span className="ol-check-mark" aria-hidden>
        {c.verdict === 'unevaluable' ? <CircleDashed size={13} /> : <i />}
      </span>
      <span className="ol-check-main">
        <span className="ol-check-title">
          <code>{c.rule.id}</code>
          <span className="mn-truncate">{c.rule.name}</span>
        </span>
        <span className="ol-check-meta">
          {!live && (
            <span className="ol-status" data-status={c.rule.status}>
              {c.rule.status === 'proposed' ? 'Proposed' : 'Inactive'}
            </span>
          )}
          {c.verdict === 'match' && (live ? 'Matches' : 'Would match, hypothetically')}
          {c.verdict === 'no-match' && 'Doesn’t match'}
          {c.verdict === 'unevaluable' && c.rule.needs && `Reads ${c.rule.needs.field}, not recorded before ${day(c.rule.needs.since)}`}
        </span>
      </span>
      <a className="mn-icon-btn ol-check-link" href={`#/rules/${c.rule.id}`} aria-label={`Open ${c.rule.id} in Rules`} title="Open in Rules">
        <ArrowUpRight size={14} />
      </a>
    </li>
  );
}

const DISMISS_SHARE = 0.32;
const FLING = 0.5; // px per ms

/** `basis` is what the replay ran with: today's logic, or an extract's, as of the day it ran. */
export function Trace({ replayed, onClose, animate, basis }: { replayed: Replayed; onClose: () => void; animate: boolean; basis: 'today' | number }) {
  const ref = useRef<HTMLElement>(null);
  const drag = useRef<{ x: number; y: number; t: number; dx: number; on: boolean; lastX: number; lastT: number; v: number } | null>(null);
  const t = replayed.ticket;
  const k = lifeKey(replayed);
  const sentence = verdictSentence(replayed);

  // Move focus into the drawer when it opens, so Esc and the close button are where the reader is.
  useLayoutEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  const settle = (to: number, after?: () => void) => {
    const el = ref.current;
    if (!el) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = drag.current?.dx ?? 0;
    el.style.transform = '';
    if (reduce) return after?.();
    const anim = el.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], {
      duration: to === 0 ? 240 : 200,
      easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
      fill: 'forwards',
    });
    anim.onfinish = () => {
      after?.();
      anim.cancel();
    };
  };

  const onDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('a, button, input')) return;
    drag.current = { x: e.clientX, y: e.clientY, t: e.timeStamp, dx: 0, on: false, lastX: e.clientX, lastT: e.timeStamp, v: 0 };
  };
  const onMove = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.on) {
      // Only a mostly sideways pull is a drag; anything else is the reader scrolling.
      if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(e.clientY - d.y)) return;
      d.on = true;
      ref.current!.dataset.dragging = '';
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    // Pulled the wrong way it gives a little, then stops.
    d.dx = dx > 0 ? dx : -Math.min(24, Math.sqrt(-dx) * 3);
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.v = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    ref.current!.style.transform = `translateX(${d.dx}px)`;
  };
  const onUp = () => {
    const d = drag.current;
    if (!d) return;
    delete ref.current?.dataset.dragging;
    if (!d.on) {
      drag.current = null;
      return;
    }
    const width = ref.current!.offsetWidth;
    if (d.dx > width * DISMISS_SHARE || d.v > FLING) settle(width + 24, onClose);
    else settle(0);
    drag.current = null;
  };

  const closeWithPointer = () => {
    drag.current = { x: 0, y: 0, t: 0, dx: 0, on: true, lastX: 0, lastT: 0, v: 0 };
    settle((ref.current?.offsetWidth ?? 400) + 24, onClose);
    drag.current = null;
  };

  return (
    <aside
      ref={ref}
      className="ol-trace"
      data-animate={animate || undefined}
      tabIndex={-1}
      aria-label={`Replay of ${t.id}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <span className="ol-trace-grip" aria-hidden />
      <header className="ol-trace-head">
        <code>{t.id}</code>
        <span className="ol-life" data-life={k}>
          {LIFECYCLE[k]}
        </span>
        {t.outcome === 'incident' && <span className="ol-pill" data-tone="bad">Became an incident</span>}
        <button className="mn-icon-btn ol-trace-close" onClick={(e) => (e.detail === 0 ? onClose() : closeWithPointer())} aria-label="Close" title="Close  Esc">
          <X size={15} />
        </button>
      </header>

      <div className="ol-trace-body">
        <h2 className="ol-trace-title">{t.title}</h2>
        <p className="ol-trace-meta">
          {serviceName(t.serviceId)} · <code>{t.ci}</code> · {CAUSE_LABEL[t.cause]}
          <br />
          Opened {longWhen(t.at)} UTC
        </p>

        <section className="ol-trace-verdict" data-tone={VERDICT_TONE[replayed.verdict]}>
          <i className="ol-swatch" data-tone={VERDICT_TONE[replayed.verdict]} aria-hidden />
          <div>
            <p className="ol-trace-lead">{sentence.lead}</p>
            <p>{sentence.more}</p>
            {k !== 'closedByHand' && <p className="ol-trace-aside">It wasn’t closed by hand, so it isn’t in the partition. The replay still checks it.</p>}
          </div>
        </section>

        <section className="ol-trace-section" aria-label="Rules">
          <h3>Rules for {serviceName(t.serviceId)}</h3>
          {replayed.checks.length === 0 ? (
            <p className="ol-trace-none">This service has no rules to replay.</p>
          ) : (
            <ul className="ol-checks">
              {replayed.checks.map((c) => (
                <Check key={c.rule.id} c={c} />
              ))}
            </ul>
          )}
        </section>

        <section className="ol-trace-section" aria-label="Change windows">
          <h3>Approved change windows</h3>
          {replayed.calendar !== 'there' ? (
            <p className="ol-trace-window" data-state="unavailable">
              <CloudOff size={14} aria-hidden />
              <span>
                <b>Calendar unavailable</b> for {day(replayed.calendar.from)} to {day(replayed.calendar.to - 1)}. {replayed.calendar.why}
              </span>
            </p>
          ) : replayed.window ? (
            <p className="ol-trace-window" data-state="covered">
              <CalendarClock size={14} aria-hidden />
              <span>
                <b>
                  <code>{replayed.window.window.id}</code> {replayed.window.window.name}
                </b>{' '}
                ran {clock(replayed.window.run[0])} to {clock(replayed.window.run[1])} that day. {replayed.window.window.schedule}.
              </span>
              <a className="mn-icon-btn ol-check-link" href={`#/changes/${replayed.window.window.id}`} aria-label={`Open ${replayed.window.window.id} in Change windows`} title="Open in Change windows">
                <ArrowUpRight size={14} />
              </a>
            </p>
          ) : (
            <p className="ol-trace-none">No approved window covered {t.ci} when it arrived.</p>
          )}
        </section>

        <p className="ol-caveat ol-trace-caveat">
          {basis === 'today' ? 'Replayed with the rules and windows as they stand today.' : `Replayed with the rules and windows as they stood on ${day(basis)}, when the extract ran.`} It doesn’t show what was running
          on {day(t.at)}, or that this ticket would have been suppressed.
        </p>
      </div>
    </aside>
  );
}
