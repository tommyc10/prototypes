/* The lists beside and under the partition:
 *
 *   Sources       each active rule and approved window, with the tickets closed by hand it
 *                 matches. Matches overlap, so the column never adds up to "explained".
 *   Hypothetical  proposed and inactive rules. They weren't running; what they'd match today
 *                 is a hypothesis, not a suppression.
 *   Gaps          tickets closed by hand that nothing explains, gathered by CI and cause.
 *   Unknowns      why the replay couldn't tell, so nobody reads an unknown as a miss.
 *
 * A row narrows the ticket list to what it counts. Ranked rows slide to their new places
 * when the scope changes (hooks/useFlip), and their figures count. */

import { useRef, type CSSProperties } from 'react';
import { CalendarClock, CircleDashed, CloudOff, Filter } from 'lucide-react';
import { num } from '../../../../lib/format';
import { Sparkline } from '../charts/Sparkline';
import { serviceName } from '../../data/mockData';
import { useFlip } from '../../hooks/useFlip';
import { useTweenedRows } from '../../hooks/useTween';
import { CAUSE_LABEL, dayMonth } from '../../model/labels';
import type { GapCluster, SourceRow, UnknownReason } from '../../model/replay';

export type ListPick = { kind: 'source'; id: string } | { kind: 'gap'; key: string } | { kind: 'unknown'; key: string };

const picks = (picked: ListPick | null, kind: ListPick['kind'], id: string) =>
  !!picked && picked.kind === kind && (picked.kind === 'source' ? picked.id : picked.key) === id;

/* ---------- sources ---------- */

