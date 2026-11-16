/* Why the replay couldn't tell, so nobody reads an unknown as a miss: each reason with the
 * tickets closed by hand it covers. A row narrows the ticket dock to them. Shown in the Sources
 * chapter and in an extract's diagnostics. */

import type { CSSProperties } from 'react';
import { CircleDashed, CloudOff } from 'lucide-react';
import { num } from '../../../../lib/format';
import type { UnknownReason } from '../../model/replay';

export type ListPick = { kind: 'source'; id: string } | { kind: 'gap'; key: string } | { kind: 'unknown'; key: string };

const picks = (picked: ListPick | null, kind: ListPick['kind'], id: string) =>
  !!picked && picked.kind === kind && (picked.kind === 'source' ? picked.id : picked.key) === id;

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
