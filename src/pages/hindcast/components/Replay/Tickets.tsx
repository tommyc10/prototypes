/* Every ticket in the scope, newest first, with what happened to it and what today's logic
 * says about it. The population is all of them, not only the closed ones: the lifecycle tabs
 * narrow it, and so does anything picked above (a part of a bar, a rule, a gap, a run of
 * weeks). J and K move through the rows, Enter opens the replay of one. */

import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { Search, X } from 'lucide-react';
import { num } from '../../../../lib/format';
import { serviceName } from '../../data/mockData';
import { CAUSE_LABEL } from '../../model/labels';
import type { Replayed } from '../../model/replay';
import { LIFECYCLE, LIFE_KEYS, VERDICT_SHORT, VERDICT_TONE, type LifeKey } from '../../model/words';

export const lifeKey = (r: Replayed): LifeKey =>
  r.life.lifecycle === 'closed' ? (r.life.closedBy === 'hand' ? 'closedByHand' : 'closedAuto') : r.life.lifecycle;

const when = (ms: number) =>
  new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) +
  ' ' +
  new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

export const PAGE = 120;

export function Tickets({
  rows,
  total,
  counts,
  life,
  onLife,
  focus,
  onClearFocus,
  query,
  onQuery,
  searchRef,
  selected,
  onSelect,
  onOpen,
  limit,
  onMore,
  stale,
  showService,
}: {
  rows: Replayed[];
  /** Every ticket in the scope, before any narrowing. */
  total: number;
  counts: Record<LifeKey, number>;
  life: LifeKey | null;
  onLife: (k: LifeKey | null) => void;
  /** What's narrowing the list from above, in words, with a way to let go. */
  focus: ReactNode;
  onClearFocus: () => void;
  query: string;
  onQuery: (q: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  selected: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string, how: 'pointer' | 'key') => void;
  limit: number;
  onMore: () => void;
  stale: boolean;
  showService: boolean;
}) {
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    if (!selected) return;
    bodyRef.current?.querySelector(`[data-id="${selected}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  const shown = rows.slice(0, limit);

  return (
    <div className="ol-tix">
      <div className="ol-tix-bar">
        <div className="mn-tabs ol-tix-tabs" role="tablist" aria-label="What happened">
          <button role="tab" aria-selected={life === null} className="mn-tab" data-active={life === null || undefined} onClick={() => onLife(null)}>
            All <span>{num(total)}</span>
          </button>
          {LIFE_KEYS.map((k) => (
            <button key={k} role="tab" aria-selected={life === k} className="mn-tab" data-active={life === k || undefined} onClick={() => onLife(life === k ? null : k)}>
              {LIFECYCLE[k]} <span>{num(counts[k])}</span>
            </button>
          ))}
        </div>
        <label className="mn-search ol-tix-search">
          <Search size={14} />
          <input ref={searchRef} value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search ID, CI or title" aria-label="Search tickets" />
          {query ? (
            <button className="ol-clear" onClick={() => onQuery('')} aria-label="Clear search">
              <X size={12} />
            </button>
          ) : (
            <kbd>/</kbd>
          )}
        </label>
      </div>

      {focus && (
        <div className="ol-focus">
          <span className="ol-focus-text">{focus}</span>
          <button className="ol-focus-clear" onClick={onClearFocus} title="Let go  Esc">
            <X size={12} />
            Clear
          </button>
        </div>
      )}

      <div className="ol-tix-scroll" data-sheen-stale={stale || undefined}>
        {rows.length === 0 ? (
          <p className="ol-empty">No tickets match. Clear the search or what’s picked above to see them all.</p>
        ) : (
          <table className="ol-tix-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Opened</th>
                <th>{showService ? 'Service and CI' : 'CI'}</th>
                <th>Cause</th>
                <th>What happened</th>
                <th>Today’s logic</th>
              </tr>
            </thead>
            <tbody ref={bodyRef}>
              {shown.map((r, i) => {
                const t = r.ticket;
                const k = lifeKey(r);
                return (
                  <tr
                    key={t.id}
                    data-id={t.id}
                    className="ol-tix-row"
                    data-selected={selected === t.id || undefined}
                    style={{ '--i': Math.min(i, 12) } as CSSProperties}
                    onClick={() => {
                      onSelect(t.id);
                      onOpen(t.id, 'pointer');
                    }}
                  >
                    <th scope="row">
                      <button
                        className="ol-tix-id"
                        onFocus={() => onSelect(t.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(t.id);
                          onOpen(t.id, e.detail === 0 ? 'key' : 'pointer');
                        }}
                      >
                        <code>{t.id}</code>
                        <span className="mn-truncate">{t.title}</span>
                      </button>
                    </th>
                    <td className="ol-tix-when">{when(t.at)}</td>
                    <td className="ol-tix-ci">
                      {showService && <span className="mn-truncate">{serviceName(t.serviceId)}</span>}
                      <code>{t.ci}</code>
                    </td>
                    <td className="ol-tix-cause">{CAUSE_LABEL[t.cause]}</td>
                    <td className="ol-tix-life">
                      <span className="ol-life" data-life={k}>
                        {LIFECYCLE[k]}
                      </span>
                      {t.outcome === 'incident' && <span className="ol-bad">Incident</span>}
                    </td>
                    <td className="ol-tix-verdict">
                      <span className="ol-verdict" data-hand={k === 'closedByHand' || undefined}>
                        <i className="ol-swatch" data-tone={VERDICT_TONE[r.verdict]} />
                        {VERDICT_SHORT[r.verdict]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {rows.length > limit && (
          <button className="mn-btn ol-more" onClick={onMore}>
            Show {num(Math.min(PAGE, rows.length - limit))} more of {num(rows.length - limit)}
          </button>
        )}
      </div>
    </div>
  );
}