export function Sources({ rows, explained, picked, onPick }: { rows: SourceRow[]; explained: number; picked: ListPick | null; onPick: (p: ListPick | null) => void }) {
  const ref = useRef<HTMLTableSectionElement>(null);
  const frames = useTweenedRows(rows, (r) => r.id, (r) => ({ matches: r.matches, only: r.only, incidents: r.incidents }));
  useFlip(ref, rows.map((r) => r.id).join());
  const top = Math.max(1, ...rows.map((r) => r.matches));
  const sum = rows.reduce((n, r) => n + r.matches, 0);

  if (rows.length === 0) return <p className="ol-empty">No active rules or approved windows cover this service. Everything closed by hand is a gap.</p>;

  return (
    <div className="ol-src">
      <div className="ol-src-scroll">
        <table className="ol-src-table">
          <thead>
            <tr>
              <th>Rule or window</th>
              <th title="Tickets closed by hand it matches">Matches</th>
              <th title="Of those, the ones nothing else explains">Only this</th>
              <th title="Of those, the ones that became incidents">Incidents</th>
            </tr>
          </thead>
          <tbody ref={ref}>
            {frames.map(({ key, values, presence, row }, i) => {
              if (!row) return null;
              const on = picks(picked, 'source', row.id);
              return (
                <tr
                  key={key}
                  data-flip={key}
                  className="ol-src-row ol-fade"
                  data-picked={on || undefined}
                  style={{ opacity: presence, '--i': i } as CSSProperties}
                  onClick={() => onPick(on ? null : { kind: 'source', id: row.id })}
                >
                  <th scope="row">
                    <button className="ol-src-name" aria-pressed={on} onClick={(e) => { e.stopPropagation(); onPick(on ? null : { kind: 'source', id: row.id }); }}>
                      {row.kind === 'rule' ? <Filter size={13} aria-label="Rule" /> : <CalendarClock size={13} aria-label="Change window" />}
                      <code>{row.id}</code>
                      <span className="mn-truncate">{row.name}</span>
                    </button>
                  </th>
                  <td>
                    <span className="ol-src-meter" aria-hidden>
                      <i style={{ transform: `scaleX(${values.matches / top})` }} />
                    </span>
                    {num(Math.round(values.matches))}
                  </td>
                  <td>{num(Math.round(values.only))}</td>
                  <td data-bad={row.incidents > 0 || undefined}>{num(Math.round(values.incidents))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="ol-src-foot">
        A ticket can match a rule and a window, so matches add up to <b>{num(sum)}</b> while <b>{num(explained)}</b> tickets are explained. Read each row on its own.
      </p>
    </div>
  );
}

/* ---------- hypothetical ---------- */

export function Hypothetical({ rows, picked, onPick }: { rows: SourceRow[]; picked: ListPick | null; onPick: (p: ListPick | null) => void }) {
  const ref = useRef<HTMLUListElement>(null);
  useFlip(ref, rows.map((r) => r.id).join());
  if (rows.length === 0) return <p className="ol-empty">No proposed or inactive rules for this service.</p>;
  return (
    <div className="ol-list-wrap">
      <p className="ol-caveat">
        These weren’t running. The counts are what they’d match today, not proof they were in place when the tickets arrived, or that a match would have been suppressed.
      </p>
      <ul className="ol-list" ref={ref}>
        {rows.map((r, i) => {
          const on = picks(picked, 'source', r.id);
          return (
            <li key={r.id} data-flip={r.id} className="ol-fade" style={{ '--i': i } as CSSProperties}>
              <button className="ol-row" data-picked={on || undefined} aria-pressed={on} onClick={() => onPick(on ? null : { kind: 'source', id: r.id })}>
                <span className="ol-row-main">
                  <span className="ol-row-title">
                    <span className="ol-status" data-status={r.status}>
                      {r.status === 'proposed' ? 'Proposed' : 'Inactive'}
                    </span>
                    <span className="mn-truncate">{r.name}</span>
                  </span>
                  <span className="ol-row-meta">
                    <code>{r.id}</code>
                    <span>
                      {num(r.only)} nothing else explains
                    </span>
                    {r.incidents > 0 && (
                      <span className="ol-bad">
                        {num(r.incidents)} became {r.incidents === 1 ? 'an incident' : 'incidents'}
                      </span>
                    )}
                  </span>
                </span>
                <span className="ol-row-num">
                  <b>{num(r.matches)}</b>
                  <small>would match</small>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- gaps worth tuning ---------- */

export function Gaps({ gaps, picked, onPick, showService }: { gaps: GapCluster[]; picked: ListPick | null; onPick: (p: ListPick | null) => void; showService: boolean }) {
  const ref = useRef<HTMLUListElement>(null);
  useFlip(ref, gaps.map((g) => g.key).join());
  if (gaps.length === 0) return <p className="ol-empty">Everything closed by hand here is explained or unknown. No gaps to tune.</p>;
  return (
    <ul className="ol-list" ref={ref}>
      {gaps.map((g, i) => {
        const on = picks(picked, 'gap', g.key);
        return (
          <li key={g.key} data-flip={g.key} className="ol-fade" style={{ '--i': i } as CSSProperties}>
            <button className="ol-row" data-picked={on || undefined} aria-pressed={on} onClick={() => onPick(on ? null : { kind: 'gap', key: g.key })}>
              <span className="ol-row-main">
                <span className="ol-row-title">
                  <code className="ol-ci">{g.ci}</code>
                  <span className="mn-truncate">{CAUSE_LABEL[g.cause]}</span>
                </span>
                <span className="ol-row-meta">
                  {showService && <span className="mn-truncate">{serviceName(g.serviceId)}</span>}
                  <span>Last {dayMonth(g.lastAt)}</span>
                  {g.incidents > 0 && (
                    <span className="ol-bad">
                      {num(g.incidents)} became {g.incidents === 1 ? 'an incident' : 'incidents'}
                    </span>
                  )}
                </span>
              </span>
              <span className="ol-row-spark">
                <Sparkline values={g.weekly} label={`${g.ci}, last 12 weeks`} />
              </span>
              <span className="ol-row-num">
                <b>{num(g.count)}</b>
                <small>closed by hand</small>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- unknowns ---------- */

export function Unknowns({ reasons, total, picked, onPick }: { reasons: UnknownReason[]; total: number; picked: ListPick | null; onPick: (p: ListPick | null) => void }) {
  if (reasons.length === 0) return <p className="ol-empty">The replay could check every ticket closed by hand here.</p>;
  return (
    <div className="ol-list-wrap">
      <p className="ol-caveat">
        <b>{num(total)}</b> {total === 1 ? 'ticket' : 'tickets'} the replay couldn’t check. Unknown, not a miss: none of them count as unexplained.
      </p>
      <ul className="ol-list">
        {reasons.map((u, i) => {
          const on = picks(picked, 'unknown', u.key);
          return (
            <li key={u.key} className="ol-fade" style={{ '--i': i } as CSSProperties}>
              <button className="ol-row" data-picked={on || undefined} aria-pressed={on} onClick={() => onPick(on ? null : { kind: 'unknown', key: u.key })}>
                {u.verdict === 'unevaluable' ? <CircleDashed size={14} className="ol-row-icon" aria-label="Couldn’t evaluate" /> : <CloudOff size={14} className="ol-row-icon" aria-label="Unavailable" />}
                <span className="ol-row-main">
                  <span className="ol-row-title">
                    <span className="ol-wrap-2">{u.title}</span>
                  </span>
                  <span className="ol-row-meta ol-wrap-2">{u.detail}</span>
                </span>
                <span className="ol-row-num">
                  <b>{num(u.count)}</b>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
