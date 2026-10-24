/* Sieve: the hour, falling through the rules.
 *
 * Every alert of the last hour is a bead. Each active rule is a shelf, and the alerts it hid
 * rest on it, oldest first. Alerts that joined an incident already open gather in clumps, one
 * per incident. What nobody hid falls to the floor, and the floor is the figure: those are the
 * alerts that reached a person. A new alert drops in from the top and lands where it belongs;
 * one a rule caught flashes green as it lands.
 *
 * When the thing waiting on you is a proposed rule, the beads it fits light in its status
 * colour, so you can see what approving it would take off the floor. */

import { useMemo, useRef, useState } from 'react';
import { num } from '../../../src/lib/format';
import { navigate } from '../../../src/lib/route';
import type { StreamAlert } from '../../../src/pages/alerts/model/types';
import type { Station } from '../../../src/pages/home/model/station';
import { still, Figure, FONT, Hello, Keys, Lead, NeedBlock, TONE_INK, easeOut, useArrivals, useCanvas, useRepaint, type HomeProps } from '../shared';

const PITCH = 7; // a bead and its gap
const BEAD = 2.5;
const FLOOR_PITCH = 10;
const FLOOR_BEAD = 3.5;
const MAX_SHELVES = 6;
const FALL = 1100; // ms from the top to a shelf
const SETTLE = 900;

type Kind = 'hidden' | 'folded' | 'paged';

interface Shelf {
  key: string;
  name: string;
  /** Where to go when it's picked. */
  href: string;
  count: number;
  labelY: number;
  lineY: number;
}

interface Layout {
  shelves: Shelf[];
  foldedLabelY: number;
  foldedLineY: number;
  floorY: number;
  height: number;
  slots: Map<string, { x: number; y: number; kind: Kind; shelf: string }>;
}

function layout(data: Station, w: number): Layout {
  const perRow = Math.max(8, Math.floor(w / PITCH));
  const slots: Layout['slots'] = new Map();
  const byAge = [...data.alerts].sort((a, b) => a.at - b.at);

  // The rules that hid something this hour, busiest first; the quiet ones share a shelf.
  const hiddenBy = new Map<string, StreamAlert[]>();
  for (const a of byAge) if (a.outcome === 'hidden' && a.rule) hiddenBy.set(a.rule.id, [...(hiddenBy.get(a.rule.id) ?? []), a]);
  const ranked = [...hiddenBy.entries()].sort((a, b) => b[1].length - a[1].length);
  const own = ranked.slice(0, MAX_SHELVES - (ranked.length > MAX_SHELVES ? 1 : 0));
  const rest = ranked.slice(own.length);
  const groups: { key: string; name: string; href: string; alerts: StreamAlert[] }[] = own.map(([id, alerts]) => ({
    key: id,
    name: alerts[0].rule!.name,
    href: `#/rules/${id}`,
    alerts,
  }));
  if (rest.length)
    groups.push({
      key: 'rest',
      name: `${rest.length} more rules`,
      href: '#/rules',
      alerts: rest.flatMap(([, a]) => a).sort((a, b) => a.at - b.at),
    });

  let y = 44;
  const shelves: Shelf[] = groups.map((g) => {
    const labelY = y;
    y += 22;
    const rows = Math.max(1, Math.ceil(g.alerts.length / perRow));
    g.alerts.forEach((a, i) => {
      const row = Math.floor(i / perRow);
      slots.set(a.id, { x: (i % perRow) * PITCH + PITCH / 2, y: y + (rows - 1 - row) * PITCH + PITCH / 2, kind: 'hidden', shelf: g.key });
    });
    y += rows * PITCH + 3;
    const shelf = { key: g.key, name: g.name, href: g.href, count: g.alerts.length, labelY, lineY: y };
    y += 18;
    return shelf;
  });

  // Folded: one clump per incident, a gap between clumps.
  const foldedLabelY = y + 8;
  y = foldedLabelY + 22;
  const byIncident = new Map<string, StreamAlert[]>();
  for (const a of byAge) if (a.outcome === 'folded') byIncident.set(a.incidentId, [...(byIncident.get(a.incidentId) ?? []), a]);
  const order: (StreamAlert | null)[] = [];
  for (const alerts of byIncident.values()) order.push(...alerts, null);
  order.pop();
  const foldedRows = Math.max(1, Math.ceil(order.length / perRow));
  order.forEach((a, i) => {
    if (!a) return;
    const row = Math.floor(i / perRow);
    slots.set(a.id, { x: (i % perRow) * PITCH + PITCH / 2, y: y + (foldedRows - 1 - row) * PITCH + PITCH / 2, kind: 'folded', shelf: 'folded' });
  });
  y += foldedRows * PITCH + 3;
  const foldedLineY = y;

  // The floor: everything that reached a person, bigger, nearest you.
  y += 40;
  const floorPerRow = Math.max(8, Math.floor(w / FLOOR_PITCH));
  const paged = byAge.filter((a) => a.outcome === 'paged');
  const floorRows = Math.max(1, Math.ceil(paged.length / floorPerRow));
  paged.forEach((a, i) => {
    const row = Math.floor(i / floorPerRow);
    slots.set(a.id, { x: (i % floorPerRow) * FLOOR_PITCH + FLOOR_PITCH / 2, y: y + (floorRows - 1 - row) * FLOOR_PITCH + FLOOR_PITCH / 2, kind: 'paged', shelf: 'floor' });
  });
  y += floorRows * FLOOR_PITCH + 3;
  return { shelves, foldedLabelY, foldedLineY, floorY: y, height: y + 2, slots };
}

