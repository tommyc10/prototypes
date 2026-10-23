/* Keep: no shapes stand in for anything. What's on screen stays, greyed and dimmed, and a
 * sentence says what's being fetched. Nothing can be the wrong size, because nothing is
 * drawn for what isn't known. */

import { IncidentRow, LATEST, Meta, beforeWords, type DetailWaitingProps, type ListWaitingProps, type Variant } from '../shared';
import './variants.css';

function KeepList({ rows, selectedId, onSelect }: ListWaitingProps) {
  // On a cold open there is nothing to keep, so the list is empty under its sentence.
  return rows.map((life, i) => (
    <IncidentRow key={life.incident.id} life={life} index={i} selected={life.incident.id === selectedId} onSelect={onSelect} stale />
  ));
}

function KeepDetail({ id, row }: DetailWaitingProps) {
  if (!row) {
    // Only the number is known. It takes the title's place, so the header keeps its height.
    return (
      <header className="ic-head">
        <h2 className="pl-saying">Fetching {id}…</h2>
        <Meta hole={null} />
        <p className="ic-verdict" data-waiting aria-hidden>
          {' '}
        </p>
      </header>
    );
  }
  return (
    <header className="ic-head">
      <h2>{row.incident.title}</h2>
      <Meta row={row} hole={null} />
      <p className="ic-verdict" data-waiting>Fetching the journey of {id}…</p>
    </header>
  );
}

export const keep: Variant = {
  name: 'Keep',
  className: 'pl-keep',
  says: (wait) => (wait.kind === 'cold' ? `Fetching the ${LATEST} latest…` : `Searching for “${wait.query}”. Showing ${beforeWords(wait.before)} until then.`),
  ListWaiting: KeepList,
  DetailWaiting: KeepDetail,
  // The badge is the ending's colour. A grey stand-in would read as a real grey ending.
  badge: null,
  keepsRows: true,
};
