/* Chapter three: what does the explaining, in two lists, active rules and approved windows,
 * side by side when there's room. Each source is one bar on one shared scale:
 * solid for the tickets only it explains, lighter for the ones it shares with another source,
 * hatched for the ones a rule couldn't read. Bars overlap by design, so they never add up to
 * the explained total, and the strip above says so in one line. */

import { useRef, type CSSProperties } from 'react';
import { ArrowUpRight, CalendarClock, Filter } from 'lucide-react';
import { num } from '../../../../lib/format';
import { useFlip } from '../../hooks/useFlip';
import { useTweenedRows } from '../../hooks/useTween';
import type { Focus } from '../../model/narrow';
import type { Replay, SourceRow } from '../../model/replay';

type Frames = ReturnType<typeof useTweenedRows<SourceRow, { matches: number; only: number; unevaluable: number; incidents: number }>>;

export function CaughtBy({ r, focus, onFocus }: { r: Replay; focus: Focus | null; onFocus: (f: Focus | null) => void }) {
  const rows = r.sources;
  const frames = useTweenedRows(rows, (s) => s.id, (s) => ({ matches: s.matches, only: s.only, unevaluable: s.unevaluable, incidents: s.incidents }));
  // One scale for both lists, so a rule's bar and a window's bar compare.
  const top = Math.max(1, ...rows.map((s) => s.matches + s.unevaluable));
  const sum = rows.reduce((n, s) => n + s.matches, 0);
  const picked = focus?.kind === 'source' ? focus.id : null;

  if (rows.length === 0) return <p className="ol-empty">No active rules or approved windows cover this scope. Everything closed by hand is a gap: see Tune next.</p>;

  const list = (kind: SourceRow['kind']) => frames.filter((f) => (f.row ?? rows.find((x) => x.id === f.key))?.kind === kind);

  return (
    <div className="ol-ch">
      <header className="ol-ch-sum ol-fade">
        <p>
          <b>{num(r.groups.explained)}</b> tickets explained by <b>{num(rows.length)}</b> {rows.length === 1 ? 'source' : 'sources'}.
        </p>
        <ul className="ol-legend" aria-label="How to read the bars">
          <li>
            <i data-part="only" /> Only this one
          </li>
          <li>
            <i data-part="shared" /> Shared with another
          </li>
          <li>
            <i data-part="unread" /> Couldn’t read a field
          </li>
          <li className="ol-legend-note" title="A ticket a rule and a window both explain counts on both rows, and once in the verdict.">
            Rows overlap: {num(sum)} matches, {num(r.groups.explained)} tickets
          </li>
        </ul>
      </header>

      <div className="ol-caught-lists">
        <SourceList title="Active rules" frames={list('rule')} top={top} picked={picked} onFocus={onFocus} />
        <SourceList title="Approved windows" frames={list('window')} top={top} picked={picked} onFocus={onFocus} />
      </div>
    </div>
  );
}

function SourceList({ title, frames, top, picked, onFocus }: { title: string; frames: Frames; top: number; picked: string | null; onFocus: (f: Focus | null) => void }) {
  const ref = useRef<HTMLUListElement>(null);
  useFlip(ref, frames.map((f) => f.key).join());
  if (frames.length === 0) return null;
  return (
    <section className="ol-caught-list" aria-label={title}>
      <div className="ol-caught-cols" aria-hidden>
        <span>{title}</span>
        <span>Matches, closed by hand</span>
        <span title="Of the matches, the ones that became incidents: what softening it would touch">Incidents</span>
      </div>
      <ul className="ol-caught" ref={ref}>
        {frames.map(({ key, values, presence, row }, i) => {
          if (!row) return null;
          const on = picked === row.id;
          const shared = Math.max(0, values.matches - values.only);
          return (
            <li key={key} data-flip={key} className="ol-fade" style={{ opacity: presence, '--i': i } as CSSProperties}>
              <button className="ol-caught-row" data-picked={on || undefined} aria-pressed={on} onClick={() => onFocus(on ? null : { kind: 'source', id: row.id })}>
                <span className="ol-caught-name">
                  {row.kind === 'rule' ? <Filter size={13} aria-label="Rule" /> : <CalendarClock size={13} aria-label="Change window" />}
                  <code>{row.id}</code>
                  <span className="mn-truncate">{row.name}</span>
                </span>
                <span className="ol-caught-bar" aria-label={`${num(row.matches)} matches, ${num(row.only)} only this one`}>
                  <span className="ol-caught-track">
                    <i data-part="only" style={{ flexGrow: values.only / top }} />
                    <i data-part="shared" style={{ flexGrow: shared / top }} />
                    <i data-part="unread" style={{ flexGrow: values.unevaluable / top }} />
                  </span>
                  <b>{num(Math.round(values.matches))}</b>
                </span>
                <span className="ol-caught-inc" data-bad={row.incidents > 0 || undefined}>
                  {num(Math.round(values.incidents))}
                </span>
              </button>
              {row.kind === 'rule' ? (
                <a className="mn-icon-btn ol-caught-link" href={`#/rules/${row.id}`} aria-label={`Open ${row.id} in Rules`} title="Open in Rules">
                  <ArrowUpRight size={14} />
                </a>
              ) : (
                <span className="ol-caught-link" aria-hidden />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
