/* A ranked breakdown: one row per reason or category, the busiest first. The bars share one
 * scale (the busiest row is full length) and each is split by what would have caught it. */

import { useState } from 'react';
import { num, pct } from '../../../../lib/format';
import { caught, share, total } from '../../model/labels';
import type { BreakdownRow } from '../../model/types';
import { SplitBar } from './SplitBar';
import { Tip, splitRows } from './Tip';

export function BreakdownBars({ rows }: { rows: BreakdownRow[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(1, ...rows.map((r) => total(r.split)));
  return (
    <div className="hc-brows" role="list" onPointerLeave={() => setHover(null)}>
      {rows.map((row) => {
        const sum = total(row.split);
        return (
          <div
            key={row.key}
            className="hc-brow"
            role="listitem"
            tabIndex={0}
            data-hover={hover === row.key || undefined}
            onPointerEnter={() => setHover(row.key)}
            onFocus={() => setHover(row.key)}
            onBlur={() => setHover(null)}
          >
            <span className="hc-brow-label mn-truncate">{row.label}</span>
            <SplitBar split={row.split} of={max} />
            <span className="hc-brow-val">{num(sum)}</span>
            {hover === row.key && (
              <Tip title={row.label} rows={splitRows(row.split)} foot={`${pct(share(caught(row.split), sum))} would have been caught`} edge="end" />
            )}
          </div>
        );
      })}
    </div>
  );
}
