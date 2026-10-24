/* Mark: no placeholders at all. Whatever is waiting empties, and one calm object sits in the
 * middle of it: the brand mark, its ring turning slowly round the dot. When both columns
 * wait there's one mark, centred across both, so the page loads as one place, not two
 * panels. What's already known (a picked incident's title) stays where it is. Nothing on
 * screen pretends to be content, so nothing can look broken. */

import type { DetailWaitingProps, ListWaitingProps, OverlayProps } from '../shared';
import { Meta, listSays } from '../shared';
import { region } from './Veil';
import './variants.css';

const MarkList = (_: ListWaitingProps) => null;

function MarkDetail({ row }: DetailWaitingProps) {
  if (!row) return null;
  return (
    <header className="ic-head">
      <h2>{row.incident.title}</h2>
      <Meta row={row} />
    </header>
  );
}

function MarkOverlay(props: OverlayProps) {
  if (!props.list && !props.detail) return null;
  return (
    <div className="ld-mark-region" style={region(props)} aria-hidden>
      <div className="ld-mark" key={`${props.list}-${props.detail}`}>
        <svg viewBox="0 0 48 48" width="44" height="44">
          <circle className="ld-mark-track" cx="24" cy="24" r="17" />
          <circle className="ld-mark-arc" cx="24" cy="24" r="17" />
          <circle className="ld-mark-dot" cx="24" cy="24" r="4.5" />
        </svg>
        <span>{props.says}</span>
      </div>
    </div>
  );
}

export const mark = {
  name: 'Mark',
  idea: 'No placeholders: one calm object, the brand mark, in whatever is loading',
  className: 'ld-mark-page',
  says: listSays,
  ListWaiting: MarkList,
  DetailWaiting: MarkDetail,
  Overlay: MarkOverlay,
  badge: null,
  keepsRows: false,
};
