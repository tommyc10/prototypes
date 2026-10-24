/* Causes, before and after: tickets each cause raised in the weeks just gone against what it
 * should raise in the weeks ahead. Two bars per cause from the grey ramp, the forecast the
 * brighter, on one shared scale. When the scope changes, the bars and figures morph and rows
 * slide to their new rank; a cause that comes into view grows in, and one that goes shrinks
 * away (hindcast/hooks/useTween and useFlip). */

import { useRef, type CSSProperties } from 'react';
import { num } from '../../../../lib/format';
import { useFlip } from '../../../hindcast/hooks/useFlip';
import { useTweenedNumbers, useTweenedRows } from '../../../hindcast/hooks/useTween';
import type { CauseOutlook as Row } from '../../model/types';

export function CauseOutlook({ causes }: { causes: Row[] }) {
  const rows = useTweenedRows(causes, (c) => c.key, (c) => ({ last: c.last, next: c.next }));
  const { max } = useTweenedNumbers({ max: Math.max(1, ...causes.flatMap((c) => [c.last, c.next])) });
  const listRef = useRef<HTMLDivElement>(null);
  useFlip(listRef, causes.map((c) => c.key).join());
  return (
    <div className="ol-pair" ref={listRef}>
      {rows.map(({ key, row, values: v, presence }, i) => (
        <div
          className="ol-pair-row"
          key={key}
          data-flip={key}
          style={{ opacity: presence }}
          aria-label={row ? `${row.label}: ${num(row.last)} in the weeks just gone, ${num(row.next)} expected` : undefined}
          aria-hidden={!row || undefined}
        >
          <span className="ol-pair-name mn-truncate">{row?.label ?? ''}</span>
          <span className="ol-pair-bars" aria-hidden>
            <i className="ol-grow-x" data-tone="last" style={{ transform: `scaleX(${v.last / max})`, '--i': i } as CSSProperties} />
            <i className="ol-grow-x" data-tone="next" style={{ transform: `scaleX(${v.next / max})`, '--i': i + 2 } as CSSProperties} />
          </span>
          <span className="ol-pair-num">
            <span>{num(Math.round(v.last))}</span>
            {num(Math.round(v.next))}
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
