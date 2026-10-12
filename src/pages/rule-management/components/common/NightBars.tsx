/* When a pattern's incidents came in last night: sixteen half hours, 22:00 to 06:00.
 * The overnight counterpart to WeeklyBars, drawn the same way. */

import './NightBars.css';

export function NightBars({ halfHours }: { halfHours: number[] }) {
  const max = Math.max(1, ...halfHours);
  return (
    <div className="mn-nb" role="img" aria-label={`Incidents by half hour through the night, ${max} in the busiest`}>
      <div className="mn-nb-bars">
        {halfHours.map((n, i) => (
          <span key={i} data-empty={n === 0 || undefined} style={{ transform: n ? `scaleY(${Math.max(0.1, n / max)})` : undefined }} />
        ))}
      </div>
      <div className="mn-nb-axis">
        <span>22:00</span>
        <span>02:00</span>
        <span>06:00</span>
      </div>
    </div>
  );
}
