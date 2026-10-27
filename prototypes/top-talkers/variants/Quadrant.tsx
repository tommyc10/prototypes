/* 3 Quadrant: top talkers on the Hindcast, as a panel beside the weekly chart. Every service
 * is a point: across, how many rules it has; up, how many tickets (or incidents) it raised
 * in the page's lookback. The loudest are at the top, and the ones at the top left are loud
 * with few rules, which is where tuning pays. Picking a point scopes the whole page to that
 * service; picking it again lets go. It follows the page's lookback. */

import { useEffect, useState } from 'react';
import { num } from '../../../src/lib/format';
import { HindcastPage } from '../../../src/pages/hindcast/HindcastPage';
import { Panel } from '../../../src/pages/hindcast/components/Panel/Panel';
import { Tip } from '../../../src/pages/hindcast/components/charts/Tip';
import { useSize } from '../../../src/pages/hindcast/hooks/useSize';
import { useTweenedNumbers } from '../../../src/pages/hindcast/hooks/useTween';
import { niceAxis } from '../../../src/pages/hindcast/model/labels';
import { measureOf, valueOf, words, type Measure, type Talker } from '../model';
import { MeasureSeg, MountInto, useTalkers } from '../shared';

/** The page's scope, as the hindcast remembers it for the session. */
function readScope(): { serviceId: string; weeks: number } {
  try {
    const s = JSON.parse(sessionStorage.getItem('mn-analysis-scope') ?? '{}');
    return { serviceId: s.serviceId ?? 'all', weeks: s.weeks ?? 26 };
  } catch {
    return { serviceId: 'all', weeks: 26 };
  }
}

export function Quadrant() {
  // Prototype only: the panel scopes the page by remounting it on the new service. Built for
  // real, it would call the page's own rescope and the charts would morph instead.
  const [scoped, setScoped] = useState(() => readScope().serviceId);
  const [weeks, setWeeks] = useState(() => readScope().weeks);

  // The page keeps its scope in sessionStorage; follow it when the top bar changes it.
  useEffect(() => {
    const id = setInterval(() => {
      const s = readScope();
      setWeeks(s.weeks);
      setScoped(s.serviceId);
    }, 200);
    return () => clearInterval(id);
  }, []);

  const [page, setPage] = useState(scoped);
  const scope = (id: string) => {
    sessionStorage.setItem('mn-analysis-scope', JSON.stringify({ ...JSON.parse(sessionStorage.getItem('mn-analysis-scope') ?? '{}'), serviceId: id }));
    setScoped(id);
    setPage(id);
  };

  return (
    <>
      <HindcastPage key={page} serviceId={page} weeks={String(weeks)} />
      <MountInto selector=".ol-grid[data-view='hindcast']">
        <TalkerPanel weeks={weeks} scoped={scoped} onScope={scope} />
      </MountInto>
    </>
  );
}

function TalkerPanel({ weeks, scoped, onScope }: { weeks: number; scoped: string; onScope: (id: string) => void }) {
  const [measure, setMeasure] = useState<Measure>('tickets');
  const list = useTalkers(weeks);
  const name = list.find((t) => t.id === scoped)?.name;
  return (
    <Panel
      area="talkers"
      index={6}
      title="Services"
      meta={name ? `Showing ${name}` : 'Pick one to scope'}
      actions={<MeasureSeg value={measure} onChange={setMeasure} without="rules" />}
      table={<TalkerTable list={list} />}
    >
      <Scatter list={list} measure={measure} weeks={weeks} scoped={scoped} onScope={onScope} />
    </Panel>
  );
}

const PAD = { top: 10, right: 14, bottom: 26, left: 34 };

