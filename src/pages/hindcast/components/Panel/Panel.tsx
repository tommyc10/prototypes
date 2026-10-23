/* A card on the grid: a title, a quiet line of meta, anything the panel wants in its corner,
 * and a body that takes the rest of the cell. A chart passes its numbers as `table` and gets
 * the switch between the two. */

import { useState, type CSSProperties, type ReactNode } from 'react';
import { ChartColumn, Table2 } from 'lucide-react';
import './Panel.css';

export function Panel({
  area,
  title,
  meta,
  actions,
  table,
  children,
  index = 0,
}: {
  /** Which cell of the page grid it fills. */
  area: string;
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  /** The same numbers as a table, for the chart's table view. */
  table?: ReactNode;
  children: ReactNode;
  /** Its place in the entrance, for the stagger. */
  index?: number;
}) {
  const [asTable, setAsTable] = useState(false);
  // Set once the reader has switched views, so only their switches cross-fade, not the first mount.
  const [swapped, setSwapped] = useState(false);
  return (
    <section className="ol-panel" data-area={area} style={{ '--i': index } as CSSProperties} aria-label={title}>
      <header className="ol-panel-head">
        <h2>{title}</h2>
        {meta && <span className="ol-panel-meta">{meta}</span>}
        <span className="ol-panel-actions">
          {actions}
          {table && (
            <button
              className="mn-icon-btn ol-panel-toggle"
              aria-pressed={asTable}
              aria-label={asTable ? 'Show as chart' : 'Show as table'}
              title={asTable ? 'Show as chart' : 'Show as table'}
              onClick={() => { setSwapped(true); setAsTable((on) => !on); }}
            >
              <ChartColumn size={14} className="ol-toggle-chart" aria-hidden />
              <Table2 size={14} className="ol-toggle-table" aria-hidden />
            </button>
          )}
        </span>
      </header>
      <div className="ol-panel-body" data-swapped={swapped || undefined}>
        <div className="ol-panel-view" key={asTable ? 'table' : 'chart'}>
          {asTable ? <div className="ol-table-wrap">{table}</div> : children}
        </div>
      </div>
    </section>
  );
}
