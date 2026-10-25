/* The list column: everyone who's been let in, and whoever's been invited and hasn't signed
 * in yet. Search finds people by name or email, and also by what they can see: "reactor"
 * lists everyone who can see Reactor Core, which is the question an admin is usually asking.
 *
 * It's the same frame as every other page's list column: title, search, tabs, rows, keys. */

import type { RefObject } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { initials, type Match } from '../../model/people';
import { coveredGroups } from '../../model/scopes';
import type { Person } from '../../model/types';
import './PeopleList.css';

export type Show = 'everyone' | 'invited' | 'admins';

export function PeopleList({
  hidden,
  matches,
  counts,
  show,
  onShow,
  selectedId,
  inviting,
  edited,
  arrived,
  onPick,
  onInvite,
  query,
  onQuery,
  searchRef,
}: {
  hidden: boolean;
  /** Who the search and the tab let through, in order. */
  matches: Match[];
  /** How many each tab would show, under the search. */
  counts: Record<Show, number>;
  show: Show;
  onShow: (show: Show) => void;
  selectedId: string | null;
  /** The invitation is open in the pane. */
  inviting: boolean;
  /** People with changes not saved yet. */
  edited: Set<string>;
  /** People just invited, who rise into the list. */
  arrived: Set<string>;
  onPick: (person: Person) => void;
  onInvite: (via: 'key' | 'pointer') => void;
  query: string;
  onQuery: (query: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
}) {
  return (
    <aside className="mn-list" inert={hidden}>
      <header className="ac-list-head">
        <div className="ac-list-title">
          <h1>Access</h1>
          <button className="mn-btn ac-invite" onClick={(e) => onInvite(e.detail > 0 ? 'pointer' : 'key')} data-active={inviting || undefined}>
            <UserPlus size={15} />
            Invite
            <kbd>N</kbd>
          </button>
        </div>
        <label className="mn-search">
          <Search size={14} />
          <input ref={searchRef} value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search people, emails or groups" />
          <kbd>/</kbd>
        </label>
        <div className="mn-tabs" role="tablist" aria-label="Show">
          {(
            [
              ['everyone', 'Everyone'],
              ['invited', 'Invited'],
              ['admins', 'Admins'],
            ] as const
          ).map(([key, label]) => (
            <button key={key} role="tab" aria-selected={show === key} className="mn-tab" data-active={show === key || undefined} onClick={() => onShow(key)}>
              {label} <span>{counts[key]}</span>
            </button>
          ))}
        </div>
        <div className="ac-list-cols" aria-hidden>
          <span>Person</span>
          <span>Groups</span>
        </div>
      </header>

      <nav className="ac-rows" aria-label="People">
        {matches.map(({ person, via }) => (
          <button
            key={person.id}
            className="ac-row"
            aria-current={person.id === selectedId || undefined}
            data-invited={person.status === 'invited' || undefined}
            data-arrived={arrived.has(person.id) || undefined}
            onClick={() => onPick(person)}
          >
            <span className="mn-avatar ac-row-avatar" aria-hidden>
              {initials(person.name)}
            </span>
            <span className="ac-row-text">
              <span className="ac-row-name">
                <b className="mn-truncate">{person.name}</b>
                {person.role === 'admin' && <span className="ac-chip-quiet">Admin</span>}
                {person.status === 'invited' && (
                  <span className="ac-chip-quiet" data-status="invited">
                    <span className="mn-dot" data-status="proposed" />
                    Invited
                  </span>
                )}
              </span>
              <span className="ac-row-meta mn-truncate">{via ? <>Sees {via}</> : person.email}</span>
            </span>
            {edited.has(person.id) ? (
              <span className="ac-row-edited" title="Changes not saved yet">
                Unsaved
              </span>
            ) : (
              <span className="ac-row-count" title="Assignment groups they can see">
                {coveredGroups(person.grants).size}
              </span>
            )}
          </button>
        ))}
        {!matches.length && (
          <div className="mn-empty ac-rows-empty">
            {query.trim() ? `Nobody matches “${query.trim()}”, by name, email or what they can see.` : show === 'invited' ? 'No invitations waiting. Everyone invited has signed in.' : 'Nobody here yet.'}
          </div>
        )}
      </nav>

      <footer className="ac-list-foot">
        <span>
          <kbd>J</kbd> <kbd>K</kbd> Navigate
        </span>
        <span>
          <kbd>N</kbd> Invite
        </span>
        <span>
          <kbd>⌘K</kbd> Commands
        </span>
      </footer>
    </aside>
  );
}
