/* Trace: the journey line is the loader. The six checkpoints are always the same, so the
 * line is drawn empty at once, and a light runs it end to end, each mark ringing as it
 * passes, until the incident's own journey arrives and plays over it. */

import type { CSSProperties } from 'react';
import { STATION_LABEL } from '../../../src/pages/incidents/model/lifecycle';
import type { StationId } from '../../../src/pages/incidents/model/types';
import { Bar, KnownHead, type WaitingProps } from '../shared';
import './variants.css';

const LINE: StationId[] = ['raised', 'windows', 'rules', 'duplicates', 'enrichment', 'delivered'];

export function TraceWaiting({ id, row }: WaitingProps) {
  return (
    <>
      <KnownHead row={row} verdict={<p className="ic-verdict sl-saying" role="status">Fetching the journey of {id}…</p>} />
      <div className="ic-journey-wrap sl-trace" aria-hidden style={{ '--stop': 5 } as CSSProperties}>
        <span className="ic-traveller" />
        <ol className="ic-journey">
          {LINE.map((station, i) => (
            <li key={station} data-state="unreached" style={{ '--i': i } as CSSProperties}>
              {i > 0 && <span className="ic-leg" data-lit />}
              <div className="ic-station">
                <i />
                <span className="ic-station-name">{STATION_LABEL[station]}</span>
                <span className="ic-station-verdict">
                  <Bar w="96px" />
                </span>
                <Bar w="52px" h={8} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
