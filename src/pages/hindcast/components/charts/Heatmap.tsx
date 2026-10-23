/* When tickets arrive: weekday down the side, hour across. One grey, darker for more, which
 * is a magnitude, so it's a sequential ramp of a single ink. Every cell can be hovered or
 * focused for its count. */

import { useState, type CSSProperties } from 'react';
import { num, pct } from '../../../../lib/format';
import { WEEKDAYS, plural } from '../../model/labels';

const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`;

export function Heatmap({ heat, max }: { heat: number[][]; max: number }) {
  const [hover, setHover] = useState<[number, number] | null>(null);
  const total = heat.flat().reduce((a, b) => a + b, 0);
  const cell = hover ? heat[hover[0]][hover[1]] : 0;

  return (
    <div className="ol-heat">
      <div className="ol-heat-grid" onPointerLeave={() => setHover(null)}>
        {heat.map((row, d) => (
          <div className="ol-heat-row" key={d}>
            <span className="ol-heat-day">{WEEKDAYS[d]}</span>
            {row.map((n, h) => (
              <span
                key={h}
                className="ol-heat-cell ol-fade"
                tabIndex={h === 0 ? 0 : -1}
                data-hover={hover?.[0] === d && hover?.[1] === h ? '' : undefined}
                style={{ '--heat': n / max, '--i': h } as CSSProperties}
                aria-label={`${WEEKDAYS[d]} ${hourLabel(h)}: ${num(n)} ${plural(n, 'ticket')}`}
                onPointerEnter={() => setHover([d, h])}
                onFocus={() => setHover([d, h])}
                onKeyDown={(e) => {
                  const step = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }[e.key];
                  if (!step) return;
                  e.preventDefault();
                  e.stopPropagation();
                  const nd = Math.min(6, Math.max(0, d + step[0]));
                  const nh = Math.min(23, Math.max(0, h + step[1]));
                  (e.currentTarget.parentElement!.parentElement!.children[nd].children[nh + 1] as HTMLElement).focus();
                }}
              />
            ))}
          </div>
        ))}
        <div className="ol-heat-row ol-heat-hours" aria-hidden>
          <span className="ol-heat-day" />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h}>{h % 6 === 0 ? String(h).padStart(2, '0') : ''}</span>
          ))}
        </div>
      </div>
      <div className="ol-heat-foot" aria-live="polite">
        {hover ? (
          <>
            <b>{num(cell)}</b> {plural(cell, 'ticket')} on {WEEKDAYS[hover[0]]}s at {hourLabel(hover[1])}, {pct(total ? cell / total : 0)} of the
            total
          </>
        ) : (
          <>
            <span className="ol-heat-scale" aria-hidden>
              {[0.08, 0.3, 0.55, 0.8, 1].map((v) => (
                <i key={v} style={{ '--heat': v } as CSSProperties} />
              ))}
            </span>
            Fewer to more
          </>
        )}
      </div>
    </div>
  );
}
