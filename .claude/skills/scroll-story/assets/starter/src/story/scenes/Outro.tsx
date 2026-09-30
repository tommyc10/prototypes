/* The closing frame: the same wall, quiet now. */

import { PRODUCT } from '../data';

export function Outro({ onReplay }: { onReplay: () => void }) {
  return (
    <div className="scene sc-outro">
      <div className="outro">
        <h2 className="outro-title">Quiet, on purpose.</h2>
        <p className="outro-sub">Same morning, same queue. Now the only tickets left are the ones that need a person.</p>
        <dl className="outro-stats">
          <div className="outro-stat">
            <dt>
              <span className="num outro-num">120</span>
            </dt>
            <dd>tickets nobody had to touch</dd>
          </div>
          <div className="outro-stat">
            <dt>
              <span className="num outro-num">22</span>h
            </dt>
            <dd>handed back to the team</dd>
          </div>
        </dl>
        <div className="outro-actions">
          <a className="btn" data-variant="primary" href={PRODUCT.url}>
            Try {PRODUCT.name} ↗
          </a>
          <button className="btn" data-variant="ghost" type="button" onClick={onReplay}>
            ↺ Watch it again
          </button>
        </div>
      </div>
    </div>
  );
}
