/* The shapes Sheen, Wave and Unison share. They differ only in how their light moves (see
 * variants.css); the shapes are the same, so the comparison is about the motion alone.
 *
 * The list keeps its old rows while a search is out (J and K still step through them) and
 * they take the same light as the shapes in the pane, so the two columns read as one
 * surface that's waiting. On a cold open, or after a search that found nothing, rows are
 * drawn as shapes cut to a real row's size. */

import { Block, IncidentRow, LATEST, SkelDetail, SkelRows, listSays, type ListWaitingProps, type Variant } from '../shared';
import './variants.css';

/** After a search that found nothing there's no count to match; a few rows say "rows are coming". */
const FEWEST = 4;
/** More than a pane can show, so the shapes never end above the fold. */
const MOST = 16;

function PlaceholderList({ wait, rows, selectedId, onSelect }: ListWaitingProps) {
  if (rows.length) {
    return rows.map((life, i) => <IncidentRow key={life.incident.id} life={life} index={i} selected={life.incident.id === selectedId} onSelect={onSelect} stale />);
  }
  return <SkelRows count={wait.kind === 'cold' ? LATEST : Math.min(MOST, FEWEST)} />;
}

export const placeholderVariant = (v: Pick<Variant, 'name' | 'idea' | 'className' | 'period'>): Variant => ({
  ...v,
  says: listSays,
  ListWaiting: PlaceholderList,
  DetailWaiting: SkelDetail,
  badge: <Block w="78px" h={22} r={999} className="ld-badge" />,
  keepsRows: true,
});
