/* The closing frame: the same wall, quiet now, and the three numbers that matter. */

import { ArrowUpRight, RotateCcw } from 'lucide-react';
import { DASHBOARD_URL, OUTRO_STATS } from '../data';

export function Outro({ onReplay }: { onReplay: () => void }) {
  return (
    <div className="scene sc-outro">
      <div className="outro">
        <h2 className="outro-title">Quiet, on purpose.</h2>
        <p className="outro-sub">Same morning, same wall. Now the only alerts left are the ones worth waking up for.</p>
        <dl className="outro-stats">
          {OUTRO_STATS.map((s) => (
            <div className="outro-stat" key={s.label}>
              <dt>
                <span className="num outro-num">{s.value}</span>
                {s.suffix}
              </dt>
              <dd>{s.label}</dd>
            </div>
          ))}
        </dl>
        <div className="outro-actions">
          <a className="btn" data-variant="primary" href={DASHBOARD_URL}>
            Open the dashboard
            <ArrowUpRight size={15} strokeWidth={2} />
          </a>
          <button className="btn" data-variant="ghost" type="button" onClick={onReplay}>
            <RotateCcw size={14} strokeWidth={2} />
            Watch it again
          </button>
        </div>
      </div>
    </div>
  );
}
