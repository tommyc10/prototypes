/* Scan: one light for the whole page. While the list waits, its marks ring one after
 * another, top to bottom; while the journey waits, the journey's own dot runs its line.
 * When both wait (a link, a refresh), the light runs down the list first and then along
 * the line, so the two read as one search. The rows stay, greyed, with their marks
 * emptied of status, because what they said may no longer be true. */

import type { CSSProperties } from 'react';
import { JourneyWaiting } from '../../../src/pages/incidents/components/Journey/Journey';
import { IncidentRow, LATEST, Meta, type DetailWaitingProps, type ListWaitingProps, type Variant } from '../shared';
import './variants.css';

/** After a search that found nothing, a few marks give the light somewhere to run. */
const FEWEST = 3;

function ScanList({ wait, rows, selectedId, onSelect }: ListWaitingProps) {
  if (rows.length) {
    return rows.map((life, i) => (
      <IncidentRow key={life.incident.id} life={life} index={i} selected={life.incident.id === selectedId} onSelect={onSelect} stale />
    ));
  }
  // Nothing to keep: only the marks, at a real row's height. Every row has one.
  return Array.from({ length: wait.kind === 'cold' ? LATEST : FEWEST }, (_, i) => (
    <div key={i} className="ic-row pl-mark" aria-hidden style={{ '--i': i } as CSSProperties}>
      <i />
      <div className="ic-row-main">
        <div className="ic-row-title">{' '}</div>
        <div className="ic-row-sub">{' '}</div>
      </div>
    </div>
  ));
}

function ScanDetail({ id, row }: DetailWaitingProps) {
  return (
    <>
      <header className="ic-head">
        {row ? <h2>{row.incident.title}</h2> : <span className="ic-bar" data-size="title" />}
        <Meta row={row} hole={<span className="ic-bar" data-size="meta" />} />
        <p className="ic-verdict" data-waiting>
          Fetching the journey of {id}…
        </p>
      </header>
      <JourneyWaiting />
    </>
  );
}

export const scan: Variant = {
  name: 'Scan',
  className: 'pl-scan',
  says: (wait) => (wait.kind === 'cold' ? `Fetching the ${LATEST} latest…` : `Searching every incident for “${wait.query}”…`),
  ListWaiting: ScanList,
  DetailWaiting: ScanDetail,
  badge: null,
  keepsRows: true,
};