function Scatter({ list, measure, weeks, scoped, onScope }: { list: Talker[]; measure: Measure; weeks: number; scoped: string; onScope: (id: string) => void }) {
  const [ref, { width, height }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<string | null>(null);
  const m = measureOf(measure);

  const xMax = Math.max(4, ...list.map((t) => t.rules.total + 1));
  const { top: yTop, ticks } = niceAxis(Math.max(1, ...list.map((t) => valueOf(t, measure))), 3);
  // The axis glides with the figures when the lookback or the measure changes.
  const tweened = useTweenedNumbers<Record<string, number>>({ yTop, ...Object.fromEntries(list.map((t) => [t.id, valueOf(t, measure)])) });

  const w = Math.max(0, width - PAD.left - PAD.right);
  const h = Math.max(0, height - PAD.top - PAD.bottom);
  const sx = (v: number) => PAD.left + (v / xMax) * w;
  const sy = (v: number) => PAD.top + h - (v / tweened.yTop!) * h;

  // Where "loud" and "few rules" start: the average service.
  const meanRules = list.reduce((n, t) => n + t.rules.total, 0) / list.length;
  const meanY = list.reduce((n, t) => n + valueOf(t, measure), 0) / list.length;
  const loudFew = (t: Talker) => valueOf(t, measure) > meanY && t.rules.total < meanRules;

  // Labels go beside their point, loudest first, wherever they fit: right, left, then a
  // line up or down. One that fits nowhere is left off; the tooltip and the table still name it.
  const labels = new Map<string, { x: number; y: number; anchor: 'start' | 'end' }>();
  const taken: Box[] = [{ x: PAD.left, y: PAD.top, w: 96, h: 20 }, ...ticks.map((v) => ({ x: 0, y: sy(v) - 7, w: PAD.left - 4, h: 14 }))];
  const dots = list.map((t) => ({ id: t.id, x: sx(t.rules.total), y: sy(tweened[t.id] ?? 0) }));
  for (const t of [...list].sort((a, b) => valueOf(b, measure) - valueOf(a, measure))) {
    const { x, y } = dots.find((d) => d.id === t.id)!;
    const lw = t.name.length * 6.2;
    const tries: { dx: number; dy: number; anchor: 'start' | 'end' }[] = [
      { dx: 9, dy: 0, anchor: 'start' },
      { dx: -9, dy: 0, anchor: 'end' },
      { dx: 6, dy: -12, anchor: 'start' },
      { dx: 6, dy: 13, anchor: 'start' },
      { dx: -6, dy: -12, anchor: 'end' },
      { dx: -6, dy: 13, anchor: 'end' },
      { dx: 6, dy: -24, anchor: 'start' },
      { dx: 6, dy: 26, anchor: 'start' },
      { dx: -6, dy: -24, anchor: 'end' },
      { dx: -6, dy: 26, anchor: 'end' },
    ];
    for (const c of tries) {
      const box = { x: c.anchor === 'start' ? x + c.dx : x + c.dx - lw, y: y + c.dy - 7, w: lw, h: 13 };
      const inside = box.x >= 2 && box.x + box.w <= width && box.y >= 0 && box.y + box.h <= PAD.top + h;
      const clear = !taken.some((b) => overlaps(b, box)) && !dots.some((d) => d.id !== t.id && overlaps({ x: d.x - 5, y: d.y - 5, w: 10, h: 10 }, box));
      if (inside && clear) {
        labels.set(t.id, { x: x + c.dx, y: y + c.dy + 4, anchor: c.anchor });
        taken.push(box);
        break;
      }
    }
  }

  const hovered = list.find((t) => t.id === hover);

  return (
    <div className="tt-sc" ref={ref} onPointerLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={`Every service by rules and ${m.many}, last ${weeks} weeks`}>
          {/* the loud-with-few-rules corner, a shade lighter */}
          <rect className="tt-sc-zone" x={PAD.left} y={PAD.top} width={sx(meanRules) - PAD.left} height={sy(meanY) - PAD.top} rx={4} />
          <text className="tt-sc-zone-label" x={PAD.left + 8} y={PAD.top + 15}>
            Loud, few rules
          </text>
          {ticks.map((v) => (
            <g key={v}>
              <line className={v === 0 ? 'tt-sc-base' : 'tt-sc-grid'} x1={PAD.left} x2={PAD.left + w} y1={sy(v)} y2={sy(v)} />
              <text className="tt-sc-axis" x={PAD.left - 8} y={sy(v) + 4} textAnchor="end">
                {num(v)}
              </text>
            </g>
          ))}
          {Array.from({ length: xMax + 1 }, (_, v) => (
            <text key={v} className="tt-sc-axis" x={sx(v)} y={PAD.top + h + 16} textAnchor="middle">
              {v}
            </text>
          ))}
          <text className="tt-sc-axis" x={PAD.left + w} y={PAD.top + h + 16} textAnchor="end" dx={-18}>
            rules
          </text>
          <line className="tt-sc-mean" x1={sx(meanRules)} x2={sx(meanRules)} y1={PAD.top} y2={PAD.top + h} />
          <line className="tt-sc-mean" x1={PAD.left} x2={PAD.left + w} y1={sy(meanY)} y2={sy(meanY)} />

          {list.map((t) => {
            const cx = sx(t.rules.total);
            const cy = sy(tweened[t.id] ?? 0);
            const label = labels.get(t.id);
            return (
              <g
                key={t.id}
                className="tt-sc-pt"
                data-hot={loudFew(t) || undefined}
                data-picked={scoped === t.id || undefined}
                data-dim={(scoped !== 'all' && scoped !== t.id) || undefined}
                tabIndex={0}
                role="button"
                aria-pressed={scoped === t.id}
                aria-label={`${t.name}: ${num(valueOf(t, measure))} ${words(valueOf(t, measure), measure)}, ${t.rules.total} rules. ${scoped === t.id ? 'Show every service' : 'Scope the page to it'}.`}
                onClick={() => onScope(scoped === t.id ? 'all' : t.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onScope(scoped === t.id ? 'all' : t.id);
                  }
                }}
                onPointerEnter={() => setHover(t.id)}
                onFocus={() => setHover(t.id)}
                onBlur={() => setHover(null)}
              >
                <circle className="tt-sc-hit" cx={cx} cy={cy} r={12} />
                <circle className="tt-sc-dot" cx={cx} cy={cy} r={4.5} />
                {label && (
                  <text className="tt-sc-label" x={label.x} y={label.y} textAnchor={label.anchor}>
                    {t.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
      {hovered && (
        <Tip
          x={sx(hovered.rules.total)}
          y={sy(valueOf(hovered, measure)) - 10}
          flip={sx(hovered.rules.total) > width / 2}
          title={hovered.name}
          rows={[
            { value: num(hovered.tickets), label: words(hovered.tickets, 'tickets') },
            { value: num(hovered.incidents), label: `became ${words(hovered.incidents, 'incidents')}` },
            { value: num(hovered.rules.total), label: `${words(hovered.rules.total, 'rules')}, ${hovered.rules.active} active` },
          ]}
          foot={scoped === hovered.id ? 'Pick again to show every service' : `Pick to scope the page to ${hovered.name}`}
        />
      )}
    </div>
  );
}

type Box = { x: number; y: number; w: number; h: number };

const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function TalkerTable({ list }: { list: Talker[] }) {
  return (
    <table className="ol-table">
      <thead>
        <tr>
          <th>Service</th>
          <th>Tickets</th>
          <th>Incidents</th>
          <th>Rules</th>
          <th>Active</th>
        </tr>
      </thead>
      <tbody>
        {[...list]
          .sort((a, b) => b.tickets - a.tickets)
          .map((t) => (
            <tr key={t.id}>
              <th>{t.name}</th>
              <td>{num(t.tickets)}</td>
              <td>{num(t.incidents)}</td>
              <td>{num(t.rules.total)}</td>
              <td>{num(t.rules.active)}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
