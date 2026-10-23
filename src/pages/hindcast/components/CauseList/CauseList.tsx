/* Root causes, biggest first: how many tickets each caused, how many of those became
 * incidents, how long they took to fix, and which way it's moving. Each row is a filter:
 * picking one narrows the rest of the hindcast to it. J and K walk the list. */

import type { CSSProperties } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { num, pct } from '../../../../lib/format';
import { change, span } from '../../model/labels';
import type { CauseKey, CauseRow } from '../../model/types';
import './CauseList.css';

export function CauseList({ causes, selected, onSelect }: { causes: CauseRow[]; selected: CauseKey | null; onSelect: (key: CauseKey | null) => void }) {
  const max = Math.max(1, ...causes.map((c) => c.count));
  return (
    <div className="ol-causes" role="listbox" aria-label="Root causes" data-picked={selected ? '' : undefined}>
      <div className="ol-cause ol-cause-head" aria-hidden>
        <span>Cause</span>
        <span />
        <span>Tickets</span>
        <span>Incidents</span>
        <span className="ol-cause-mins">Median fix</span>
        <span>Change</span>
      </div>
      {causes.map((c, i) => {
        const moved = change(c.count, c.previous);
        return (
          <button
            key={c.key}
            role="option"
            aria-selected={selected === c.key}
            className="ol-cause"
            data-selected={selected === c.key || undefined}
            onClick={() => onSelect(selected === c.key ? null : c.key)}
          >
            <span className="ol-cause-name mn-truncate">{c.label}</span>
            <span className="ol-cause-track">
              <span className="ol-cause-fill ol-grow-x" style={{ transform: `scaleX(${c.count / max})`, '--i': i } as CSSProperties} />
            </span>
            <span className="ol-cause-num">{num(c.count)}</span>
            <span className="ol-cause-inc">
              {num(c.incidents)}
              <small>{pct(c.count ? c.incidents / c.count : 0)}</small>
            </span>
            <span className="ol-cause-mins">{c.count ? span(c.medianMins) : '–'}</span>
            <span className="ol-cause-change" data-worse={moved !== null && moved >= 0.15 ? '' : undefined}>
              {moved === null ? (
                '–'
              ) : (
                <>
                  {moved >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {pct(Math.abs(moved))}
                </>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
