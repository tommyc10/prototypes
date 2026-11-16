/* The ticket dock: every ticket in the scope, always beside the chapters, never at the bottom
 * of a long page. It starts on the tickets closed by hand, grouped by verdict, with each group
 * folded to one line, so the list is an overview first and a list second. Anything picked in a
 * chapter narrows it at once, and the chips along its top say what's narrowing it and let go.
 *
 * Narrow, a ticket is two lines. Widened (T), the dock takes the whole desk and each ticket is
 * one row of columns. J and K walk the tickets that are showing; Enter opens one's replay. More
 * load as the list scrolls near its end. */

import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { ChevronRight, Maximize2, Minimize2, Search, X } from 'lucide-react';
import { num } from '../../../../lib/format';
import { serviceName } from '../../data/mockData';
import { GROUP_BYS, isOpen, lifeOf, type GroupBy, type TicketGroup } from '../../model/chapters';
import { CAUSE_LABEL } from '../../model/labels';
import type { Replayed } from '../../model/replay';
import { LIFECYCLE, VERDICT_SHORT, VERDICT_TONE, type LifeKey } from '../../model/words';
import './dock.css';

export const lifeKey = lifeOf;

const when = (ms: number) =>
  new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) +
  ' ' +
  new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

export const PAGE = 80;

export interface Chip {
  key: string;
  label: ReactNode;
  onClear: () => void;
}

