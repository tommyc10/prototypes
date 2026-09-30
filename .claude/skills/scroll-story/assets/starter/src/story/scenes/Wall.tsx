/* The wall of noise: everything that landed this morning. The hero dives into one row of
 * it; the outro comes back to it once the product has quietened it down. */

import { WALL } from '../data';
import './Wall.css';

/** Each column starts a little higher or lower, so the wall doesn't read as a table. */
const COLUMN_OFFSET = [0, -22, -8, -30];

export function Wall() {
  return (
    <div className="scene sc-wall" aria-hidden>
      <div className="wall">
        {WALL.map((column, c) => (
          <div className="wall-col" key={c} style={{ marginTop: COLUMN_OFFSET[c] }}>
            {column.map((row, r) => (
              <div
                className="wall-row"
                key={r}
                data-noise={row.noise || undefined}
                data-target={row.target || undefined}
                style={{ '--i': (r * 7 + c * 5) % 11 } as React.CSSProperties}
              >
                <span className="dot" data-s="open" />
                <span className="mono wall-id">{row.id}</span>
                <span className="wall-title truncate">{row.title}</span>
                <span className="mono wall-time">{row.time}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
