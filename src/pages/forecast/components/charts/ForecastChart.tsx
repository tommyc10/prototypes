/* Tickets a week: what happened, then what should. The line is the history; past today it
 * turns dashed and gains its likely range. Faint dashes over the last few weeks are what the
 * forecast said a week before each, so the reader can judge it by its record.
 *
 * Drawn in real pixels in three stacked layers, so the entrance can draw the history first
 * and let the forecast follow it out past today. */

import { useState, type PointerEvent } from 'react';
import { num } from '../../../../lib/format';
import { useSize } from '../../../hindcast/hooks/useSize';
import { dayMonth, monthName, niceAxis } from '../../../hindcast/model/labels';
import type { AheadPoint, HistoryPoint } from '../../model/types';
import { labelled } from '../../../hindcast/components/charts/VolumeChart';
import { Tip } from '../../../hindcast/components/charts/Tip';

const M = { left: 40, right: 72, top: 18, bottom: 24 };

export function ForecastChart({ history, ahead }: { history: HistoryPoint[]; ahead: AheadPoint[] }) {
  const [ref, size] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const n = history.length + ahead.length;
  const { top, ticks } = niceAxis(Math.max(...history.map((h) => h.actual), ...ahead.map((a) => a.high)) * 1.05, 4);
  const w = size.width - M.left - M.right;
  const h = size.height - M.top - M.bottom;
  const x = (i: number) => M.left + (i / (n - 1)) * w;
  const y = (v: number) => M.top + h - (v / top) * h;
  const pts = (xs: [number, number][]) => xs.map(([i, v]) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' L');

  const lastI = history.length - 1;
  const last = history[lastI];
  const actual = `M${pts(history.map((p, i) => [i, p.actual]))}`;
  const tried = history.map((p, i) => [i, p.predicted] as const).filter((p): p is [number, number] => p[1] !== null);
  const predictedPath = tried.length > 1 ? `M${pts(tried)}` : '';
  const forecastPath = `M${pts([[lastI, last.actual], ...ahead.map((a, j) => [history.length + j, a.expected] as [number, number])])}`;
  const band = `M${pts([[lastI, last.actual], ...ahead.map((a, j) => [history.length + j, a.high] as [number, number])])} L${pts(
    [...ahead.map((a, j) => [history.length + j, a.low] as [number, number])].reverse().concat([[lastI, last.actual]]),
  )} Z`;
  const today = x(lastI + 0.5);
  const end = ahead[ahead.length - 1];
  const starts = [...history.map((p) => p.start), ...ahead.map((a) => a.start)];
  const show = labelled(starts);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - box.left - M.left) / w) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const tip = (() => {
    if (hover === null) return null;
    if (hover < history.length) {
      const p = history[hover];
      return {
        title: `Week of ${dayMonth(p.start)}`,
        rows: [
          { tone: 'var(--tone-1)', value: num(p.actual), label: 'Tickets' },
          ...(p.predicted !== null ? [{ tone: 'var(--tone-3)', value: num(p.predicted), label: 'Forecast a week before' }] : []),
        ],
        foot: p.predicted !== null ? `Off by ${num(Math.abs(p.actual - p.predicted))}` : undefined,
        v: p.actual,
      };
    }
    const a = ahead[hover - history.length];
    return {
      title: `Week of ${dayMonth(a.start)}`,
      rows: [
        { tone: 'var(--tone-2)', value: num(a.expected), label: 'Expected' },
        { tone: 'var(--tone-4)', value: `${num(a.low)}–${num(a.high)}`, label: 'Likely range' },
      ],
      foot: 'Forecast',
      v: a.expected,
    };
  })();

  const ready = size.width > 0 && size.height > 0;

  return (
    <div className="ol-fc">
      <div className="ol-fc-plot" ref={ref} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {ready && (
          <>
            <svg className="ol-svg" width={size.width} height={size.height} aria-hidden>
              <rect className="ol-fc-future" x={today} y={M.top - 8} width={size.width - M.right - today + 8} height={h + 8} rx={6} />
              {ticks.map((t) => (
                <g key={t}>
                  <line className="ol-gridline" data-base={t === 0 || undefined} x1={M.left} x2={size.width - M.right + 8} y1={y(t)} y2={y(t)} />
                  <text className="ol-axis" x={M.left - 10} y={y(t) + 4} textAnchor="end">
                    {num(t)}
                  </text>
                </g>
              ))}
              <line className="ol-fc-today" x1={today} x2={today} y1={M.top - 8} y2={M.top + h} />
              <text className="ol-axis ol-fc-today-label" x={today + 6} y={M.top + 2}>
                Today
              </text>
              {starts.map((s, i) =>
                show[i] ? (
                  <text key={s} className="ol-axis" x={x(i)} y={size.height - 6} textAnchor="middle">
                    {n <= 14 ? dayMonth(s) : monthName(s)}
                  </text>
                ) : null,
              )}
            </svg>

            <svg className="ol-svg ol-wipe" width={size.width} height={size.height} aria-hidden>
              {predictedPath && <path d={predictedPath} className="ol-line" data-tone="3" data-dash="dot" />}
              {tried.map(([i, v]) => (
                <circle key={i} cx={x(i)} cy={y(v)} r={2.5} className="ol-dot" data-tone="3" />
              ))}
              <path d={actual} className="ol-line" data-tone="1" />
              <circle cx={x(lastI)} cy={y(last.actual)} r={4} className="ol-dot" data-tone="1" />
              <text className="ol-direct" x={x(lastI) - 8} y={y(last.actual) - 12} textAnchor="end">
                {num(last.actual)} last week
              </text>
            </svg>

            <svg className="ol-svg ol-wipe" data-late width={size.width} height={size.height} aria-hidden>
              <path d={band} className="ol-fc-band" />
              <path d={forecastPath} className="ol-line" data-tone="2" data-dash="dash" />
              <circle cx={x(n - 1)} cy={y(end.expected)} r={3.5} className="ol-dot" data-tone="2" />
              <text className="ol-direct" x={x(n - 1) + 10} y={y(end.expected) - 2}>
                {num(end.expected)}
              </text>
              <text className="ol-direct" data-quiet x={x(n - 1) + 10} y={y(end.expected) + 13}>
                {num(end.low)}–{num(end.high)}
              </text>
            </svg>

            {hover !== null && tip && (
              <>
                <svg className="ol-svg" width={size.width} height={size.height} aria-hidden>
                  <line className="ol-cross" x1={x(hover)} x2={x(hover)} y1={M.top - 8} y2={M.top + h} />
                  <circle cx={x(hover)} cy={y(tip.v)} r={4.5} className="ol-dot" data-tone={hover < history.length ? '1' : '2'} data-ring />
                </svg>
                <Tip x={x(hover)} y={M.top} flip={hover > n * 0.6} title={tip.title} rows={tip.rows} foot={tip.foot} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function ForecastLegend() {
  return (
    <ul className="ol-legend" aria-label="Key">
      <li>
        <i data-key="line" />
        Tickets
      </li>
      <li>
        <i data-key="dash" />
        Forecast
      </li>
      <li>
        <i data-key="band" />
        Likely range
      </li>
      <li>
        <i data-key="dot" />
        Forecast a week before
      </li>
    </ul>
  );
}

export function ForecastTable({ history, ahead }: { history: HistoryPoint[]; ahead: AheadPoint[] }) {
  return (
    <table className="ol-table">
      <thead>
        <tr>
          <th>Week of</th>
          <th>Tickets</th>
          <th>Forecast a week before</th>
          <th>Expected</th>
          <th>Likely range</th>
        </tr>
      </thead>
      <tbody>
        {ahead.map((a) => (
          <tr key={a.start}>
            <th>{dayMonth(a.start)}</th>
            <td>–</td>
            <td>–</td>
            <td>{num(a.expected)}</td>
            <td>
              {num(a.low)}–{num(a.high)}
            </td>
          </tr>
        ))}
        {[...history].reverse().map((p) => (
          <tr key={p.start}>
            <th>{dayMonth(p.start)}</th>
            <td>{num(p.actual)}</td>
            <td>{p.predicted === null ? '–' : num(p.predicted)}</td>
            <td>–</td>
            <td>–</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