export function Tickets({
  rows,
  groups,
  total,
  groupBy,
  onGroupBy,
  chosen,
  onToggleGroup,
  chips,
  handOnly,
  onHandOnly,
  query,
  onQuery,
  searchRef,
  selected,
  onSelect,
  onOpen,
  limit,
  onMore,
  stale,
  wide,
  onWide,
  showService,
  ready,
}: {
  rows: Replayed[];
  groups: TicketGroup[];
  /** Every ticket in the scope, before any narrowing. */
  total: number;
  groupBy: GroupBy;
  onGroupBy: (g: GroupBy) => void;
  chosen: Record<string, boolean>;
  onToggleGroup: (key: string, open: boolean) => void;
  /** What's narrowing the list, each with a way to let go. */
  chips: Chip[];
  handOnly: boolean;
  onHandOnly: () => void;
  query: string;
  onQuery: (q: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  selected: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string, how: 'pointer' | 'key') => void;
  limit: number;
  onMore: () => void;
  stale: boolean;
  wide: boolean;
  onWide: () => void;
  showService: boolean;
  ready: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selected) return;
    scrollRef.current?.querySelector(`[data-id="${selected}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  // Load the next page as the end of what's drawn comes near.
  const more = useRef(onMore);
  more.current = onMore;
  useEffect(() => {
    const end = endRef.current;
    if (!end) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && more.current(), { root: scrollRef.current, rootMargin: '400px 0px' });
    io.observe(end);
    return () => io.disconnect();
  }, [ready]);

  // Draw the open groups' tickets up to the limit, across groups, in order.
  let budget = limit;
  let hidden = 0;
  const drawn = groups.map((g) => {
    const open = isOpen(g, groups, rows.length, chosen);
    if (!open) return { g, open, list: [] as Replayed[] };
    const list = g.rows.slice(0, Math.max(0, budget));
    budget -= list.length;
    hidden += g.rows.length - list.length;
    return { g, open, list };
  });
  const flat = groupBy === 'flat';
  const folded = !flat && drawn.every((d) => !d.open);
  const biggest = Math.max(1, ...groups.map((g) => g.rows.length));

  return (
    <aside className="ol-dock" data-wide={wide || undefined} aria-label="Tickets">
      <header className="ol-dock-head">
        <div className="ol-dock-title">
          <h2>Tickets</h2>
          <span className="ol-dock-count">
            {ready ? (
              <>
                <b>{num(rows.length)}</b> of {num(total)}
              </>
            ) : (
              'Reading'
            )}
          </span>
          <button className="mn-icon-btn ol-dock-wide" onClick={onWide} aria-pressed={wide} aria-label={wide ? 'Dock the tickets' : 'Widen the tickets'} title={wide ? 'Dock  T' : 'Widen  T'}>
            {wide ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>

        <div className="ol-dock-tools">
          <label className="mn-search ol-dock-search">
            <Search size={14} />
            <input ref={searchRef} value={query} onChange={(e) => onQuery(e.target.value)} placeholder="ID, CI or title" aria-label="Search tickets" />
            {query ? (
              <button className="ol-clear" onClick={() => onQuery('')} aria-label="Clear search">
                <X size={12} />
              </button>
            ) : (
              <kbd>/</kbd>
            )}
          </label>
          <button className="ol-dock-hand" aria-pressed={handOnly} onClick={onHandOnly} title="Only tickets closed by hand get a verdict">
            <i aria-hidden />
            By hand
          </button>
        </div>

        <div className="ol-dock-by" role="radiogroup" aria-label="Group the tickets by">
          <span className="ol-dock-by-label">Group</span>
          {GROUP_BYS.map((b) => (
            <button key={b.id} role="radio" aria-checked={groupBy === b.id} data-active={groupBy === b.id || undefined} onClick={() => onGroupBy(b.id)}>
              {b.name}
            </button>
          ))}
          <kbd className="ol-dock-by-key" title="Next grouping">
            B
          </kbd>
        </div>

        {chips.length > 0 && (
          <ul className="ol-dock-chips" aria-label="Narrowed by">
            {chips.map((c) => (
              <li key={c.key}>
                <span className="mn-truncate">{c.label}</span>
                <button onClick={c.onClear} aria-label="Let go">
                  <X size={11} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="ol-dock-scroll" ref={scrollRef} data-sheen-stale={stale || undefined}>
        {!ready ? (
          <div className="ol-dock-skel" aria-hidden>
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} className="mn-skel" style={{ width: `${52 + ((i * 29) % 40)}%` }} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="ol-empty">No tickets match. Let go of a chip above, or clear the search.</p>
        ) : (
          <>
            {wide && !folded && (
              <div className="ol-dock-cols" aria-hidden>
                <span>Ticket</span>
                <span>Opened</span>
                <span>{showService ? 'Service and CI' : 'CI'}</span>
                <span>Cause</span>
                <span>What happened</span>
                <span>Today’s logic</span>
              </div>
            )}
            {drawn.map(({ g, open, list }) => (
              <section key={g.key} className="ol-dock-group" data-open={open || undefined}>
                {!flat && (
                  <button className="ol-dock-ghead" aria-expanded={open} onClick={() => onToggleGroup(g.key, !open)}>
                    <ChevronRight size={13} className="ol-dock-chev" aria-hidden />
                    {g.tone && <i className="ol-swatch" data-tone={g.tone} />}
                    <span className="ol-dock-glabel">
                      <span className="mn-truncate">{g.label}</span>
                      {g.sub && <small className="mn-truncate">{g.sub}</small>}
                    </span>
                    <span className="ol-dock-gbar" aria-hidden>
                      <i style={{ transform: `scaleX(${g.rows.length / biggest})` }} />
                    </span>
                    {g.incidents > 0 && (
                      <span className="ol-dock-ginc" title={`${num(g.incidents)} became incidents`}>
                        {num(g.incidents)}
                      </span>
                    )}
                    <b>{num(g.rows.length)}</b>
                  </button>
                )}
                {open && list.length > 0 && (
                  <ul className="ol-dock-list">
                    {list.map((r, i) => (
                      <Row key={r.ticket.id} r={r} i={i} selected={selected === r.ticket.id} onSelect={onSelect} onOpen={onOpen} showService={showService} />
                    ))}
                  </ul>
                )}
              </section>
            ))}
            {folded && (
              <p className="ol-dock-hint">
                Open a group, or pick anything in a chapter and the tickets it counted land here. <span className="ol-bad">Red</span> counts became incidents.
              </p>
            )}
            <div ref={endRef} className="ol-dock-end">
              {hidden > 0 && (
                <button className="mn-btn ol-more" onClick={onMore}>
                  {num(hidden)} more
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

function Row({ r, i, selected, onSelect, onOpen, showService }: { r: Replayed; i: number; selected: boolean; onSelect: (id: string) => void; onOpen: (id: string, how: 'pointer' | 'key') => void; showService: boolean }) {
  const t = r.ticket;
  const k: LifeKey = lifeOf(r);
  const hand = k === 'closedByHand';
  return (
    <li>
      <button
        className="ol-trow"
        data-id={t.id}
        data-selected={selected || undefined}
        data-hand={hand || undefined}
        style={{ '--i': Math.min(i, 10) } as CSSProperties}
        onFocus={() => onSelect(t.id)}
        onClick={(e) => {
          onSelect(t.id);
          onOpen(t.id, e.detail === 0 ? 'key' : 'pointer');
        }}
      >
        <i className="ol-swatch ol-trow-tone" data-tone={VERDICT_TONE[r.verdict]} title={VERDICT_SHORT[r.verdict]} />
        <span className="ol-trow-id">
          <code>{t.id}</code>
          <span className="ol-trow-title">{t.title}</span>
        </span>
        <span className="ol-trow-when">{when(t.at)}</span>
        <span className="ol-trow-ci">
          {showService && <span className="ol-trow-svc">{serviceName(t.serviceId)}</span>}
          <code>{t.ci}</code>
        </span>
        <span className="ol-trow-cause">{CAUSE_LABEL[t.cause]}</span>
        <span className="ol-trow-life">
          {t.outcome === 'incident' && <span className="ol-trow-inc">Incident</span>}
          <span className="ol-life" data-life={k}>
            {LIFECYCLE[k]}
          </span>
        </span>
        <span className="ol-trow-verdict">{VERDICT_SHORT[r.verdict]}</span>
      </button>
    </li>
  );
}
