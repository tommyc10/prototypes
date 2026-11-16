/* How far a historical extract can be trusted: what the ticket store gave it, when the change
 * calendar was missing, which fields its rules read and how often they were recorded, and
 * what has moved since it ran. Its own view, beside the extract's aggregate. */

import type { CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import { num, pct } from '../../../../lib/format';
import type { Diagnostics as D } from '../../model/extract';
import type { UnknownReason } from '../../model/replay';
import { Panel } from '../Panel/Panel';
import { Unknowns, type ListPick } from './Lists';

const day = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const STATUS: Record<string, string> = { active: 'Active', proposed: 'Proposed', inactive: 'Inactive' };

/** Picking an unknown here opens the aggregate narrowed to it. */
export function Diagnostics({ d, from, to, unknowns, unknownTotal, onPick }: { d: D; from: number; to: number; unknowns: UnknownReason[]; unknownTotal: number; onPick: (p: ListPick | null) => void }) {
  const span = to - from;
  const steps = [
    { key: 'read', label: 'Rows read from the ticket store', value: d.rows.read },
    { key: 'dup', label: 'Dropped as duplicates', value: -d.rows.duplicates },
    { key: 'noci', label: 'Dropped with no CI to match on', value: -d.rows.noCi },
    { key: 'kept', label: 'Kept and replayed', value: d.rows.kept },
  ];

  return (
    <div className="ol-rgrid" data-view="diagnostics">
      <Panel area="rows" index={0} title="What the ticket store gave it" meta={`${num(d.rows.kept)} kept of ${num(d.rows.read)}`}>
        <ol className="ol-funnel">
          {steps.map((s, i) => (
            <li key={s.key} className="ol-fade" data-kind={s.value < 0 ? 'drop' : s.key} style={{ '--i': i } as CSSProperties}>
              <span className="ol-funnel-bar" aria-hidden>
                <i style={{ transform: `scaleX(${Math.abs(s.value) / d.rows.read})` }} />
              </span>
              <span className="ol-funnel-label">{s.label}</span>
              <b>{s.value < 0 ? `−${num(-s.value)}` : num(s.value)}</b>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel area="calendar" index={1} title="Change calendar" meta={`There for ${pct(d.calendarShare)} of the extract`}>
        <div className="ol-cal-strip ol-wipe" role="img" aria-label={`Change calendar coverage from ${day(from)} to ${day(to - 1)}`}>
          {d.gaps.map((g) => (
            <i
              key={`${g.serviceId}:${g.from}`}
              data-scope={g.serviceId === 'all' ? 'all' : 'one'}
              style={{ left: `${((g.from - from) / span) * 100}%`, width: `${Math.max(0.6, ((g.to - g.from) / span) * 100)}%` } as CSSProperties}
            />
          ))}
        </div>
        <div className="ol-cal-ends" aria-hidden>
          <span>{day(from)}</span>
          <span>{day(to - 1)}</span>
        </div>
        {d.gaps.length === 0 ? (
          <p className="ol-diag-ok">The calendar was there for the whole extract.</p>
        ) : (
          <ul className="ol-diag-list">
            {d.gaps.map((g) => (
              <li key={`${g.serviceId}:${g.from}`}>
                <b>
                  {day(g.from)} to {day(g.to - 1)}
                </b>
                <span>
                  {g.serviceId === 'all' ? 'Every service. ' : 'One service. '}
                  {g.why}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel area="fields" index={2} title="Fields the rules read" meta="Recorded on the tickets each rule checks">
        {d.fields.length === 0 ? (
          <p className="ol-empty">Every rule here reads fields the ticket store has always kept.</p>
        ) : (
          <ul className="ol-fields">
            {d.fields.map((f, i) => {
              const share = f.read ? f.recorded / f.read : 1;
              return (
                <li key={f.ruleId} className="ol-fade" style={{ '--i': i } as CSSProperties}>
                  <div className="ol-field-head">
                    <code>{f.field}</code>
                    <b data-low={share < 0.9 || undefined}>{pct(share)}</b>
                  </div>
                  <span className="ol-meter" aria-hidden>
                    <i style={{ transform: `scaleX(${share})` }} />
                  </span>
                  <p>
                    <code>{f.ruleId}</code> reads it on {num(f.read)} {f.read === 1 ? 'ticket' : 'tickets'}. Recorded from {day(f.since)}, so {num(f.read - f.recorded)} couldn’t be evaluated.
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel area="since" index={3} title="Changed since it ran" meta="The extract keeps them as they were">
        {d.changed.length === 0 && d.newWindows.length === 0 ? (
          <p className="ol-empty">Nothing it replayed has changed since.</p>
        ) : (
          <ul className="ol-diag-list">
            {d.changed.map((c) => (
              <li key={c.id}>
                <b>
                  <code>{c.id}</code>
                </b>
                <span className="ol-since">
                  <span className="mn-truncate">{c.name}</span>
                  <span className="ol-since-move">
                    <span className="ol-status" data-status={c.then}>
                      {STATUS[c.then]}
                    </span>
                    <ArrowRight size={12} aria-label="now" />
                    <span className="ol-status" data-status={c.now}>
                      {STATUS[c.now]}
                    </span>
                  </span>
                </span>
              </li>
            ))}
            {d.newWindows.map((w) => (
              <li key={w.id}>
                <b>
                  <code>{w.id}</code>
                </b>
                <span>{w.name}: approved since, so the extract doesn’t know it.</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel area="unknowns" index={4} title="Unknowns in this extract" meta={`${num(unknownTotal)} couldn’t be checked`}>
        <Unknowns reasons={unknowns} total={unknownTotal} picked={null} onPick={onPick} />
      </Panel>
    </div>
  );
}
