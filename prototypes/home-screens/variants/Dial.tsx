/* Dial: the hour as one instrument.
 *
 * Sixty minutes round a ring, now at the top, the past running back anticlockwise. The ring
 * is the waterline the Alerts page talks about: every alert that reached a person rises
 * outside it as a bright point, every alert that joined an open incident sits just past
 * those, and everything the rules hid sinks inside it. The whole dial turns as the minutes
 * pass, so the hour slides away to the left and a new alert rises at the top.
 *
 * The figure sits in the middle. The group of whatever is waiting on you stays bright; the
 * rest of the hour dims behind it. Point at a minute to read it. */

import { useMemo, useRef, useState } from 'react';
import { MINUTE } from '../../../src/pages/alerts/data/mockData';
import { clock } from '../../../src/pages/alerts/hooks/useAlertStream';
import { clockFace, plural } from '../../../src/pages/home/model/station';
import { Figure, FONT, Hello, Keys, MONO, NeedBlock, TONE_INK, useArrivals, useCanvas, useRepaint, still, type HomeProps } from '../shared';
import { num } from '../../../src/lib/format';

const STEP = 5; // px between points in a stack
const DOT = 1.7;
const GAP = 0.18; // radians left empty either side of now

export function Dial({ data, at, need, theme }: HomeProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const born = useArrivals(data, 6);
  const [read, setRead] = useState<{ minute: number; x: number; y: number } | null>(null);
  const geo = useRef({ cx: 0, cy: 0, r: 0, now: data.now });

  /** Each alert's place: which minute back it arrived in (0 = this one), and its turn in that minute's stack. */
  const stacks = useMemo(() => {
    const byMinute = new Map<number, typeof data.alerts>();
    for (const a of data.alerts) {
      const m = Math.floor(a.at / MINUTE);
      byMinute.set(m, [...(byMinute.get(m) ?? []), a]);
    }
    return byMinute;
  }, [data.alerts]);

  const live = useRef({ data, stacks, need, read });
  live.current = { data, stacks, need, read };

  useCanvas(canvas, (ctx, { w, h }, t, ink) => {
    const { data, stacks, need, read } = live.current;
    const now = still() ? data.now : clock();
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.max(120, Math.min(w, h) * 0.3);
    geo.current = { cx, cy, r, now };
    const focus = need?.groupId ?? null;

    /** Minutes ago → angle, with now at the top and the past going anticlockwise. */
    const angle = (ago: number) => -Math.PI / 2 - GAP - (ago / 60) * (Math.PI * 2 - GAP * 2);
    const at = (a: number, rad: number) => [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad] as const;

    // The minute marks, and a longer one every quarter of an hour.
    const labels: (() => void)[] = [];
    ctx.lineWidth = 1;
    for (let m = 0; m <= 60; m++) {
      const minuteStart = Math.floor(now / MINUTE) - m;
      const ago = (now - minuteStart * MINUTE) / MINUTE;
      if (ago > 60) continue;
      const a = angle(ago);
      const quarter = minuteStart % 15 === 0;
      const [x0, y0] = at(a, r - (quarter ? 7 : 3));
      const [x1, y1] = at(a, r + (quarter ? 7 : 3));
      ctx.strokeStyle = quarter ? ink.line3 : ink.line2;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      if (quarter) {
        const [lx, ly] = at(a, r + 22);
        ctx.font = `400 11px ${MONO}`;
        const label = clockFace(minuteStart * MINUTE);
        const lw = ctx.measureText(label).width + 8;
        // Quarter labels sit over the points, on a patch of the page so they stay readable.
        labels.push(() => {
          ctx.fillStyle = ink.l2;
          ctx.fillRect(lx - lw / 2, ly - 8, lw, 16);
          ctx.font = `400 11px ${MONO}`;
          ctx.fillStyle = ink.fg3;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, lx, ly);
        });
      }
    }

    // The waterline itself.
    ctx.strokeStyle = ink.line2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, angle(60), angle(0));
    ctx.stroke();

    // Now: a short hand at the top.
    ctx.strokeStyle = ink.fg;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r - 30);
    ctx.lineTo(cx, cy - r + 30);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.font = `500 11px ${FONT}`;
    ctx.fillStyle = ink.fg2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Now', cx, cy - r - 36);

    // Every alert, stacked in its minute.
    for (const [minute, alerts] of stacks) {
      let out = 0;
      let inn = 0;
      const ordered = [...alerts].sort((a, b) => rank(a.outcome) - rank(b.outcome));
      for (const alert of ordered) {
        // A minute's alerts stand in one spoke, at the middle of their minute.
        const ago = (now - (minute + 0.5) * MINUTE) / MINUTE;
        if (ago < 0 || ago > 60) continue;
        const b = born.current.get(alert.id);
        const age = b === undefined ? Infinity : t - b;
        if (age < 0) continue;
        const a = angle(ago);
        const rise = Math.min(1, age / 700);
        const lift = still() ? 1 : 1 - Math.pow(1 - rise, 3);
        const dim = focus && alert.groupId !== focus;
        const hot = read?.minute === minute;
        let rad: number;
        if (alert.outcome === 'hidden') rad = r - 10 - inn++ * STEP;
        else rad = r + 10 + out++ * STEP;
        rad = r + (rad - r) * lift;
        const [x, y] = at(a, rad);
        ctx.globalAlpha = dim && !hot ? 0.28 : 1;
        ctx.fillStyle =
          alert.wouldHide && need?.kind === 'Proposed rule' && alert.ruleId === need.key
            ? ink[TONE_INK[need.tone]]
            : alert.outcome === 'paged'
              ? ink.fg
              : alert.outcome === 'folded'
                ? ink.tone2
                : hot
                  ? ink.fg2
                  : ink.tone3;
        ctx.beginPath();
        ctx.arc(x, y, alert.outcome === 'paged' ? DOT + 0.6 : DOT, 0, Math.PI * 2);
        ctx.fill();
        // Just arrived: a ring where it rises.
        if (!still() && age < 900) {
          ctx.globalAlpha = 1 - age / 900;
          ctx.strokeStyle = alert.outcome === 'hidden' ? ink.green : ink.fg;
          ctx.beginPath();
          ctx.arc(x, y, 3 + (age / 900) * 9, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }
    for (const draw of labels) draw();
  });
  useRepaint(canvas, [data, stacks, need, read, theme]);

  // Point at the dial: which minute is that?
  const onMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const { cx, cy, r, now } = geo.current;
    const dx = e.clientX - rect.left - cx;
    const dy = e.clientY - rect.top - cy;
    const dist = Math.hypot(dx, dy);
    if (dist < r * 0.55 || dist > r * 1.6) return setRead(null);
    let a = -Math.PI / 2 - Math.atan2(dy, dx); // anticlockwise from the top
    a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const ago = ((a - GAP) / (Math.PI * 2 - GAP * 2)) * 60;
    if (ago < 0 || ago > 60) return setRead(null);
    setRead({ minute: Math.floor((now - ago * MINUTE) / MINUTE), x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const minute = read ? (stacks.get(read.minute) ?? []) : [];
  const paged = minute.filter((a) => a.outcome === 'paged').length;
  const hidden = minute.filter((a) => a.outcome === 'hidden').length;

  return (
    <div className="hs-dial">
      <div className="hs-dial-head">
        <Hello now={data.now} />
        <p className="hs-dial-legend" aria-hidden>
          <span>
            <i data-k="paged" /> Reached a person
          </span>
          <span>
            <i data-k="folded" /> Joined an open incident
          </span>
          <span>
            <i data-k="hidden" /> Hidden by a rule
          </span>
        </p>
      </div>

      <div className="hs-dial-face" onPointerMove={onMove} onPointerLeave={() => setRead(null)}>
        <canvas ref={canvas} className="hs-canvas" aria-hidden />
        <div className="hs-dial-centre">
          <Figure data={data} />
          <p>
            reached a person this hour
            <br />
            out of <b>{num(data.counts.total)}</b>
          </p>
        </div>
        {read && (
          <div className="hs-tip" style={{ left: read.x, top: read.y }} role="status">
            <b className="mn-mono">{clockFace(read.minute * MINUTE)}</b>
            <span>{minute.length ? `${plural(minute.length, 'alert')}, ${num(paged)} reached a person, ${num(hidden)} hidden` : 'Nothing arrived'}</span>
          </div>
        )}
      </div>

      <div className="hs-dial-foot">
        <NeedBlock data={data} at={at} need={need} />
        <Keys show={data.queue.length > 1} />
      </div>
    </div>
  );
}

const rank = (o: string) => (o === 'paged' ? 0 : o === 'folded' ? 1 : 2);
