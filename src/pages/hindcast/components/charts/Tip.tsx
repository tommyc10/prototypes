/* The tooltip every chart shares. Values lead and labels follow, because by now the reader
 * knows the series and wants the number. Each row is keyed by a short stroke of its colour.
 *
 * It sits above whatever it's inside (which needs `position: relative`); `edge` flips it
 * inwards near the sides of a chart so it's never cut off. Nothing here is only in the
 * tooltip: every figure is also on the page or in the chart's table view. */

import { num } from '../../../../lib/format';
import { OUTCOMES, OUTCOME_LABEL } from '../../model/labels';
import type { Split } from '../../model/types';

export interface TipRow {
  /** Which colour the row's key is drawn in. */
  tone?: string;
  value: string;
  label: string;
}

export function Tip({ title, rows, foot, edge }: { title: string; rows: TipRow[]; foot?: string; edge?: 'start' | 'end' }) {
  return (
    <div className="hc-tip" data-edge={edge} role="presentation">
      <div className="hc-tip-title">{title}</div>
      {rows.map((row) => (
        <div className="hc-tip-row" key={row.label}>
          <i data-tone={row.tone} />
          <b>{row.value}</b>
          <span>{row.label}</span>
        </div>
      ))}
      {foot && <div className="hc-tip-foot">{foot}</div>}
    </div>
  );
}

/** The three rows for a split. */
export const splitRows = (split: Split): TipRow[] =>
  OUTCOMES.map((o) => ({ tone: o, value: num(split[o]), label: OUTCOME_LABEL[o] }));
