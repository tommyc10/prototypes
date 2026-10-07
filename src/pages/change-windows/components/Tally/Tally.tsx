/* The estate in four numbers: what's in place now, what's past its planned end, what's
 * about to start, and how many alerts the windows in place have held back. When nobody
 * is counting held alerts, the fourth number is what's about to end instead: a number
 * we do have, rather than a dash. */

import { num } from '../../../../lib/format';
import type { ChangeWindow } from '../../model/types';
import { HOUR, UNASSIGNED, heldTotal, inPlace, statusOf } from '../../model/windows';
import './Tally.css';

export function Tally({ windows, now }: { windows: ChangeWindow[]; now: number }) {
  const live = windows.filter((w) => inPlace(w, now));
  const overrunning = live.filter((w) => statusOf(w, now) === 'overrunning').length;
  const soon = windows.filter((w) => statusOf(w, now) === 'upcoming' && w.start - now <= 24 * HOUR).length;
  // Only real groups count: "no group" isn't one.
  const groups = new Set(live.map((w) => w.groupId).filter((id) => id !== UNASSIGNED)).size;
  const ungrouped = live.filter((w) => w.groupId === UNASSIGNED).length;
  const counted = live.some((w) => w.held !== undefined);
  const ending = live.filter((w) => w.plannedEnd > now && w.plannedEnd - now <= 2 * HOUR).length;
  return (
    <dl className="cw-tally" data-tour="cw-tally">
      <div data-lit>
        <dt>In place now</dt>
        <dd>{live.length}</dd>
        <span className="mn-subtle">
          {ungrouped > live.length / 2
            ? `${ungrouped} with no group`
            : `across ${groups} ${groups === 1 ? 'group' : 'groups'}`}
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
      {counted ? (
        <div>
          <dt>Alerts held back</dt>
          <dd>{num(live.reduce((sum, w) => sum + heldTotal(w), 0))}</dd>
          <span className="mn-subtle">by the windows in place</span>
        </div>
      ) : (
        <div>
          <dt>Ending soon</dt>
          <dd>{ending}</dd>
          <span className="mn-subtle">in the next 2 hours</span>
        </div>
      )}
    </dl>
  );
}
