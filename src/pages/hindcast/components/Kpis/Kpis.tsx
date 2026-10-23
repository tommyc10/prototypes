/* The row of headline figures across the top of either view. Each says one number, how it
 * compares with the period before, and its shape. The comparison only turns orange when it
 * moved the wrong way by a tenth or more; otherwise everything stays grey. */

import type { CSSProperties, ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { pct } from '../../../../lib/format';
import { Sparkline } from '../charts/Sparkline';
import './Kpis.css';

export interface KpiTile {
  label: string;
  value: ReactNode;
  /** Words under the number when there's no comparison, or beside it when there is. */
  note?: string;
  /** Signed change against the period before (0.12 = up 12%), or null. */
  change?: number | null;
  /** Which way is good. Left out for figures where neither is. */
  better?: 'up' | 'down';
  /** What the change is against: "vs previous 26 weeks". */
  against?: string;
  series?: number[];
  /** Where the series turns from history into forecast. */
  split?: number;
}

export function Kpis({ tiles }: { tiles: KpiTile[] }) {
  return (
    <div className="ol-kpis" data-area="kpis">
      {tiles.map((tile, i) => {
        const worse = tile.change != null && tile.better && (tile.better === 'up' ? tile.change <= -0.1 : tile.change >= 0.1);
        return (
          <div className="ol-kpi" key={tile.label} style={{ '--i': i } as CSSProperties}>
            <div className="ol-kpi-label">{tile.label}</div>
            <div className="ol-kpi-row">
              <div className="ol-kpi-value">{tile.value}</div>
              {tile.series && <Sparkline values={tile.series} split={tile.split} label={`${tile.label}, week by week`} />}
            </div>
            <div className="ol-kpi-foot">
              {tile.change != null && (
                <span className="ol-kpi-change" data-worse={worse || undefined}>
                  {tile.change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {pct(Math.abs(tile.change))}
                </span>
              )}
              <span className="mn-truncate">{tile.change != null ? tile.against : tile.note}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
