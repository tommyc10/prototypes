/* A chart with its title, and a switch to the same numbers as a table. Every chart on the
 * page has one: the table is how a screen reader, a keyboard or a copy-and-paste gets at
 * the values a tooltip would otherwise keep to itself. */

import { useState, type ReactNode } from 'react';
import { ChartNoAxesColumn, Table2 } from 'lucide-react';

export interface FigureTable {
  head: string[];
  rows: (string | number)[][];
}

export function Figure({
  title,
  note,
  table,
  children,
}: {
  title: string;
  /** A few words after the title: the unit, or what the bars are out of. */
  note?: ReactNode;
  table: FigureTable;
  children: ReactNode;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className="hc-fig">
      <h3>
        {title}
        {note && <span className="mn-subtle">{note}</span>}
        <button
          className="mn-icon-btn hc-fig-toggle"
          onClick={() => setAsTable(!asTable)}
          aria-pressed={asTable}
          aria-label={`${title}: show as a ${asTable ? 'chart' : 'table'}`}
          title={asTable ? 'Show the chart' : 'Show as a table'}
        >
          {asTable ? <ChartNoAxesColumn size={14} /> : <Table2 size={14} />}
        </button>
      </h3>
      {asTable ? (
        <div className="hc-table-wrap">
          <table className="hc-table">
            <thead>
              <tr>
                {table.head.map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (j === 0 ? <th key={j} scope="row">{cell}</th> : <td key={j}>{cell}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </section>
  );
}
