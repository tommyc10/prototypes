/* The estate in four numbers: what's in place now, what's past its planned end, what's
 * about to start, and how many alerts the windows in place have held back. */

import { num } from '../../../../lib/format';
import type { ChangeWindow } from '../../model/types';
import { HOUR, heldTotal, inPlace, statusOf } from '../../model/windows';
import './Tally.css';

export function Tally({ windows, now }: { windows: ChangeWindow[]; now: number }) {
  const live = windows.filter((w) => inPlace(w, now));
  const overrunning = live.filter((w) => statusOf(w, now) === 'overrunning').length;
  const soon = windows.filter((w) => statusOf(w, now) === 'upcoming' && w.start - now <= 24 * HOUR).length;
  const groups = new Set(live.map((w) => w.groupId)).size;
  return (
    <dl className="cw-tally" data-tour="cw-tally">
      <div data-lit>
        <dt>In place now</dt>
        <dd>{live.length}</dd>
        <span className="mn-subtle">
          across {groups} {groups === 1 ? 'group' : 'groups'}
        </span>
      </div>
      <div data-tone={overrunning ? 'warn' : undefined}>
        <dt>Overrunning</dt>
        <dd>{overrunning}</dd>
        <span className="mn-subtle">past the planned end</span>
      </div>
      <div>
        <dt>Starting soon</dt>
        <dd>{soon}</dd>
        <span className="mn-subtle">in the next 24 hours</span>
      </div>
      <div>
        <dt>Alerts held back</dt>
        <dd>{num(live.reduce((sum, w) => sum + heldTotal(w), 0))}</dd>
        <span className="mn-subtle">by the windows in place</span>
      </div>
    </dl>
  );
}
