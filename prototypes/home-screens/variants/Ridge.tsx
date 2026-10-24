/* Ridge: every group's hour as a ridgeline.
 *
 * Nine lines, one per assignment group, stacked so each one's peaks rise in front of the
 * line behind it. The height of a line is how many alerts that group sent at that moment;
 * the bright points on it are the ones that reached a person. The whole field drifts left as
 * the hour moves, and an alert arriving swells its line at the right-hand edge.
 *
 * The group of whatever is waiting on you is drawn bright; point at another line to read it,
 * click it to see what's waiting for that group. */

import { useMemo, useRef, useState } from 'react';
import { num } from '../../../src/lib/format';
import { MINUTE, WINDOW } from '../../../src/pages/alerts/data/mockData';
import { clock } from '../../../src/pages/alerts/hooks/useAlertStream';
import { GROUPS } from '../../../src/pages/rule-management/data/mockData';
import { clockFace, plural, toneOf, TONE_COLOR } from '../../../src/pages/home/model/station';
import { Figure, Hello, Keys, Lead, NeedBlock, TONE_INK, still, useArrivals, useCanvas, useRepaint, type HomeProps } from '../shared';

const LEFT = 176; // room for the names
const RIGHT = 104; // room for the counts
const SAMPLES = 150;
const SIGMA = 0.9 * MINUTE;

