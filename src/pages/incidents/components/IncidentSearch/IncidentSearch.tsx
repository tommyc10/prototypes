/* The list column: find an incident. It starts with the latest few, and the search finds
 * any other by its number, its title, the CI it was raised on, the rule it fits or the group
 * it belongs to. It never holds every incident, so it never counts them: the line under the
 * search says exactly what the rows are ("The 12 latest", "132 match, showing 50").
 * Each row's mark is drawn the way the journey draws that ending, so the list and the page
 * beside it read as one thing.
 *
 * While rows are on their way it sheens (see mn-skel in styles/ui.css): on first load, a
 * shape for each of the latest few, cut to a real row's size so each row lands where its
 * shape was; during a search, the rows already there stay (J and K still step through them),
 * sit back and take the same light. */

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { Search } from 'lucide-react';
import { num, shortDate } from '../../../../lib/format';
import { END_SHORT } from '../../model/lifecycle';
import type { Lifecycle } from '../../model/types';
import './IncidentSearch.css';

/** How many rows to draw at a time. */
const PAGE = 50;
/** Shapes for rows to come when there are no rows to keep (a search after one that found nothing). */
const FEWEST = 4;

/** The same widths every time, so the shapes don't jump between loads. */
const spread = (i: number, min: number, max: number) => min + (((i * 37 + 11) % 23) / 22) * (max - min);

/** A row to come: a real row's boxes, each a shape. */
function RowShape({ i }: { i: number }) {
  const shape = (width: string | number, height: number, pill?: boolean) => (
    <span className="mn-skel" data-shape={pill ? 'pill' : undefined} style={{ width, height } as CSSProperties} />
  );
  return (
    <div className="ic-row ic-row-shape" aria-hidden>
      {shape(7, 7, true)}
      <div className="ic-row-main">
        <div className="ic-row-title">{shape(`${spread(i, 52, 88)}%`, 10)}</div>
        <div className="ic-row-sub">
          {shape(62, 8)}
          {shape(spread(i + 5, 34, 56), 8)}
        </div>
      </div>
      {shape(36, 8)}
    </div>
  );
}

export function IncidentSearch({
  hidden,
  loading,
  lives,
  asked,
  searching,
  query,
  onQuery,
  selectedId,
  onSelect,
  searchRef,
}: {
  hidden: boolean;
  /** The latest few are on their way (the page has just opened): there are no rows yet. */
  loading?: { count: number } | null;
  /** The latest few, or what the search found, newest first. */
  lives: Lifecycle[];
  /** The search those rows answer. Empty for the latest few. */
  asked: string;
  /** A newer search is on its way. */
  searching: boolean;
  query: string;
  onQuery: (query: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
}) {
  const [limit, setLimit] = useState(PAGE);
  const rowsRef = useRef<HTMLDivElement>(null);

  // A different question starts from the top again.
  useEffect(() => {
    setLimit(PAGE);
    rowsRef.current?.scrollTo({ top: 0 });
  }, [asked]);

  // Keep the selected row in sight.
  const index = lives.findIndex((l) => l.incident.id === selectedId);
  useEffect(() => {
    if (index >= limit) setLimit(Math.ceil((index + 1) / PAGE) * PAGE);
    else rowsRef.current?.querySelector('[data-selected]')?.scrollIntoView({ block: 'nearest' });
  }, [selectedId, index >= limit]);

  const shown = Math.min(limit, lives.length);
  // What the rows are, in words. Never a total of everything: only of what was asked for.
  const says = loading
    ? `Fetching the ${loading.count} latest…`
    : searching
    ? `Searching for “${query.trim()}”…`
    : !asked
      ? `The ${lives.length} latest. Search to find any other.`
      : !lives.length
        ? 'No incident matches.'
        : lives.length > shown
          ? `${num(lives.length)} match, showing ${shown}.`
          : `${num(lives.length)} ${lives.length === 1 ? 'matches' : 'match'}.`;

  return (
    <aside className="mn-list" inert={hidden} data-tour="ic-search">
      <header className="ic-list-head">
        <div className="ic-list-title">
          <h1>Incidents</h1>
          <span className="mn-subtle">find one</span>
        </div>
        <label className="mn-search">
          <Search size={14} />
          <input ref={searchRef} value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Find an incident, CI or rule" autoFocus />
          <kbd>/</kbd>
        </label>
        <p className="ic-list-says mn-truncate" aria-live="polite">
          {says}
        </p>
      </header>

      <div className="ic-rows" ref={rowsRef} role="listbox" aria-label="Incidents" aria-busy={Boolean(loading) || searching}>
        {(loading || (searching && !lives.length)) &&
          Array.from({ length: loading ? loading.count : FEWEST }, (_, i) => <RowShape key={i} i={i} />)}
        {lives.slice(0, limit).map((life) => (
          <div
            key={life.incident.id}
            role="option"
            aria-selected={life.incident.id === selectedId}
            className="ic-row"
            data-selected={life.incident.id === selectedId || undefined}
            data-end={life.end}
            data-real={life.real || undefined}
            data-sheen-stale={searching || undefined}
            onClick={() => onSelect(life.incident.id)}
          >
            <i aria-hidden />
            <div className="ic-row-main">
              <div className="ic-row-title mn-truncate">{life.incident.title}</div>
              <div className="ic-row-sub mn-truncate">
                <span className="mn-mono">{life.incident.id}</span>
                <span className="ic-row-end">{END_SHORT[life.end]}</span>
              </div>
            </div>
            <time className="mn-subtle">{shortDate(life.incident.openedAt)}</time>
          </div>
        ))}
        {lives.length > limit && (
          <button className="ic-more" onClick={() => setLimit(limit + PAGE)}>
            Show more <span className="mn-subtle">{num(lives.length - limit)} left</span>
          </button>
        )}
        {!lives.length && !searching && !loading && <div className="mn-empty">Nothing fits “{asked}”. Try its number, its CI or fewer words.</div>}
      </div>

      <footer className="ic-list-foot">
        <span>
          <kbd>J</kbd> <kbd>K</kbd> Navigate
        </span>
        <span>
          <kbd>/</kbd> Search
        </span>
        <span>
          <kbd>⌘K</kbd> Commands
        </span>
      </footer>
    </aside>
  );
}
