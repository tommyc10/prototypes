/* The list column: find an incident. Search by its number, its title, the CI it was raised
 * on, the rule it fits or the group it belongs to; the tabs keep only one kind of ending.
 * Each row's mark is drawn the way the journey draws that ending, so the list and the page
 * beside it read as one thing. */

import { useEffect, useRef, useState, type RefObject } from 'react';
import { Search } from 'lucide-react';
import { shortDate } from '../../../../lib/format';
import { END_SHORT, END_TABS } from '../../model/lifecycle';
import type { EndFilter, Lifecycle } from '../../model/types';
import './IncidentSearch.css';

/** How many rows to draw at a time. */
const PAGE = 80;

export function IncidentSearch({
  hidden,
  lives,
  counts,
  filter,
  onFilter,
  query,
  onQuery,
  selectedId,
  onSelect,
  searchRef,
}: {
  hidden: boolean;
  /** What the search and tab leave, newest first. */
  lives: Lifecycle[];
  /** How many the search found under each tab. */
  counts: Record<EndFilter, number>;
  filter: EndFilter;
  onFilter: (filter: EndFilter) => void;
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
  }, [filter, query]);

  // Keep the selected row in sight.
  const index = lives.findIndex((l) => l.incident.id === selectedId);
  useEffect(() => {
    if (index >= limit) setLimit(Math.ceil((index + 1) / PAGE) * PAGE);
    else rowsRef.current?.querySelector('[data-selected]')?.scrollIntoView({ block: 'nearest' });
  }, [selectedId, index >= limit]);

  return (
    <aside className="mn-list" inert={hidden} data-tour="ic-search">
      <header className="ic-list-head">
        <div className="ic-list-title">
          <h1>Incidents</h1>
          <span className="mn-subtle">every journey</span>
        </div>
        <label className="mn-search">
          <Search size={14} />
          <input ref={searchRef} value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Find an incident, CI or rule" autoFocus />
          <kbd>/</kbd>
        </label>
        <div className="mn-tabs" role="tablist" aria-label="How the journey ended">
          {END_TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={filter === tab.key}
              className="mn-tab"
              data-active={filter === tab.key || undefined}
              onClick={() => onFilter(tab.key)}
            >
              {tab.label} <span>{counts[tab.key]}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="ic-rows" ref={rowsRef} role="listbox" aria-label="Incidents">
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
            Show older <span className="mn-subtle">{lives.length - limit} more</span>
          </button>
        )}
        {!lives.length && <div className="mn-empty">No incident matches</div>}
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