/** A cheap repeatable number between -1 and 1 from an id, for where a bead starts falling. */
const jitter = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h % 1000) / 1000) * 2 - 1;
};

export function Sieve({ data, at, need, theme }: HomeProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  const [hover, setHover] = useState<string | null>(null);
  const born = useArrivals(data, 10);
  const shown = useRef(new Map<string, { x: number; y: number }>());

  const plan = useMemo(() => layout(data, width), [data, width]);
  const fits = need?.kind === 'Proposed rule' ? need.key : null;
  const lit = fits ? data.alerts.filter((a) => a.ruleId === fits && a.outcome !== 'hidden') : [];
  const litPaged = lit.filter((a) => a.outcome === 'paged').length;

  const live = useRef({ data, plan, hover, fits, need });
  live.current = { data, plan, hover, fits, need };

  useCanvas(canvas, (ctx, { w }, t, ink) => {
    if (Math.abs(w - width) > 1) queueMicrotask(() => setWidth(w));
    const { data, plan, hover, fits, need } = live.current;
    const reduce = still();

    // The inlet, the shelves, the floor.
    ctx.lineWidth = 1;
    ctx.strokeStyle = ink.line;
    ctx.beginPath();
    ctx.moveTo(0, 22.5);
    ctx.lineTo(w, 22.5);
    for (const s of plan.shelves) {
      ctx.moveTo(0, s.lineY + 0.5);
      ctx.lineTo(w, s.lineY + 0.5);
    }
    ctx.moveTo(0, plan.foldedLineY + 0.5);
    ctx.lineTo(w, plan.foldedLineY + 0.5);
    ctx.stroke();
    ctx.strokeStyle = ink.line3;
    ctx.beginPath();
    ctx.moveTo(0, plan.floorY + 0.5);
    ctx.lineTo(w, plan.floorY + 0.5);
    ctx.stroke();

    ctx.font = `400 12px ${FONT}`;
    ctx.fillStyle = ink.fg3;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Arriving', 0, 14);
    ctx.fillText('Joined an incident already open', 0, plan.foldedLabelY + 13);

    const tone = need ? ink[TONE_INK[need.tone]] : ink.fg;
    for (const a of data.alerts) {
      const slot = plan.slots.get(a.id);
      if (!slot) continue;
      const b = born.current.get(a.id);
      const age = b === undefined ? Infinity : t - b;
      if (age < 0) continue; // a stand-in that hasn't dropped yet

      // Where it is: falling, or sliding to its slot when the shelf shifts.
      let x = slot.x;
      let y = slot.y;
      const fall = FALL + slot.y * 0.6;
      if (!reduce && age < fall) {
        const p = age / fall;
        const x0 = slot.x + jitter(a.id) * 60;
        x = x0 + (slot.x - x0) * easeOut(p);
        y = 14 + (slot.y - 14) * p * p;
      } else {
        const was = shown.current.get(a.id);
        if (was && !reduce) {
          x = was.x + (slot.x - was.x) * 0.12;
          y = was.y + (slot.y - was.y) * 0.12;
        }
      }
      shown.current.set(a.id, { x, y });

      const r = slot.kind === 'paged' ? FLOOR_BEAD : BEAD;
      const mine = fits !== null && a.ruleId === fits;
      const onHover = hover !== null && slot.shelf === hover;
      ctx.fillStyle = mine
        ? tone
        : slot.kind === 'paged'
          ? ink.fg
          : slot.kind === 'folded'
            ? ink.tone2
            : onHover
              ? ink.fg2
              : ink.tone3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      // Landing: a caught alert flashes green, one that reached a person rings.
      const since = age - fall;
      if (!reduce && since >= 0 && since < SETTLE) {
        const p = since / SETTLE;
        ctx.globalAlpha = 1 - p;
        if (slot.kind === 'hidden') {
          ctx.fillStyle = ink.green;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = slot.kind === 'hidden' ? ink.green : ink.fg;
        ctx.beginPath();
        ctx.arc(x, y, r + 2 + p * 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    // Forget beads that have left the hour.
    if (shown.current.size > data.alerts.length + 50) {
      const now = new Set(data.alerts.map((a) => a.id));
      for (const id of shown.current.keys()) if (!now.has(id)) shown.current.delete(id);
    }
  });
  useRepaint(canvas, [data, plan, hover, need, theme]);

  return (
    <div className="hs-sieve">
      <div className="hs-sieve-words">
        <Hello now={data.now} />
        <NeedBlock data={data} at={at} need={need} />
        <Keys show={data.queue.length > 1} />
      </div>

      <div className="hs-sieve-machine">
        <div ref={box} className="hs-sieve-box" style={{ height: plan.height }}>
          <canvas ref={canvas} className="hs-canvas" aria-hidden />
          {plan.shelves.map((s) => (
            <button
              key={s.key}
              className="hs-shelf"
              style={{ top: s.labelY }}
              data-hover={hover === s.key || undefined}
              onPointerEnter={() => setHover(s.key)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(s.key)}
              onBlur={() => setHover(null)}
              onClick={() => navigate(s.href)}
            >
              <span className="hs-shelf-name">{s.name}</span>
              <span className="hs-shelf-count">hid {num(s.count)}</span>
            </button>
          ))}
        </div>
        <div className="hs-sieve-floor">
          <Figure data={data} />
          <div>
            <Lead data={data} />
            {fits && litPaged > 0 && (
              <p className="hs-sieve-note">
                <i style={{ background: `var(--${TONE_INK[need!.tone]})` }} aria-hidden />
                <span>
                  <span className="mn-mono">{need!.key}</span> would have hidden {litPaged === 1 ? 'one of these' : `${num(litPaged)} of these`}.
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
