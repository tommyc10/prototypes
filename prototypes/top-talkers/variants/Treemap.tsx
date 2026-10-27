/* 2 Treemap: top talkers on Home, under what's waiting on you. Each service is a tile, and its
 * area is its share of the last four weeks' tickets, incidents or rules, so the loudest is
 * the biggest thing in the card before you've read a word. Switching the measure morphs the
 * tiles to their new sizes; a tile opens that service in the Hindcast. */

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { HomePage } from '../../../src/pages/home/HomePage';
import { num, pct } from '../../../src/lib/format';
import { Tip } from '../../../src/pages/hindcast/components/charts/Tip';
import { useSize } from '../../../src/pages/hindcast/hooks/useSize';
import { snapNextChange, useTweenedNumbers } from '../../../src/pages/hindcast/hooks/useTween';
import { MEASURES, hrefs, measureOf, ranked, valueOf, words, type Measure, type Talker } from '../model';
import { MeasureSeg, MountInto, useTalkers } from '../shared';

const WEEKS = 4;
const HEIGHT = 196;

export function Treemap() {
  return (
    <>
      <HomePage />
      <MountInto selector=".hm-col">
        <TalkerMap />
      </MountInto>
    </>
  );
}

function TalkerMap() {
  const [measure, setMeasure] = useState<Measure>('tickets');
  const [hover, setHover] = useState<string | null>(null);
  const list = useTalkers(WEEKS);
  const order = useMemo(() => ranked(list, measure).filter((t) => valueOf(t, measure) > 0), [list, measure]);
  const [ref, { width }] = useSize<HTMLDivElement>();

  // S cycles the measure. A key lands at once; only the pointer's switch morphs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== 's' || e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || document.querySelector('[cmdk-dialog]')) return;
      snapNextChange();
      setMeasure((m) => MEASURES[(MEASURES.findIndex((x) => x.key === m) + 1) % MEASURES.length]!.key);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const target = useMemo(() => {
    const rects = squarify(order.map((t) => ({ id: t.id, value: valueOf(t, measure) })), width || 1, HEIGHT);
    const flat: Record<string, number> = {};
    for (const t of list) {
      const r = rects[t.id] ?? { x: (rects[order.at(-1)!.id]?.x ?? 0) + (rects[order.at(-1)!.id]?.w ?? 0), y: HEIGHT, w: 0, h: 0 };
      flat[`${t.id}.x`] = r.x;
      flat[`${t.id}.y`] = r.y;
      flat[`${t.id}.w`] = r.w;
      flat[`${t.id}.h`] = r.h;
    }
    return flat;
  }, [list, order, measure, width]);
  const shown = useTweenedNumbers(target);

  const m = measureOf(measure);
  const total = order.reduce((n, t) => n + valueOf(t, measure), 0);
  const rank = new Map(order.map((t, i) => [t.id, i]));
  const hovered = list.find((t) => t.id === hover);
  const hr = hovered && { x: shown[`${hovered.id}.x`]!, y: shown[`${hovered.id}.y`]!, w: shown[`${hovered.id}.w`]! };

  return (
    <section className="tt-map-card" aria-labelledby="tt-map-title">
      <header className="tt-map-head">
        <h2 id="tt-map-title">Loudest services</h2>
        <span className="tt-map-meta">Last {WEEKS} weeks</span>
        <span className="tt-map-tools">
          <MeasureSeg value={measure} onChange={setMeasure} />
          <kbd title="Rank by the next measure">S</kbd>
        </span>
      </header>

      <div className="tt-map" ref={ref} style={{ height: HEIGHT }} onPointerLeave={() => setHover(null)}>
        {width > 0 &&
          list.map((t) => {
            const x = shown[`${t.id}.x`]!;
            const y = shown[`${t.id}.y`]!;
            const w = shown[`${t.id}.w`]!;
            const h = shown[`${t.id}.h`]!;
            if (w < 1 || h < 1) return null;
            const i = rank.get(t.id) ?? order.length;
            const v = valueOf(t, measure);
            return (
              <a
                key={t.id}
                className="tt-tile"
                href={hrefs.hindcast(t.id)}
                data-size={w >= 60 && h >= 52 ? 'full' : w > 34 && h > 24 ? 'figure' : 'none'}
                data-lead={i === 0 || undefined}
                style={{ transform: `translate(${x}px, ${y}px)`, width: w, height: h, '--shade': `${Math.max(3, 15 - i * 1.6)}%` } as CSSProperties}
                aria-label={`${t.name}: ${num(v)} ${words(v, measure)}, ${pct(total ? v / total : 0)}. Open in the Hindcast.`}
                onPointerEnter={() => setHover(t.id)}
                onFocus={() => setHover(t.id)}
                onBlur={() => setHover(null)}
              >
                <span className="tt-tile-name">{t.name}</span>
                <b>{num(v)}</b>
              </a>
            );
          })}
        {hovered && hr && (
          <Tip
            x={hr.x + hr.w / 2}
            y={hr.y + 8}
            flip={hr.x + hr.w / 2 > width / 2}
            title={hovered.name}
            rows={[
              { value: num(hovered.tickets), label: words(hovered.tickets, 'tickets'), tone: measure === 'tickets' ? 'var(--fg)' : undefined },
              { value: num(hovered.incidents), label: words(hovered.incidents, 'incidents'), tone: measure === 'incidents' ? 'var(--fg)' : undefined },
              { value: num(hovered.rules.total), label: `${words(hovered.rules.total, 'rules')}, ${hovered.rules.active} active`, tone: measure === 'rules' ? 'var(--fg)' : undefined },
            ]}
            foot="Open in the Hindcast"
          />
        )}
      </div>

      <p className="tt-map-say">
        <Saying order={order} measure={measure} total={total} /> {/* Prototype: the Services page is variant 1, Board. */}<a className="tt-map-all" href="?v=1">See every service</a>
      </p>
      <p className="mn-sr" aria-live="polite">
        Ranked by {m.many}
      </p>
    </section>
  );
}

