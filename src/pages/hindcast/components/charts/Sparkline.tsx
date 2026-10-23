/* A small line with no axes, for a stat: the shape matters, not the values. The part after
 * `split` is the forecast and is dashed. Drawn in a stretched viewBox, with strokes that don't
 * stretch with it. */

export function Sparkline({ values, split, label }: { values: number[]; split?: number; label: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pad = (max - min) * 0.15 || 1;
  const x = (i: number) => (i / (values.length - 1)) * 100;
  const y = (v: number) => 26 - ((v - min + pad) / (max - min + pad * 2)) * 24;
  const path = (from: number, to: number) =>
    values
      .slice(from, to)
      .map((v, i) => `${i ? 'L' : 'M'}${x(from + i).toFixed(2)},${y(v).toFixed(2)}`)
      .join('');
  const cut = split ?? values.length;
  return (
    <svg className="ol-spark ol-wipe" viewBox="0 0 100 28" preserveAspectRatio="none" role="img" aria-label={label}>
      <path d={path(0, cut)} className="ol-spark-line" vectorEffect="non-scaling-stroke" />
      {cut < values.length && <path d={path(cut - 1, values.length)} className="ol-spark-line" data-ahead vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}
