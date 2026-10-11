/* The list column: the windows sorted into categories (each group, or each family of CI
 * where nobody set a group), with how many are in place and late in each. The ones with
 * something late lead. Pick one and the detail pane draws its windows (see GroupTimeline).
 *
 * It's the same frame as every other page's list column: title, search, rows, keys. */

import type { RefObject } from 'react';
import { Search } from 'lucide-react';
import { EVERY, type Group } from '../../model/categories';
import './GroupList.css';

/** The list column: every category, what's in place and late in each. */
export function GroupList({
  hidden,
  groups,
  group,
  onPick,
  noun,
  query,
  onQuery,
  searchRef,
}: {
  hidden: boolean;
  groups: Group[];
  group?: Group;
  onPick: (key: string) => void;
  /** What a category is here: "group", "CI family". */
  noun: string;
  query: string;
  onQuery: (query: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
}) {
  const busiest = Math.max(1, ...groups.filter((g) => g.category !== EVERY).map((g) => g.inPlace));
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
        <div className="cw-groups-cols">
          <span>By {noun}</span>
          <span>In place</span>
        </div>
      </header>

      <nav className="cw-rows cw-groups-list" aria-label={`Each ${noun}`}>
        {groups.map((g) => (
          <button
            key={g.category.key}
            className="cw-group"
            aria-current={g === group || undefined}
            data-every={g.category === EVERY || undefined}
            onClick={() => onPick(g.category.key)}
          >
            <span className="cw-group-name mn-truncate">
              <b data-mono={g.category.mono || undefined}>{g.category.label}</b>
              {g.category.sub && <small>{g.category.sub}</small>}
            </span>
            {g.late > 0 && <em>{g.late} late</em>}
            <span className="cw-group-count">{g.inPlace}</span>
            {/* How busy it is beside the busiest, and how much of that is late. */}
            {g.category !== EVERY && (
              <span className="cw-group-meter" aria-hidden>
                <i
                  style={{
                    width: `${((g.inPlace - g.late) / busiest) * 100}%`,
                  }}
                />
                {g.late > 0 && <i data-late style={{ width: `${(g.late / busiest) * 100}%` }} />}
              </span>
            )}
          </button>
        ))}
        {!groups.length && <div className="mn-empty">No change windows match</div>}
      </nav>

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
