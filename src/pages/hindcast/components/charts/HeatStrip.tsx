/* One row of cells, one cell per completed week: the more tickets a change window soaked up
 * that week, the stronger the cell. One tone, so it reads as "how much", never "which". */

import { useState, type CSSProperties } from 'react';
import { num } from '../../../../lib/format';
import { dayMonth } from './WeeklyColumns';
import { Tip } from './Tip';

export function HeatStrip({ values, starts, max, label }: { values: number[]; starts: string[]; max: number; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="hc-heat" role="img" aria-label={`${label}: ${values.map((v, i) => `${dayMonth(starts[i])} ${v}`).join(', ')}`} onPointerLeave={() => setHover(null)}>
      {values.map((value, i) => (
        <span
          key={i}
          className="hc-heat-cell"
          data-hover={hover === i || undefined}
          // Empty weeks stay a faint track; the rest run from 22% to full strength.
          style={{ '--heat': value ? 0.22 + 0.78 * (value / max) : 0 } as CSSProperties}
          onPointerEnter={() => setHover(i)}
        >
          {hover === i && (
            <Tip
              title={`Week of ${dayMonth(starts[i])}`}
              rows={[{ tone: 'window', value: num(value), label: value === 1 ? 'ticket inside the window' : 'tickets inside the window' }]}
              edge={i > values.length - 4 ? 'end' : i < 3 ? 'start' : undefined}
            />
          )}
        </span>
      ))}
    </div>
  );
}
