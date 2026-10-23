/* Outline: the page's own silhouette. Every piece that's coming has a grey shape where it
 * will land, the whole outline breathes together, and nothing travels. */

import type { CSSProperties } from 'react';
import { STATION_LABEL } from '../../../src/pages/incidents/model/lifecycle';
import type { StationId } from '../../../src/pages/incidents/model/types';
import { Bar, KnownHead, type WaitingProps } from '../shared';
import './variants.css';

const LINE: StationId[] = ['raised', 'windows', 'rules', 'duplicates', 'enrichment', 'delivered'];

export function OutlineWaiting({ id, row }: WaitingProps) {
  return (
    <div className="sl-outline" role="status" aria-label={`Fetching the journey of ${id}`}>
      <KnownHead
        row={row}
        verdict={
          <p className="ic-verdict sl-lines">
            <Bar w="92%" h={14} />
            <Bar w="58%" h={14} />
          </p>
        }
      />
      <div className="ic-journey-wrap" aria-hidden style={{ marginTop: 36 }}>
        <ol className="ic-journey">
          {LINE.map((station, i) => (
            <li key={station} data-state="unreached" style={{ '--i': i } as CSSProperties}>
              {i > 0 && <span className="ic-leg" />}
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
      <div className="ic-stages" aria-hidden style={{ marginTop: 36 }}>
        {[0, 1, 2].map((n) => (
          <section key={n}>
            <header>
              <span className="ic-stage-number">{n + 1}</span>
              <Bar w="120px" h={12} />
              <span />
              <Bar w="56px" h={8} />
            </header>
            <div className="ic-stage-body sl-lines">
              <Bar w="88%" />
              <Bar w="64%" />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
