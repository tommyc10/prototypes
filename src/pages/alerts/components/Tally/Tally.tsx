/* The hour in four numbers, in the order they happened to an alert: it arrived, a rule hid
 * it, or it was folded into an incident, or it reached a person. The last one is the one
 * that costs someone's attention, so it's the one that's lit. */

import { num, pct } from '../../../../lib/format';
import type { Tally as Counts } from '../../model/types';
import './Tally.css';

export function Tally({ counts, rewound }: { counts: Counts; /** The stream is rewound: these are the totals up to then. */ rewound: boolean }) {
  const share = (n: number) => (counts.total ? pct(n / counts.total) : '0%');
  return (
    <dl className="al-tally" data-tour="al-tally">
      <div>
        <dt>Alerts</dt>
        <dd>{num(counts.total)}</dd>
        <span className="mn-subtle">{rewound ? 'up to the playhead' : 'in the last hour'}</span>
      </div>
      <div>
        <dt>Hidden by rules</dt>
        <dd>{num(counts.hidden)}</dd>
        <span className="mn-subtle">{share(counts.hidden)} never seen</span>
      </div>
      <div>
        <dt>Folded</dt>
        <dd>{num(counts.folded)}</dd>
        <span className="mn-subtle">{share(counts.folded)} joined an incident</span>
      </div>
      <div data-lit>
        <dt>Reached a person</dt>
        <dd>{num(counts.paged)}</dd>
        <span className="mn-subtle">{share(counts.paged)} opened an incident</span>
      </div>
    </dl>
  );
}
