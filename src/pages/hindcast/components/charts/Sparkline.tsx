/* A small line with no axes, for a stat: the shape matters, not the values. The part after
 * `split` is the forecast and is dashed. Drawn in a stretched viewBox, with strokes that don't
 * stretch with it. When the scope changes, the line reshapes into the new one rather than
 * jumping (hooks/useTween): it's resampled to a fixed number of points, so a 12-week line can
 * morph into a 52-week one. */

import { useTweenedShape } from '../../hooks/useTween';

const POINTS = 40;

export function Sparkline({ values, split, label }: { values: number[]; split?: number; label: string }) {
  const shown = useTweenedShape(values, POINTS);
  if (values.length < 2) return null;
  const max = Math.max(...shown);
  const min = Math.min(...shown);
  const pad = (max - min) * 0.15 || 1;
  const x = (i: number) => (i / (POINTS - 1)) * 100;
  const y = (v: number) => 26 - ((v - min + pad) / (max - min + pad * 2)) * 24;
  const path = (from: number, to: number) =>
    shown
      .slice(from, to)
      .map((v, i) => `${i ? 'L' : 'M'}${x(from + i).toFixed(2)},${y(v).toFixed(2)}`)
      .join('');
  // Where the history turns into the forecast, on the resampled line.
  const cut = split === undefined ? POINTS : Math.round(((split - 1) / (values.length - 1)) * (POINTS - 1)) + 1;
  return (
    <svg className="ol-spark ol-wipe" viewBox="0 0 100 28" preserveAspectRatio="none" role="img" aria-label={label}>
      <path d={path(0, cut)} className="ol-spark-line" vectorEffect="non-scaling-stroke" />
      {cut < POINTS && <path d={path(cut - 1, POINTS)} className="ol-spark-line" data-ahead vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}
