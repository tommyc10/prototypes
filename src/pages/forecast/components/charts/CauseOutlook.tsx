/* Causes, before and after: tickets each cause raised in the weeks just gone against what it
 * should raise in the weeks ahead. Two bars per cause from the grey ramp, the forecast the
 * brighter, on one shared scale. */

import type { CSSProperties } from 'react';
import { num } from '../../../../lib/format';
import type { CauseOutlook as Row } from '../../model/types';

export function CauseOutlook({ causes }: { causes: Row[] }) {
  const max = Math.max(1, ...causes.flatMap((c) => [c.last, c.next]));
  return (
    <div className="ol-pair">
      {causes.map((c, i) => (
        <div className="ol-pair-row" key={c.key} aria-label={`${c.label}: ${num(c.last)} in the weeks just gone, ${num(c.next)} expected`}>
          <span className="ol-pair-name mn-truncate">{c.label}</span>
          <span className="ol-pair-bars" aria-hidden>
            <i className="ol-grow-x" data-tone="last" style={{ transform: `scaleX(${c.last / max})`, '--i': i } as CSSProperties} />
            <i className="ol-grow-x" data-tone="next" style={{ transform: `scaleX(${c.next / max})`, '--i': i + 2 } as CSSProperties} />
          </span>
          <span className="ol-pair-num">
            <span>{num(c.last)}</span>
            {num(c.next)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CauseOutlookTable({ causes, horizon }: { causes: Row[]; horizon: number }) {
  return (
    <table className="ol-table">
      <thead>
        <tr>
          <th>Cause</th>
          <th>Last {horizon} weeks</th>
          <th>Next {horizon} weeks</th>
        </tr>
      </thead>
      <tbody>
        {causes.map((c) => (
          <tr key={c.key}>
            <th>{c.label}</th>
            <td>{num(c.last)}</td>
            <td>{num(c.next)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
