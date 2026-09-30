/* Chapter 2: the ticket turns out to be one of 214. Each cell is one incident, stacked by week. */

import { WEEKLY, WEEKLY_TOTAL } from '../data';
import './Recurrence.css';

const CELL = 18;
const GAP = 4;
const COL_GAP = 24;
const PER_ROW = 2;
export const CHART_H = 242;
const COL_W = PER_ROW * CELL + (PER_ROW - 1) * GAP;

interface Cell {
  x: number;
  y: number;
  worked: boolean;
  ticket: boolean;
}

/** Every incident's spot in the chart, oldest first. The newest one is our ticket. */
const CELLS: Cell[] = WEEKLY.flatMap((count, week) =>
  Array.from({ length: count }, (_, i) => ({
    x: week * (COL_W + COL_GAP) + (i % PER_ROW) * (CELL + GAP),
    y: CHART_H - CELL - Math.floor(i / PER_ROW) * (CELL + GAP),
    worked: (week * 31 + i * 7) % 53 === 5,
    ticket: week === WEEKLY.length - 1 && i === count - 1,
  })),
);

export function Recurrence() {
  return (
    <div className="scene sc-rec">
      <div className="rec-head">
        <div className="rec-eyebrow">Incidents like INC-40231</div>
        <div className="rec-total">
          <span className="num rec-count">{WEEKLY_TOTAL}</span>
          <span className="rec-window">in the last 90 days</span>
        </div>
      </div>

      <div className="rec-chart" style={{ height: CHART_H }}>
        {CELLS.map((c, i) => (
          <span
            key={i}
            className="rec-cell"
            data-worked={c.worked || undefined}
            data-ticket={c.ticket || undefined}
            style={{ left: c.x, top: c.y }}
          />
        ))}
      </div>
      <div className="rec-axis">
        <span>13 Jul</span>
        <span>Each square is one page</span>
        <span>This week</span>
      </div>

      <dl className="rec-facts">
        <div>
          <dt>98%</dt>
          <dd>cleared on their own</dd>
        </div>
        <div>
          <dt>74 s</dt>
          <dd>median time to clear</dd>
        </div>
        <div>
          <dt>06 · 14 · 22</dt>
          <dd>always at shift change</dd>
        </div>
      </dl>
    </div>
  );
}
