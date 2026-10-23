/* Outline: a grey shape wherever words will land, cut to the real thing's size. The list
 * swaps its rows for as many skeleton rows as it had, each built from a real row's own
 * boxes, so a row lands exactly where its shape was. The page draws the header and the
 * journey line (every incident meets the same six checkpoints), and nothing it can't know
 * the size of: the sections under the line arrive below it. */

import type { CSSProperties } from 'react';
import { STATIONS, STATION_LABEL } from '../../../src/pages/incidents/model/lifecycle';
import { Bar, LATEST, spread, Meta, type DetailWaitingProps, type ListWaitingProps, type Variant } from '../shared';
import './variants.css';

/** More than a pane can show, so the skeleton never ends above the fold. */
const MOST = 16;
/** After a search that found nothing there's no count to match; a few rows say "rows are coming". */
const FEWEST = 3;

function OutlineList({ wait }: ListWaitingProps) {
  const count = wait.kind === 'cold' ? LATEST : Math.min(MOST, Math.max(FEWEST, wait.before.shown));
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="ic-row pl-skel" aria-hidden style={{ '--i': i } as CSSProperties}>
      <i />
      <div className="ic-row-main">
        <div className="ic-row-title">
          <Bar w={`${spread(i, 52, 88)}%`} />
        </div>
        <div className="ic-row-sub">
          <Bar w="64px" h={8} />
          <Bar w={`${spread(i + 5, 36, 58)}px`} h={8} />
        </div>
      </div>
      <time>
        <Bar w="38px" h={8} />
      </time>
    </div>
  ));
}

function OutlineDetail({ row }: DetailWaitingProps) {
  return (
    <>
      <header className="ic-head">
        {row ? <h2>{row.incident.title}</h2> : <span className="ic-bar" data-size="title" />}
        <Meta row={row} hole={<span className="ic-bar" data-size="meta" />} />
        {/* As many lines as most verdicts take at the pane's width: one when it's wide, two
            when it's narrow (measured over all 190 mock incidents; see variants.css). */}
        <p className="ic-verdict pl-lines" data-waiting aria-hidden>
          <span>
            <Bar w="94%" h={13} />
          </span>
          <span>
            <Bar w="58%" h={13} />
          </span>
        </p>
      </header>
      <div className="ic-journey-wrap pl-still" aria-hidden>
        <ol className="ic-journey">
          {STATIONS.map((station, i) => (
            <li key={station} data-state="unreached" style={{ '--i': i } as CSSProperties}>
              {i > 0 && <span className="ic-leg" />}
              <div className="ic-station">
                <i />
                <span className="ic-station-name">{STATION_LABEL[station]}</span>
                <span className="ic-bar" data-size="verdict" />
                <span className="ic-bar" data-size="time" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

export const outline: Variant = {
  name: 'Outline',
  className: 'pl-outline',
  says: (wait) => (wait.kind === 'cold' ? `Fetching the ${LATEST} latest…` : `Searching for “${wait.query}”…`),
  ListWaiting: OutlineList,
  DetailWaiting: OutlineDetail,
  badge: <span className="pl-bar pl-badge" aria-hidden />,
  keepsRows: false,
};
