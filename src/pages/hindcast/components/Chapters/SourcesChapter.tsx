/* Chapter two: what went in. The tickets read, by what happened to them; the logic replayed
 * over them; and where the data ran out, so an unknown is never read as a miss. */

import { CalendarClock, CircleDashed, Filter } from 'lucide-react';
import type { ReactNode } from 'react';
import { num } from '../../../../lib/format';
import { serviceName } from '../../data/mockData';
import { dayMonth } from '../../model/labels';
import type { Focus } from '../../model/narrow';
import { lastDay, type Replay } from '../../model/replay';
import type { LifeKey } from '../../model/words';
import { Panel } from '../Panel/Panel';
import { Population } from '../Replay/Bars';
import { Unknowns, type ListPick } from '../Replay/Lists';

const asList = (f: Focus | null): ListPick | null => (f && (f.kind === 'source' || f.kind === 'gap' || f.kind === 'unknown') ? f : null);

function Stat({ icon, value, label, note }: { icon: ReactNode; value: number; label: string; note: string }) {
  return (
    <div className="ol-stat">
      <span className="ol-stat-icon" aria-hidden>
        {icon}
      </span>
      <b>{num(value)}</b>
      <span className="ol-stat-label">{label}</span>
      <small>{note}</small>
    </div>
  );
}

export function SourcesChapter({ r, life, onLife, focus, onFocus, basis }: { r: Replay; life: LifeKey | null; onLife: (k: LifeKey | null) => void; focus: Focus | null; onFocus: (f: Focus | null) => void; basis: string }) {
  const hypo = r.hypothetical.length;
  return (
    <div className="ol-ch ol-ch-sources">
      <Panel area="read" title="Tickets read" meta={`${dayMonth(r.scope.from)} to ${dayMonth(lastDay(r.scope.to))}, ${r.scope.serviceId === 'all' ? 'every service' : serviceName(r.scope.serviceId)}`}>
        <Population population={r.population} picked={life} onPick={onLife} />
        <p className="ol-chip-note">
          <span className="ol-chip">Only these get a verdict</span>
          the <b>{num(r.population.closedByHand)}</b> closed by hand. Closed is an outcome, not proof it was noise.
        </p>
      </Panel>

      <Panel area="logic" title="Logic replayed" meta={basis}>
        <div className="ol-stats">
          <Stat icon={<Filter size={14} />} value={r.activeRules} label="Active rules" note="Running today" />
          <Stat icon={<CalendarClock size={14} />} value={r.windows} label="Approved windows" note="Every time each ran" />
          <Stat icon={<CircleDashed size={14} />} value={hypo} label="Proposed or inactive" note="Replayed apart, as hypotheses" />
        </div>
      </Panel>

      <Panel area="ran-out" title="Where the data ran out" meta={`${num(r.groups.unknown)} couldn’t be checked`}>
        <Unknowns reasons={r.unknowns} total={r.groups.unknown} picked={asList(focus)} onPick={onFocus} />
      </Panel>
    </div>
  );
}
