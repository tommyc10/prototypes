/* Chapter 2: the ticket is one of 120. Each square is one ticket, stacked by week.
 * Positions are computed here, so the story only has to animate them. */

import { WEEKLY, WEEKLY_TOTAL } from '../data';
import './Pattern.css';

const CELL = 18;
const GAP = 4;
const COL_GAP = 24;
const PER_ROW = 2;
const CHART_H = 200;
const COL_W = PER_ROW * CELL + (PER_ROW - 1) * GAP;

const CELLS = WEEKLY.flatMap((count, week) =>
  Array.from({ length: count }, (_, i) => ({
    x: week * (COL_W + COL_GAP) + (i % PER_ROW) * (CELL + GAP),
    y: CHART_H - CELL - Math.floor(i / PER_ROW) * (CELL + GAP),
    mine: week === WEEKLY.length - 1 && i === count - 1,
  })),
);

export function Pattern() {
  return (
    <div className="scene sc-pat">
      <div className="pt-head">
        <div className="pt-eyebrow">Tickets like #4821</div>
        <div className="pt-total">
          <span className="num pt-count">{WEEKLY_TOTAL}</span>
          <span className="pt-window">in twelve weeks</span>
        </div>
      </div>
      <div className="pt-chart" style={{ height: CHART_H }}>
        {CELLS.map((c, i) => (
          <span key={i} className="pt-cell" data-mine={c.mine || undefined} style={{ left: c.x, top: c.y }} />
        ))}
      </div>
      <div className="pt-axis">
        <span>12 weeks ago</span>
        <span>Each square is one ticket</span>
        <span>This week</span>
      </div>
    </div>
  );
}
