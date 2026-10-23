/* The tooltip every chart on the page shares: solid, not glass, because bright marks would
 * wash through glass. Values lead and labels follow. It's placed in pixels inside whatever
 * relative box it's in, and flips to the left of the point past the middle so it's never cut off. */

import type { CSSProperties } from 'react';

export interface TipRow {
  /** A CSS colour for the row's key stroke. */
  tone?: string;
  value: string;
  label: string;
}

export function Tip({ x, y, flip, title, rows, foot }: { x: number; y: number; flip?: boolean; title: string; rows: TipRow[]; foot?: string }) {
  return (
    <div className="ol-tip" data-flip={flip || undefined} style={{ '--x': `${x}px`, '--y': `${y}px` } as CSSProperties} role="presentation">
      <div className="ol-tip-title">{title}</div>
      {rows.map((row) => (
        <div className="ol-tip-row" key={row.label}>
          <i style={{ background: row.tone ?? 'transparent' }} />
          <b>{row.value}</b>
          <span>{row.label}</span>
        </div>
      ))}
      {foot && <div className="ol-tip-foot">{foot}</div>}
    </div>
  );
}
