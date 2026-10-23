/* The list column: find an incident. It starts with the latest few, and the search finds
 * any other by its number, its title, the CI it was raised on, the rule it fits or the group
 * it belongs to. It never holds every incident, so it never counts them: the line under the
 * search says exactly what the rows are ("The 12 latest", "132 match, showing 50").
 * Each row's mark is drawn the way the journey draws that ending, so the list and the page
 * beside it read as one thing. */

import { useEffect, useRef, useState, type RefObject } from 'react';
import { Search } from 'lucide-react';
import { num, shortDate } from '../../../../lib/format';
import { END_SHORT } from '../../model/lifecycle';
import type { Lifecycle } from '../../model/types';
import './IncidentSearch.css';

/** How many rows to draw at a time. */
const PAGE = 50;

export function IncidentSearch({
  hidden,
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
  const says = searching
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

      <div className="ic-rows" ref={rowsRef} role="listbox" aria-label="Incidents" data-searching={searching || undefined}>
        {lives.slice(0, limit).map((life) => (
          <div
            key={life.incident.id}
            role="option"
            aria-selected={life.incident.id === selectedId}
            className="ic-row"
            data-selected={life.incident.id === selectedId || undefined}
            data-end={life.end}
            data-real={life.real || undefined}
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
        {!lives.length && !searching && <div className="mn-empty">Nothing fits “{asked}”. Try its number, its CI or fewer words.</div>}
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