export function Ridge({ data, at, need, pickGroup, theme }: HomeProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const born = useArrivals(data, 6);
  const [height, setHeight] = useState(480);
  const [hover, setHover] = useState<string | null>(null);
  const peak = useRef(0);

  // The groups in a fixed order, so lines don't swap places when the counts change.
  const rows = useMemo(() => GROUPS.map((g) => data.groups.find((r) => r.group.id === g.id)!).filter(Boolean), [data.groups]);
  const byGroup = useMemo(() => {
    const map = new Map<string, typeof data.alerts>();
    for (const a of data.alerts) map.set(a.groupId, [...(map.get(a.groupId) ?? []), a]);
    return map;
  }, [data.alerts]);

  const field = { top: 64, bottom: height - 34 };
  const spacing = (field.bottom - field.top) / rows.length;
  const baseline = (i: number) => field.top + (i + 1) * spacing;

  const live = useRef({ data, rows, byGroup, need, hover });
  live.current = { data, rows, byGroup, need, hover };

  useCanvas(canvas, (ctx, { w, h }, t, ink) => {
    if (Math.abs(h - height) > 1) queueMicrotask(() => setHeight(h));
    const { data, rows, byGroup, need, hover } = live.current;
    const now = still() ? data.now : clock();
    const top = 64;
    const bottom = h - 34;
    const gap = (bottom - top) / rows.length;
    const x0 = LEFT;
    const x1 = w - RIGHT;
    const xAt = (ms: number) => x1 - ((now - ms) / WINDOW) * (x1 - x0);
    const focus = hover ?? need?.groupId ?? null;

    // Each line's height at each sample: alerts as soft bumps, a new one swelling in.
    const lines = rows.map((row) => {
      const alerts = byGroup.get(row.group.id) ?? [];
      const ys = new Float32Array(SAMPLES);
      for (const a of alerts) {
        const b = born.current.get(a.id);
        const age = b === undefined ? Infinity : t - b;
        if (age < 0) continue;
        const grow = still() ? 1 : Math.min(1, age / 700);
        for (let s = 0; s < SAMPLES; s++) {
          const ms = now - WINDOW + (s / (SAMPLES - 1)) * WINDOW;
          const d = (ms - a.at) / SIGMA;
          if (d > -4 && d < 4) ys[s] += Math.exp(-0.5 * d * d) * grow;
        }
      }
      return ys;
    });
    let max = 0;
    for (const ys of lines) for (const y of ys) max = Math.max(max, y);
    peak.current = peak.current ? peak.current + (max - peak.current) * 0.05 : max;
    const amp = gap * 2.8;
    const scale = amp / Math.max(1, peak.current);

    // The time axis.
    ctx.font = `400 11px 'Geist Mono Variable', ui-monospace, monospace`;
    ctx.fillStyle = ink.fg3;
    ctx.textBaseline = 'alphabetic';
    for (let m = 0; m <= 60; m += 15) {
      const ms = Math.floor(now / (15 * MINUTE)) * 15 * MINUTE - m * MINUTE;
      const x = xAt(ms);
      if (x < x0 + 20) continue;
      ctx.textAlign = 'center';
      ctx.fillText(clockFace(ms), x, h - 10);
      ctx.strokeStyle = ink.line;
      ctx.beginPath();
      ctx.moveTo(Math.round(x) + 0.5, top);
      ctx.lineTo(Math.round(x) + 0.5, bottom);
      ctx.stroke();
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = ink.fg2;
    ctx.fillText('Now', x1, h - 10);

    // Back to front: each line hides what's behind its peaks.
    rows.forEach((row, i) => {
      const base = top + (i + 1) * gap;
      const ys = lines[i];
      const px = (s: number) => x0 + (s / (SAMPLES - 1)) * (x1 - x0);
      const py = (s: number) => base - ys[s] * scale;
      ctx.beginPath();
      ctx.moveTo(x0, base);
      for (let s = 0; s < SAMPLES; s++) ctx.lineTo(px(s), py(s));
      ctx.lineTo(x1, base);
      ctx.closePath();
      ctx.fillStyle = ink.l2;
      ctx.fill();

      const bright = focus === row.group.id;
      ctx.beginPath();
      ctx.moveTo(x0, py(0));
      for (let s = 1; s < SAMPLES; s++) ctx.lineTo(px(s), py(s));
      ctx.strokeStyle = bright ? ink.fg : focus ? ink.tone3 : ink.tone2;
      ctx.lineWidth = bright ? 1.5 : 1;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // The pages, as points on the line.
      for (const a of byGroup.get(row.group.id) ?? []) {
        if (a.outcome !== 'paged') continue;
        const b = born.current.get(a.id);
        if (b !== undefined && t < b) continue;
        const x = xAt(a.at);
        if (x < x0 || x > x1) continue;
        const s = Math.round(((x - x0) / (x1 - x0)) * (SAMPLES - 1));
        const mine = need?.kind === 'Proposed rule' && a.ruleId === need.key;
        ctx.fillStyle = mine ? ink[TONE_INK[need!.tone]] : bright ? ink.fg : focus ? ink.tone2 : ink.fg2;
        ctx.beginPath();
        ctx.arc(x, py(s), bright || mine ? 2.6 : 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  });
  useRepaint(canvas, [data, need, hover, theme]);

  const onMove = (e: React.PointerEvent) => {
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
    if (y < field.top || y > field.bottom + 8) return setHover(null);
    const i = Math.max(0, Math.min(rows.length - 1, Math.round((y - field.top) / spacing - 0.6)));
    setHover(rows[i].group.id);
  };

  const shown = rows.find((r) => r.group.id === hover);

  return (
    <div className="hs-ridge">
      <div className="hs-ridge-head">
        <Hello now={data.now} />
        <div className="hs-ridge-figure">
          <Figure data={data} />
          <Lead data={data} />
        </div>
      </div>

      <div className="hs-ridge-field" onPointerMove={onMove} onPointerLeave={() => setHover(null)} onClick={() => hover && pickGroup(hover)}>
        <canvas ref={canvas} className="hs-canvas" aria-hidden />
        {rows.map((row, i) => {
          const tone = toneOf(row);
          const on = (hover ?? need?.groupId) === row.group.id;
          return (
            <div key={row.group.id} className="hs-ridge-row" style={{ top: baseline(i) - 20 }} data-on={on || undefined}>
              <button
                className="hs-ridge-name"
                onClick={() => pickGroup(row.group.id)}
                onFocus={() => setHover(row.group.id)}
                onBlur={() => setHover(null)}
                aria-label={`${row.group.name}: ${plural(row.paged, 'page')} from ${plural(row.total, 'alert')} this hour`}
              >
                {row.group.name}
              </button>
              <span className="hs-ridge-count" aria-hidden>
                {tone && <i style={{ background: TONE_COLOR[tone] }} />}
                {num(row.paged)}
              </span>
            </div>
          );
        })}
        <p className="hs-ridge-caption" aria-live="polite">
          {shown ? (
            <>
              <b>{shown.group.name}</b> {shown.group.unit} · {plural(shown.paged, 'page')} from {plural(shown.total, 'alert')}
              {shown.proposed > 0 && ` · ${plural(shown.proposed, 'rule')} waiting`}
            </>
          ) : (
            'Pages this hour, by group'
          )}
        </p>
      </div>

      <div className="hs-ridge-foot">
        <NeedBlock data={data} at={at} need={need} />
        <Keys show={data.queue.length > 1} />
      </div>
    </div>
  );
}
