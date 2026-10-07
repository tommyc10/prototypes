/* The list column: every change window, the ones that need watching first. Search, the
 * tabs (in place, upcoming, ended), and one row per window with the one thing worth
 * knowing about its timing. It's also the schedule's table view. */

import { useEffect, useRef, type RefObject } from 'react';
import { Search } from 'lucide-react';
import { groupById } from '../../../rule-management/data/mockData';
import type { ChangeWindow, ListFilter } from '../../model/types';
import { LIST_TABS, statusOf, timing } from '../../model/windows';
import './WindowList.css';

export function WindowList({
  hidden,
  windows,
  counts,
  now,
  filter,
  onFilter,
  query,
  onQuery,
  selectedKey,
  onSelect,
  searchRef,
}: {
  hidden: boolean;
  /** What the search and tab leave, in list order. */
  windows: ChangeWindow[];
  /** How many the search found under each tab. */
  counts: Record<ListFilter, number>;
  now: number;
  filter: ListFilter;
  onFilter: (filter: ListFilter) => void;
  query: string;
  onQuery: (query: string) => void;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
}) {
  const rowsRef = useRef<HTMLDivElement>(null);
  // Keep the selected row in sight (it may have been picked on the schedule).
  useEffect(() => {
    rowsRef.current?.querySelector('[data-selected]')?.scrollIntoView({ block: 'nearest' });
  }, [selectedKey]);

  return (
    <aside className="mn-list" inert={hidden} data-tour="cw-list">
      <header className="cw-list-head">
        <div className="cw-list-title">
          <h1>Change windows</h1>
        </div>
        <label className="mn-search">
          <Search size={14} />
          <input ref={searchRef} value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search windows, tickets, groups" />
          <kbd>/</kbd>
        </label>
        <div className="mn-tabs" role="tablist" aria-label="Which windows">
          {LIST_TABS.map((tab) => (
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

      <div className="cw-rows" ref={rowsRef} role="listbox" aria-label="Change windows">
        {windows.map((w) => {
          const status = statusOf(w, now);
          return (
            <div
              key={w.key}
              role="option"
              aria-selected={w.key === selectedKey}
              className="cw-row"
              data-selected={w.key === selectedKey || undefined}
              data-status={status}
              onClick={() => onSelect(w.key)}
            >
              <i data-status={status} aria-hidden />
              <div className="cw-row-main">
                <div className="cw-row-name mn-truncate">{w.name}</div>
                <div className="cw-row-sub mn-truncate">
                  <span className="mn-mono">{w.id}</span>
                  {groupById(w.groupId).name}
                </div>
              </div>
              <div className="cw-row-when">{timing(w, now)}</div>
            </div>
          );
        })}
        {!windows.length && <div className="mn-empty">No change windows match</div>}
      </div>

      <footer className="cw-list-foot">
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
