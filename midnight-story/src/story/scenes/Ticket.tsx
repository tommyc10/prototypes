/* Chapter 1: one incident, from the page it sends to the moment it clears itself. */

import { CircleCheck } from 'lucide-react';
import { smoothPath } from '../../lib/path';
import { TEMP_READINGS } from '../data';
import './Ticket.css';

const W = 552;
const H = 150;
const TOP = 18;
const PLOT = 104;
const MIN = 65;
const MAX = 73;
const THRESHOLD = 70;

const y = (t: number) => TOP + ((MAX - t) / (MAX - MIN)) * PLOT;
const points = TEMP_READINGS.map((t, i) => [(i / (TEMP_READINGS.length - 1)) * W, y(t)] as [number, number]);
const line = smoothPath(points);
const peakIndex = TEMP_READINGS.indexOf(Math.max(...TEMP_READINGS));
const [peakX, peakY] = points[peakIndex];

export function Ticket() {
  return (
    <div className="scene sc-ticket">
      <article className="tk card">
        <header className="tk-head">
          <span className="mono tk-id">INC-40231</span>
          <span className="badge-swap tk-status">
            <span className="badge tk-open">
              <span className="dot" data-s="open" />
              Open
            </span>
            <span className="badge tk-cleared">
              <span className="dot" data-s="cleared" />
              Auto-cleared
            </span>
          </span>
          <span className="tk-prio">P3</span>
          <span className="mono subtle tk-at">06:00:12</span>
        </header>

        <h3 className="tk-title">Tractor beam coupling 7 temperature warning</h3>
        <p className="tk-sub">
          Paged <strong>Tractor Beam Ops</strong> · Death Star · 1 person woken
        </p>

        <div className="tk-chart">
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden>
            <defs>
              <clipPath id="tk-over">
                <rect x="0" y="0" width={W} height={y(THRESHOLD)} />
              </clipPath>
            </defs>
            <line className="tk-threshold" x1="0" x2={W} y1={y(THRESHOLD)} y2={y(THRESHOLD)} />
            <text className="tk-threshold-label" x={W} y={y(THRESHOLD) - 8} textAnchor="end">
              70 °C warning line
            </text>
            <path className="tk-line" d={line} />
            <path className="tk-line tk-line-over" d={line} clipPath="url(#tk-over)" />
            <g className="tk-peak">
              <circle cx={peakX} cy={peakY} r="4" />
              <text x={peakX + 10} y={peakY - 8}>
                71.4 °C
              </text>
            </g>
            <text className="tk-axis" x="0" y={H - 2}>
              06:00:12
            </text>
            <text className="tk-axis" x={W} y={H - 2} textAnchor="end">
              06:01:26
            </text>
          </svg>
        </div>

        <dl className="tk-fields">
          <div>
            <dt>CI</dt>
            <dd className="mono">tb-coupling-07</dd>
          </div>
          <div>
            <dt>Peak temperature</dt>
            <dd>71.4 °C</dd>
          </div>
          <div>
            <dt>Open for</dt>
            <dd>
              <span className="num tk-timer">74</span> s
            </dd>
          </div>
        </dl>

        <footer className="tk-foot">
          <CircleCheck size={15} strokeWidth={2} />
          Cleared on its own. Nobody touched it.
        </footer>
      </article>
    </div>
  );
}