/** The sentence under the map: who the map says is loudest, in plain words. */
function Saying({ order, measure, total }: { order: Talker[]; measure: Measure; total: number }) {
  const [a, b] = order;
  if (!a) return <>Nothing raised in the last {WEEKS} weeks.</>;
  const va = valueOf(a, measure);
  if (measure === 'rules') {
    const tied = order.filter((t) => t.rules.total === va);
    return tied.length > 1 ? (
      <>
        {tied.map((t, i) => (
          <span key={t.id}>
            {i > 0 && (i === tied.length - 1 ? ' and ' : ', ')}
            <b>{t.name}</b>
          </span>
        ))}{' '}
        have the most rules, <b>{va}</b> each.
      </>
    ) : (
      <>
        <b>{a.name}</b> has the most rules, <b>{va}</b>.
      </>
    );
  }
  const two = va + (b ? valueOf(b, measure) : 0);
  return (
    <>
      <b>{a.name}</b>
      {b && (
        <>
          {' '}
          and <b>{b.name}</b>
        </>
      )}{' '}
      raised <b>{pct(total ? two / total : 0)}</b> of every {measureOf(measure).one}.
    </>
  );
}

type Rect = { x: number; y: number; w: number; h: number };

/** Squarified treemap (Bruls, Huizing and van Wijk): tiles as close to square as the values
 *  allow, biggest in the top left, each 1px in from its neighbours so a 2px gap shows. */
function squarify(items: { id: string; value: number }[], width: number, height: number): Record<string, Rect> {
  const out: Record<string, Rect> = {};
  const sum = items.reduce((n, i) => n + i.value, 0);
  if (!sum) return out;
  const scale = (width * height) / sum;
  const areas = items.map((i) => ({ id: i.id, a: i.value * scale }));
  let box = { x: 0, y: 0, w: width, h: height };

  const worst = (row: number[], side: number) => {
    const s = row.reduce((n, a) => n + a, 0);
    return Math.max((side * side * Math.max(...row)) / (s * s), (s * s) / (side * side * Math.min(...row)));
  };
  const place = (row: typeof areas) => {
    const s = row.reduce((n, r) => n + r.a, 0);
    if (box.w >= box.h) {
      const cw = s / box.h;
      let y = box.y;
      for (const r of row) {
        const h = r.a / cw;
        out[r.id] = { x: box.x, y, w: cw, h };
        y += h;
      }
      box = { x: box.x + cw, y: box.y, w: box.w - cw, h: box.h };
    } else {
      const rh = s / box.w;
      let x = box.x;
      for (const r of row) {
        const w = r.a / rh;
        out[r.id] = { x, y: box.y, w, h: rh };
        x += w;
      }
      box = { x: box.x, y: box.y + rh, w: box.w, h: box.h - rh };
    }
  };

  let row: typeof areas = [];
  for (const item of areas) {
    const side = Math.min(box.w, box.h);
    if (!row.length || worst([...row, item].map((r) => r.a), side) <= worst(row.map((r) => r.a), side)) row.push(item);
    else {
      place(row);
      row = [item];
    }
  }
  if (row.length) place(row);

  for (const id in out) {
    const r = out[id]!;
    out[id] = { x: r.x + 1, y: r.y + 1, w: Math.max(0, r.w - 2), h: Math.max(0, r.h - 2) };
  }
  return out;
}
