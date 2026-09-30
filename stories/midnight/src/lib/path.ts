/* A smooth SVG path through points (Catmull-Rom turned into cubic Béziers). */

export function smoothPath(points: [number, number][], tension = 0.5) {
  if (points.length < 2) return '';
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension * 2;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension * 2;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension * 2;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension * 2;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
